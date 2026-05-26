import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";

import { readJsonBody, sendJson, setCorsHeaders } from "../api/ai/_http.js";
import {
  createExample,
  createNaturalMeanings,
  getErrorStatusCode,
  getPublicErrorMessage,
} from "../api/ai/_openai.js";

const loadedEnvKeys = new Set();

function parseEnvValue(value) {
  const trimmed = value.trim();
  const quote = trimmed[0];

  if (
    (quote === '"' || quote === "'") &&
    trimmed.endsWith(quote) &&
    trimmed.length >= 2
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function loadEnvFile(fileName) {
  const filePath = resolve(process.cwd(), fileName);

  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = parseEnvValue(trimmed.slice(separatorIndex + 1));

    if (process.env[key] === undefined || loadedEnvKeys.has(key)) {
      process.env[key] = value;
      loadedEnvKeys.add(key);
    }
  }
}

function parsePort(value, fallback) {
  const port = Number.parseInt(value ?? "", 10);

  if (Number.isInteger(port) && port > 0) {
    return port;
  }

  return fallback;
}

function resolveHost() {
  const configuredHost = process.env.AI_API_HOST?.trim();

  if (configuredHost) {
    return configuredHost;
  }

  return process.env.RENDER === "true" ? "0.0.0.0" : "127.0.0.1";
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const port = parsePort(process.env.PORT ?? process.env.AI_API_PORT, 8787);
const host = resolveHost();
const healthCheckPaths = new Set(["/", "/health", "/healthz"]);
const dictionaryApiBaseUrl = "https://www.dictionaryapi.com/api/v3/references";
const dictionaryCacheTtlMs = 24 * 60 * 60 * 1000;
const dictionaryCacheMaxEntries = 500;
const dictionaryResponseLimitMax = 96;
const dictionaryResponseCache = new Map();

function getDictionaryApiKey() {
  return process.env.DICTIONARY_API_KEY?.trim() ?? "";
}

function getDictionaryApiReference() {
  const reference =
    process.env.DICTIONARY_API_REFERENCE?.trim() || "collegiate";

  return /^[a-z0-9-]+$/i.test(reference) ? reference : "collegiate";
}

function createDictionaryCacheKey(reference, word) {
  return `${reference}:${word.trim().replace(/\s+/g, " ").toLowerCase()}`;
}

function parseDictionaryResponseLimit(value) {
  const limit = Number.parseInt(value ?? "", 10);

  if (!Number.isInteger(limit) || limit <= 0) {
    return null;
  }

  return Math.min(limit, dictionaryResponseLimitMax);
}

function getRecord(value) {
  return typeof value === "object" && value !== null ? value : null;
}

function getStringField(value, key) {
  const record = getRecord(value);
  const fieldValue = record?.[key];

  return typeof fieldValue === "string" ? fieldValue : null;
}

function getTopSenseNumber(value) {
  return value?.match(/\d+/)?.[0] ?? null;
}

function hasDefinitionText(value) {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.some(
    (item) =>
      Array.isArray(item) &&
      item[0] === "text" &&
      typeof item[1] === "string" &&
      item[1].trim().length > 0,
  );
}

function hasSenseDefinitionText(sense) {
  const senseRecord = getRecord(sense);
  const supplementalSense = getRecord(senseRecord?.sdsense);

  return (
    hasDefinitionText(senseRecord?.dt) ||
    hasDefinitionText(supplementalSense?.dt)
  );
}

function consumeSenseDefinitionGroup(sense, context) {
  const explicitSenseNumber = getTopSenseNumber(getStringField(sense, "sn"));
  const nextSenseNumber =
    explicitSenseNumber ??
    context.pendingSenseNumber ??
    context.activeSenseNumber;

  if (nextSenseNumber === null) {
    return true;
  }

  const isNewDefinitionGroup =
    hasSenseDefinitionText(sense) &&
    !context.seenSenseNumbers.has(nextSenseNumber);

  if (isNewDefinitionGroup) {
    if (context.remainingDefinitionCount <= 0) {
      return false;
    }

    context.seenSenseNumbers.add(nextSenseNumber);
    context.remainingDefinitionCount -= 1;
  }

  context.activeSenseNumber = nextSenseNumber;
  context.pendingSenseNumber = null;

  return true;
}

function limitDefinitionSequence(value, context) {
  if (!Array.isArray(value)) {
    return value;
  }

  if (typeof value[0] === "string") {
    const [type, payload] = value;

    if (type === "sen") {
      const pendingSenseNumber = getTopSenseNumber(
        getStringField(payload, "sn"),
      );

      context.pendingSenseNumber = pendingSenseNumber;
      context.activeSenseNumber =
        pendingSenseNumber ?? context.activeSenseNumber;

      return [...value];
    }

    if (type === "sense") {
      return consumeSenseDefinitionGroup(payload, context) ? [...value] : null;
    }

    if (type === "bs") {
      const payloadRecord = getRecord(payload);

      return consumeSenseDefinitionGroup(payloadRecord?.sense, context)
        ? [...value]
        : null;
    }

    if (type === "pseq") {
      const nextPayload = limitDefinitionSequence(payload, context);

      return Array.isArray(nextPayload) && nextPayload.length > 0
        ? [type, nextPayload]
        : null;
    }
  }

  const nextItems = [];

  for (const item of value) {
    const nextItem = limitDefinitionSequence(item, context);

    if (
      nextItem !== null &&
      !(Array.isArray(nextItem) && nextItem.length === 0)
    ) {
      nextItems.push(nextItem);
    }
  }

  return nextItems;
}

function limitDefinitionBlocks(definitions, context) {
  if (!Array.isArray(definitions)) {
    return definitions;
  }

  const nextDefinitions = [];

  for (const definitionBlock of definitions) {
    const definitionRecord = getRecord(definitionBlock);

    if (!Array.isArray(definitionRecord?.sseq)) {
      nextDefinitions.push(definitionBlock);
      continue;
    }

    const nextSequence = limitDefinitionSequence(
      definitionRecord.sseq,
      context,
    );

    if (Array.isArray(nextSequence) && nextSequence.length > 0) {
      nextDefinitions.push({
        ...definitionRecord,
        sseq: nextSequence,
      });
    }

    if (context.remainingDefinitionCount <= 0) {
      break;
    }
  }

  return nextDefinitions;
}

function createDictionaryLimitContext(limit) {
  return {
    activeSenseNumber: null,
    pendingSenseNumber: null,
    remainingDefinitionCount: limit,
    seenSenseNumbers: new Set(),
  };
}

function countConsumedDefinitions(context, initialLimit) {
  return initialLimit - context.remainingDefinitionCount;
}

function limitDictionaryEntry(entry, remainingDefinitionCount) {
  const entryRecord = getRecord(entry);

  if (entryRecord === null) {
    return {
      entry,
      consumedDefinitionCount: 0,
    };
  }

  const context = createDictionaryLimitContext(remainingDefinitionCount);
  const nextEntry = {
    meta: entryRecord.meta,
    hwi: entryRecord.hwi,
    fl: entryRecord.fl,
  };

  if (Array.isArray(entryRecord.def)) {
    nextEntry.def = limitDefinitionBlocks(entryRecord.def, context);
  }

  let consumedDefinitionCount = countConsumedDefinitions(
    context,
    remainingDefinitionCount,
  );

  if (consumedDefinitionCount > 0) {
    if (Array.isArray(entryRecord.shortdef)) {
      nextEntry.shortdef = [];
    }

    return {
      entry: nextEntry,
      consumedDefinitionCount,
    };
  }

  if (Array.isArray(entryRecord.shortdef)) {
    const nextShortDefinitions = entryRecord.shortdef.slice(
      0,
      remainingDefinitionCount,
    );

    nextEntry.shortdef = nextShortDefinitions;
    consumedDefinitionCount = nextShortDefinitions.length;
  }

  return {
    entry: nextEntry,
    consumedDefinitionCount,
  };
}

function limitDictionaryPayload(payload, requestedLimit) {
  if (requestedLimit === null || !Array.isArray(payload)) {
    return payload;
  }

  const responseDefinitionLimit = requestedLimit + 1;
  let remainingDefinitionCount = responseDefinitionLimit;
  const nextPayload = [];

  for (const item of payload) {
    if (remainingDefinitionCount <= 0) {
      break;
    }

    if (typeof item !== "object" || item === null) {
      nextPayload.push(item);
      continue;
    }

    const { entry, consumedDefinitionCount } = limitDictionaryEntry(
      item,
      remainingDefinitionCount,
    );

    if (consumedDefinitionCount > 0) {
      nextPayload.push(entry);
      remainingDefinitionCount -= consumedDefinitionCount;
    }
  }

  return nextPayload.length > 0 ? nextPayload : payload;
}

function getCachedDictionaryPayload(cacheKey) {
  const cachedEntry = dictionaryResponseCache.get(cacheKey);

  if (cachedEntry === undefined) {
    return null;
  }

  if (Date.now() - cachedEntry.updatedAt > dictionaryCacheTtlMs) {
    dictionaryResponseCache.delete(cacheKey);
    return null;
  }

  return cachedEntry.payload;
}

function pruneDictionaryCache() {
  if (dictionaryResponseCache.size <= dictionaryCacheMaxEntries) {
    return;
  }

  const entriesByAge = [...dictionaryResponseCache.entries()].sort(
    (left, right) => left[1].updatedAt - right[1].updatedAt,
  );
  const deleteCount = dictionaryResponseCache.size - dictionaryCacheMaxEntries;

  entriesByAge.slice(0, deleteCount).forEach(([cacheKey]) => {
    dictionaryResponseCache.delete(cacheKey);
  });
}

function setDictionaryCacheHeaders(response) {
  response.setHeader(
    "Cache-Control",
    "public, max-age=86400, stale-while-revalidate=604800",
  );
}

async function handleAiRequest(request, response, routeHandler) {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const payload = await routeHandler(body);

    sendJson(response, 200, payload);
  } catch (error) {
    sendJson(response, getErrorStatusCode(error), {
      error: getPublicErrorMessage(error),
    });
  }
}

async function handleDictionaryRequest(request, response, url) {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const word = url.searchParams.get("word")?.trim() ?? "";

  if (word.length === 0) {
    sendJson(response, 400, { error: "word query is required" });
    return;
  }

  const apiKey = getDictionaryApiKey();

  if (apiKey.length === 0) {
    sendJson(response, 503, {
      error: "Dictionary API key is not configured",
    });
    return;
  }

  const reference = getDictionaryApiReference();
  const responseLimit = parseDictionaryResponseLimit(
    url.searchParams.get("limit"),
  );
  const cacheKey = createDictionaryCacheKey(reference, word);
  const cachedPayload = getCachedDictionaryPayload(cacheKey);

  if (cachedPayload !== null) {
    setDictionaryCacheHeaders(response);
    sendJson(
      response,
      200,
      limitDictionaryPayload(cachedPayload, responseLimit),
    );
    return;
  }

  const upstreamUrl = new URL(
    `${dictionaryApiBaseUrl}/${reference}/json/${encodeURIComponent(word)}`,
  );

  upstreamUrl.searchParams.set("key", apiKey);

  try {
    const upstreamResponse = await fetch(upstreamUrl);

    if (!upstreamResponse.ok) {
      sendJson(response, 502, { error: "Dictionary API request failed" });
      return;
    }

    const payload = await upstreamResponse.json();

    dictionaryResponseCache.set(cacheKey, {
      payload,
      updatedAt: Date.now(),
    });
    pruneDictionaryCache();
    setDictionaryCacheHeaders(response);
    sendJson(response, 200, limitDictionaryPayload(payload, responseLimit));
  } catch {
    sendJson(response, 502, { error: "Dictionary API request failed" });
  }
}

const server = createServer((request, response) => {
  const baseUrl = `http://${request.headers.host ?? "127.0.0.1"}`;
  const url = new URL(request.url ?? "/", baseUrl);

  if (request.method === "GET" && healthCheckPaths.has(url.pathname)) {
    sendJson(response, 200, { ok: true, service: "vocachip-ai-api" });
    return;
  }

  if (url.pathname === "/api/ai/meanings") {
    void handleAiRequest(request, response, createNaturalMeanings);
    return;
  }

  if (url.pathname === "/api/ai/example") {
    void handleAiRequest(request, response, createExample);
    return;
  }

  if (url.pathname === "/api/dictionary/search") {
    void handleDictionaryRequest(request, response, url);
    return;
  }

  sendJson(response, 404, { error: "Not found" });
});

server.listen(port, host, () => {
  console.log(`AI API server listening on http://${host}:${port}`);
});
