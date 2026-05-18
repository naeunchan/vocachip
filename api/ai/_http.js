export function setCorsHeaders(response) {
  response.setHeader(
    "Access-Control-Allow-Origin",
    process.env.AI_ALLOWED_ORIGIN?.trim() || "*",
  );
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
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
