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

const server = createServer((request, response) => {
  const baseUrl = `http://${request.headers.host ?? "127.0.0.1"}`;
  const url = new URL(request.url ?? "/", baseUrl);

  if (
    request.method === "GET" &&
    (url.pathname === "/" || url.pathname === "/healthz")
  ) {
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

  sendJson(response, 404, { error: "Not found" });
});

server.listen(port, host, () => {
  console.log(`AI API server listening on http://${host}:${port}`);
});
