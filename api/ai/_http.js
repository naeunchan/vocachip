function getRequestOrigin(request) {
  const origin = request?.headers?.origin;

  return typeof origin === "string" && origin.trim().length > 0
    ? origin.trim()
    : null;
}

function getAllowedOrigins() {
  return (process.env.AI_ALLOWED_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function isLocalDevelopmentOrigin(origin) {
  try {
    const url = new URL(origin);

    return (
      (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
      (url.protocol === "http:" || url.protocol === "https:")
    );
  } catch {
    return false;
  }
}

function shouldAllowLocalDevelopmentOrigin() {
  return process.env.RENDER !== "true" && process.env.NODE_ENV !== "production";
}

export function isCorsRequestAllowed(request) {
  const origin = getRequestOrigin(request);

  if (origin === null) {
    return true;
  }

  const allowedOrigins = getAllowedOrigins();

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  return shouldAllowLocalDevelopmentOrigin() && isLocalDevelopmentOrigin(origin);
}

export function setCorsHeaders(response, request) {
  const origin = getRequestOrigin(request);

  response.setHeader("Vary", "Origin");

  if (origin !== null && isCorsRequestAllowed(request)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
  }

  response.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, OPTIONS",
  );
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function rejectDisallowedCorsRequest(request, response) {
  setCorsHeaders(response, request);

  if (isCorsRequestAllowed(request)) {
    return false;
  }

  sendJson(response, 403, { error: "Origin is not allowed" });
  return true;
}

export function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

export async function readJsonBody(request) {
  if (request.body !== undefined) {
    if (typeof request.body === "string") {
      return request.body.trim().length === 0 ? {} : JSON.parse(request.body);
    }

    return request.body;
  }

  const chunks = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();

  return rawBody.length === 0 ? {} : JSON.parse(rawBody);
}
