const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4.1-mini";

const meaningResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["meanings"],
  properties: {
    meanings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "meaning"],
        properties: {
          id: { type: "string" },
          meaning: { type: "string" },
        },
      },
    },
  },
};

const exampleResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["example"],
  properties: {
    example: { type: "string" },
  },
};

function createHttpError(statusCode, message) {
  const error = new Error(message);

  error.statusCode = statusCode;

  return error;
}

export function getErrorStatusCode(error) {
  return Number.isInteger(error?.statusCode) ? error.statusCode : 500;
}

export function getPublicErrorMessage(error) {
  const statusCode = getErrorStatusCode(error);

  if (statusCode >= 400 && statusCode < 500) {
    return error.message;
  }

  if (error?.message === "OPENAI_API_KEY is not configured") {
    return error.message;
  }

  return "AI request failed";
}

function getOpenAiApiKey() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw createHttpError(500, "OPENAI_API_KEY is not configured");
  }

  return apiKey;
}

function getOpenAiModel() {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

function getRecord(value) {
  return typeof value === "object" && value !== null ? value : null;
}

function getString(value, maxLength) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length === 0) {
    return null;
  }

  return normalized.slice(0, maxLength);
}

function getResponseText(payload) {
  if (typeof payload?.output_text === "string") {
    return payload.output_text;
  }

  if (!Array.isArray(payload?.output)) {
    return null;
  }

  return payload.output
    .flatMap((item) => (Array.isArray(item?.content) ? item.content : []))
    .map((content) => {
      if (typeof content?.text === "string") {
        return content.text;
      }

      if (typeof content?.output_text === "string") {
        return content.output_text;
      }

      return "";
    })
    .join("")
    .trim();
}

async function createStructuredResponse({
  input,
  instructions,
  maxOutputTokens,
  schema,
  schemaName,
}) {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getOpenAiApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getOpenAiModel(),
      instructions,
      input,
      max_output_tokens: maxOutputTokens,
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema,
        },
      },
    }),
  });
  const rawPayload = await response.text();
  const payload = rawPayload.length > 0 ? JSON.parse(rawPayload) : {};

  if (!response.ok) {
    throw createHttpError(502, "OpenAI response was not successful");
  }

  const outputText = getResponseText(payload);

  if (outputText === null || outputText.length === 0) {
    throw createHttpError(502, "OpenAI response was empty");
  }

  return JSON.parse(outputText);
}

function parseMeaningRequest(body) {
  const record = getRecord(body);
  const word = getString(record?.word, 80);
  const rawItems = Array.isArray(record?.items) ? record.items : [];
  const items = rawItems
    .map((item, index) => {
      const itemRecord = getRecord(item);
      const definition = getString(itemRecord?.definition, 500);

      if (definition === null) {
        return null;
      }

      return {
        id: getString(itemRecord?.id, 64) ?? String(index),
        partOfSpeech: getString(itemRecord?.partOfSpeech, 80) ?? "unknown",
        definition,
        currentMeaning: getString(itemRecord?.currentMeaning, 240),
      };
    })
    .filter(Boolean);

  if (word === null || items.length === 0) {
    throw createHttpError(400, "word and items are required");
  }

  return { word, items };
}

function parseExampleRequest(body) {
  const record = getRecord(body);
  const word = getString(record?.word, 80);
  const partOfSpeech = getString(record?.partOfSpeech, 80) ?? "unknown";
  const meaning = getString(record?.meaning, 240);
  const definition = getString(record?.definition, 500);

  if (word === null || meaning === null || definition === null) {
    throw createHttpError(400, "word, meaning, and definition are required");
  }

  return { word, partOfSpeech, meaning, definition };
}

export async function createNaturalMeanings(body) {
  const request = parseMeaningRequest(body);
  const result = await createStructuredResponse({
    schemaName: "vocachip_meanings",
    schema: meaningResponseSchema,
    maxOutputTokens: Math.min(1200, 200 + request.items.length * 80),
    instructions: [
      "당신은 영어 단어장용 한영 사전 편집자입니다.",
      "각 영어 definition을 한국어 학습자가 바로 이해할 수 있는 짧은 사전 뜻으로 다듬으세요.",
      "영어 원문, 예문, 번호, 불필요한 설명은 넣지 마세요.",
      "currentMeaning이 이미 자연스러우면 그 뜻을 유지해도 됩니다.",
      "입력된 모든 id에 대해 하나씩 응답하세요.",
    ].join(" "),
    input: JSON.stringify({
      word: request.word,
      items: request.items,
    }),
  });
  const requestIds = new Set(request.items.map((item) => item.id));
  const meanings = Array.isArray(result.meanings) ? result.meanings : [];

  return {
    meanings: meanings
      .map((item) => {
        const record = getRecord(item);
        const id = getString(record?.id, 64);
        const meaning = getString(record?.meaning, 120);

        if (id === null || meaning === null || !requestIds.has(id)) {
          return null;
        }

        return { id, meaning };
      })
      .filter(Boolean),
  };
}

export async function createExample(body) {
  const request = parseExampleRequest(body);
  const result = await createStructuredResponse({
    schemaName: "vocachip_example",
    schema: exampleResponseSchema,
    maxOutputTokens: 120,
    instructions: [
      "당신은 영어 어휘 학습용 예문 작성자입니다.",
      "주어진 단어를 같은 의미로 사용하는 자연스러운 영어 예문 한 문장만 만드세요.",
      "B1-B2 수준으로 8-16단어를 권장합니다.",
      "한국어 번역, 따옴표, 마크다운, 해설은 넣지 마세요.",
    ].join(" "),
    input: JSON.stringify(request),
  });
  const example = getString(result.example, 180);

  if (example === null) {
    throw createHttpError(502, "OpenAI response did not include an example");
  }

  return { example };
}
