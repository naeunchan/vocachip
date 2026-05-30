import type {
  AiGeneratedExample,
  DictionarySearchResult,
} from "./types";

interface AiExampleRequest {
  word: string;
  partOfSpeech: string;
  meaning: string;
  definition: string;
  sectionIndex: number;
  itemIndex: number;
}

const DEFAULT_AI_EXAMPLE_ENDPOINT =
  "https://vocationary.onrender.com/api/ai/example";

function getAiExampleEndpoint() {
  return (
    import.meta.env.VITE_AI_EXAMPLE_ENDPOINT?.trim() ||
    DEFAULT_AI_EXAMPLE_ENDPOINT
  );
}

function getStringField(value: unknown, keys: string[]) {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;

  for (const key of keys) {
    const field = record[key];

    if (typeof field === "string" && field.trim().length > 0) {
      return field.trim();
    }
  }

  return null;
}

function getTranslatedMeaning(
  item: DictionarySearchResult["sections"][number]["items"][number],
) {
  return (
    item.translatedMeaning?.trim() ||
    item.translatedSubMeanings?.find(
      (meaning): meaning is string =>
        meaning !== null && meaning.trim().length > 0,
    )?.trim() ||
    ""
  );
}

export function createAiExampleRequests(
  result: DictionarySearchResult,
): AiExampleRequest[] {
  return result.sections.flatMap((section, sectionIndex) =>
    section.items.flatMap((item, itemIndex) => {
      const definition = item.meaning.trim();
      const translatedMeaning = getTranslatedMeaning(item);
      const meaning = translatedMeaning.length > 0 ? translatedMeaning : definition;

      if (definition.length === 0 || meaning.length === 0) {
        return [];
      }

      return {
        word: result.word,
        partOfSpeech: section.label.toLowerCase(),
        meaning,
        definition,
        sectionIndex,
        itemIndex,
      };
    }),
  );
}

export async function fetchAiGeneratedExample(
  request: AiExampleRequest,
  signal: AbortSignal,
): Promise<AiGeneratedExample> {
  const response = await fetch(getAiExampleEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    throw new Error("AI example request failed");
  }

  const payload = (await response.json()) as unknown;
  const sentence = getStringField(payload, ["example", "sentence", "text"]);

  if (sentence === null) {
    throw new Error("AI example response is missing a sentence");
  }

  return {
    sentence,
    partOfSpeech: request.partOfSpeech,
    meaning: request.meaning,
    sectionIndex: request.sectionIndex,
    itemIndex: request.itemIndex,
  };
}
