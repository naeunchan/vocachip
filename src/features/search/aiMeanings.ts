import type { DictionarySearchResult } from "./types";

interface AiMeaningRequestItem {
  id: string;
  partOfSpeech: string;
  definition: string;
  currentMeaning: string | null;
}

interface AiMeaningRequest {
  word: string;
  dictionaryMode: "ko-en";
  targetLanguage: "ko";
  instruction: string;
  items: AiMeaningRequestItem[];
}

const DEFAULT_AI_MEANING_ENDPOINT =
  "https://vocationary.onrender.com/api/ai/meanings";
const KOREAN_TEXT_PATTERN = /[ㄱ-ㅎㅏ-ㅣ가-힣]/;

function getAiMeaningEndpoint() {
  return (
    import.meta.env.VITE_AI_MEANING_ENDPOINT?.trim() ||
    DEFAULT_AI_MEANING_ENDPOINT
  );
}

function createMeaningItemId(sectionIndex: number, itemIndex: number) {
  return `${sectionIndex}:${itemIndex}`;
}

function getRecord(value: unknown) {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function getStringField(value: unknown, keys: string[]) {
  const record = getRecord(value);

  if (record === null) {
    return null;
  }

  for (const key of keys) {
    const field = record[key];

    if (typeof field === "string" && field.trim().length > 0) {
      return field.trim();
    }

    if (typeof field === "number" && Number.isFinite(field)) {
      return String(field);
    }
  }

  return null;
}

function normalizeMeaning(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^\s*(?:[-*]|\d+[.)])\s+/g, "")
    .replace(/^(?:뜻|의미)\s*[:：]\s*/i, "")
    .replace(/\s+/g, " ");

  if (normalized.length === 0 || !KOREAN_TEXT_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
}

function getMeaningFromPayloadItem(value: unknown) {
  if (typeof value === "string") {
    return normalizeMeaning(value);
  }

  return normalizeMeaning(
    getStringField(value, [
      "meaning",
      "translatedMeaning",
      "naturalMeaning",
      "koreanMeaning",
      "text",
    ]),
  );
}

function setMeaning(
  meanings: Map<string, string>,
  requestItems: AiMeaningRequestItem[],
  id: string | null,
  index: number,
  value: unknown,
) {
  const requestItem =
    id === null
      ? requestItems[index]
      : (requestItems.find((item) => item.id === id) ?? requestItems[index]);
  const meaning = getMeaningFromPayloadItem(value);

  if (requestItem === undefined || meaning === null) {
    return;
  }

  meanings.set(requestItem.id, meaning);
}

function collectMeaningsFromList(
  meanings: Map<string, string>,
  requestItems: AiMeaningRequestItem[],
  list: unknown[],
) {
  list.forEach((item, index) => {
    const id = getStringField(item, ["id", "key"]);

    setMeaning(meanings, requestItems, id, index, item);
  });
}

function collectMeaningsFromRecord(
  meanings: Map<string, string>,
  requestItems: AiMeaningRequestItem[],
  record: Record<string, unknown>,
) {
  const requestIds = new Set(requestItems.map((item) => item.id));

  for (const [id, value] of Object.entries(record)) {
    if (requestIds.has(id)) {
      setMeaning(meanings, requestItems, id, -1, value);
    }
  }
}

function parseAiMeaningPayload(
  payload: unknown,
  requestItems: AiMeaningRequestItem[],
) {
  const meanings = new Map<string, string>();

  if (Array.isArray(payload)) {
    collectMeaningsFromList(meanings, requestItems, payload);
    return meanings;
  }

  const record = getRecord(payload);

  if (record === null) {
    return meanings;
  }

  const responseItems = [
    record.meanings,
    record.definitions,
    record.items,
    record.results,
    record.translations,
  ];
  const list = responseItems.find(Array.isArray);

  if (list !== undefined) {
    collectMeaningsFromList(meanings, requestItems, list);
    return meanings;
  }

  const itemRecord = responseItems
    .map(getRecord)
    .find((item): item is Record<string, unknown> => item !== null);

  if (itemRecord !== undefined) {
    collectMeaningsFromRecord(meanings, requestItems, itemRecord);
    return meanings;
  }

  collectMeaningsFromRecord(meanings, requestItems, record);

  return meanings;
}

function createAiMeaningRequest(
  result: DictionarySearchResult,
): AiMeaningRequest {
  return {
    word: result.word,
    dictionaryMode: "ko-en",
    targetLanguage: "ko",
    instruction:
      "각 definition을 한국어 사전 뜻처럼 자연스럽고 짧게 다듬어 주세요. 영어 원문은 넣지 말고 JSON { meanings: [{ id, meaning }] }로만 응답하세요.",
    items: result.sections.flatMap((section, sectionIndex) =>
      section.items.map((item, itemIndex) => ({
        id: createMeaningItemId(sectionIndex, itemIndex),
        partOfSpeech: section.label.toLowerCase(),
        definition: item.meaning,
        currentMeaning: item.translatedMeaning?.trim() || null,
      })),
    ),
  };
}

export async function naturalizeDictionarySearchResultMeanings(
  result: DictionarySearchResult,
  signal: AbortSignal,
): Promise<DictionarySearchResult> {
  const request = createAiMeaningRequest(result);

  if (request.items.length === 0) {
    return result;
  }

  try {
    const response = await fetch(getAiMeaningEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok) {
      return result;
    }

    const payload = (await response.json()) as unknown;
    const meanings = parseAiMeaningPayload(payload, request.items);

    if (meanings.size === 0) {
      return result;
    }

    let hasChangedMeaning = false;
    const sections = result.sections.map((section, sectionIndex) => ({
      ...section,
      items: section.items.map((item, itemIndex) => {
        const nextMeaning = meanings.get(
          createMeaningItemId(sectionIndex, itemIndex),
        );

        if (nextMeaning === undefined || nextMeaning === item.translatedMeaning) {
          return item;
        }

        hasChangedMeaning = true;

        return {
          ...item,
          translatedMeaning: nextMeaning,
        };
      }),
    }));

    if (!hasChangedMeaning) {
      return result;
    }

    return {
      ...result,
      relatedWords: [...result.relatedWords],
      sections,
    };
  } catch {
    return result;
  }
}
