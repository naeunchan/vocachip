import { readJsonBody, sendJson, setCorsHeaders } from "./_http.js";
import {
  createExample,
  getErrorStatusCode,
  getPublicErrorMessage,
} from "./_openai.js";

export default async function handler(request, response) {
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
    const payload = await createExample(body);

    sendJson(response, 200, payload);
  } catch (error) {
    sendJson(response, getErrorStatusCode(error), {
      error: getPublicErrorMessage(error),
    });
  }
}
