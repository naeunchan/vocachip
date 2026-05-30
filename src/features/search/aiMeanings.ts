import type { DictionarySearchResult } from "./types";

interface AiMeaningRequestItem {
  id: string;
  partOfSpeech: string;
  definition: string;
  currentMeaning: string | null;
}

interface AiMeaningRequest {
  word: string;
  targetLanguage: "ko";
  instruction: string;
  items: AiMeaningRequestItem[];
}

const DEFAULT_AI_MEANING_ENDPOINT =
  "https://vocationary.onrender.com/api/ai/meanings";
const AI_MEANING_REQUEST_TIMEOUT_MS = 30000;
const AI_MEANING_BATCH_SIZE = 8;
const AI_MEANING_BATCH_CONCURRENCY = 3;
const KOREAN_TEXT_PATTERN = /[ㄱ-ㅎㅏ-ㅣ가-힣]/;

function getAiMeaningEndpoint() {
  return (
    import.meta.env.VITE_AI_MEANING_ENDPOINT?.trim() ||
    DEFAULT_AI_MEANING_ENDPOINT
  );
}

function createMeaningItemId(
  sectionIndex: number,
  itemIndex: number,
  subMeaningIndex?: number | null,
) {
  return subMeaningIndex === null || subMeaningIndex === undefined
    ? `${sectionIndex}:${itemIndex}`
    : `${sectionIndex}:${itemIndex}:${subMeaningIndex}`;
}

function hasKoreanMeaning(value: string | null | undefined) {
  return value !== null && value !== undefined && KOREAN_TEXT_PATTERN.test(value);
}

function getSubMeaningDefinition(
  item: DictionarySearchResult["sections"][number]["items"][number],
  subMeaningIndex: number,
) {
  return (
    item.subMeaningDetails?.[subMeaningIndex]?.meaning?.trim() ||
    item.subMeanings?.[subMeaningIndex]?.trim() ||
    item.meaning
  );
}

function getTranslatedMeaning(
  item: DictionarySearchResult["sections"][number]["items"][number],
  subMeaningIndex: number | null,
) {
  if (subMeaningIndex !== null) {
    return item.translatedSubMeanings?.[subMeaningIndex]?.trim() || null;
  }

  return item.translatedMeaning?.trim() || null;
}

function createTranslatedSubMeanings(
  item: DictionarySearchResult["sections"][number]["items"][number],
  subMeaningIndex: number,
  translatedMeaning: string,
) {
  const subMeaningCount = Math.max(
    item.subMeaningDetails?.length ?? 0,
    item.subMeanings?.length ?? 0,
    item.translatedSubMeanings?.length ?? 0,
    subMeaningIndex + 1,
  );
  const translatedSubMeanings = Array.from(
    { length: subMeaningCount },
    (_, index) => item.translatedSubMeanings?.[index] ?? null,
  );

  translatedSubMeanings[subMeaningIndex] = translatedMeaning;

  return translatedSubMeanings;
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function createTimedSignal(signal: AbortSignal, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  const abortRequest = () => {
    controller.abort();
  };

  if (signal.aborted) {
    controller.abort();
  } else {
    signal.addEventListener("abort", abortRequest, { once: true });
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      window.clearTimeout(timeoutId);
      signal.removeEventListener("abort", abortRequest);
    },
  };
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

function createAiMeaningRequestItems(
  result: DictionarySearchResult,
  maxDefinitionCount?: number,
) {
  const requestItems: AiMeaningRequestItem[] = [];
  const definitionCountLimit =
    maxDefinitionCount === undefined
      ? Number.POSITIVE_INFINITY
      : Math.max(0, maxDefinitionCount);
  let definitionCount = 0;

  for (let sectionIndex = 0; sectionIndex < result.sections.length; sectionIndex += 1) {
    const section = result.sections[sectionIndex];

    if (section === undefined) {
      continue;
    }

    for (let itemIndex = 0; itemIndex < section.items.length; itemIndex += 1) {
      const item = section.items[itemIndex];

      if (item === undefined || definitionCount >= definitionCountLimit) {
        return requestItems;
      }

      definitionCount += 1;

      if (hasKoreanMeaning(item.translatedMeaning)) {
        continue;
      }

      requestItems.push({
        id: createMeaningItemId(sectionIndex, itemIndex),
        partOfSpeech: section.label.toLowerCase(),
        definition: item.meaning,
        currentMeaning: item.translatedMeaning?.trim() || null,
      });
    }
  }

  return requestItems;
}

function createAiMeaningRequest(
  result: DictionarySearchResult,
  items: AiMeaningRequestItem[],
): AiMeaningRequest {
  return {
    word: result.word,
    targetLanguage: "ko",
    instruction:
      "각 definition을 한국어 사전 뜻처럼 자연스럽고 짧게 다듬어 주세요. 영어 원문은 넣지 말고 JSON { meanings: [{ id, meaning }] }로만 응답하세요.",
    items,
  };
}

async function fetchAiMeaningBatch(
  result: DictionarySearchResult,
  requestItems: AiMeaningRequestItem[],
  signal: AbortSignal,
) {
  const request = createAiMeaningRequest(result, requestItems);
  const requestSignal = createTimedSignal(signal, AI_MEANING_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(getAiMeaningEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: requestSignal.signal,
    });

    if (!response.ok) {
      return new Map<string, string>();
    }

    const payload = (await response.json()) as unknown;

    return parseAiMeaningPayload(payload, requestItems);
  } catch {
    return new Map<string, string>();
  } finally {
    requestSignal.cleanup();
  }
}

async function fetchAiMeaningsInBatches(
  result: DictionarySearchResult,
  requestItems: AiMeaningRequestItem[],
  signal: AbortSignal,
) {
  const batches = chunkItems(requestItems, AI_MEANING_BATCH_SIZE);
  const meanings = new Map<string, string>();
  let nextBatchIndex = 0;

  async function runNextBatch() {
    while (nextBatchIndex < batches.length && !signal.aborted) {
      const batch = batches[nextBatchIndex];

      nextBatchIndex += 1;

      if (batch === undefined) {
        continue;
      }

      const batchMeanings = await fetchAiMeaningBatch(result, batch, signal);

      for (const [id, meaning] of batchMeanings) {
        meanings.set(id, meaning);
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(AI_MEANING_BATCH_CONCURRENCY, batches.length) },
      runNextBatch,
    ),
  );

  return meanings;
}

export async function naturalizeDictionarySearchResultMeanings(
  result: DictionarySearchResult,
  signal: AbortSignal,
  maxDefinitionCount?: number,
): Promise<DictionarySearchResult> {
  const requestItems = createAiMeaningRequestItems(result, maxDefinitionCount);

  if (requestItems.length === 0) {
    return result;
  }

  if (signal.aborted) {
    return result;
  }

  try {
    const meanings = await fetchAiMeaningsInBatches(
      result,
      requestItems,
      signal,
    );

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
      relatedWords: [],
      sections,
    };
  } catch {
    return result;
  }
}

export async function naturalizeDictionarySearchDefinition(
  result: DictionarySearchResult,
  sectionIndex: number,
  itemIndex: number,
  signal: AbortSignal,
  subMeaningIndex: number | null = null,
): Promise<DictionarySearchResult> {
  const section = result.sections[sectionIndex];
  const item = section?.items[itemIndex];
  const normalizedSubMeaningIndex =
    typeof subMeaningIndex === "number" && subMeaningIndex >= 0
      ? subMeaningIndex
      : null;

  if (section === undefined || item === undefined) {
    return result;
  }

  if (hasKoreanMeaning(getTranslatedMeaning(item, normalizedSubMeaningIndex))) {
    return result;
  }

  const definition =
    normalizedSubMeaningIndex === null
      ? item.meaning
      : getSubMeaningDefinition(item, normalizedSubMeaningIndex);
  const requestItem: AiMeaningRequestItem = {
    id: createMeaningItemId(sectionIndex, itemIndex, normalizedSubMeaningIndex),
    partOfSpeech: section.label.toLowerCase(),
    definition,
    currentMeaning: getTranslatedMeaning(item, normalizedSubMeaningIndex),
  };
  const meanings = await fetchAiMeaningsInBatches(result, [requestItem], signal);
  const translatedMeaning = meanings.get(requestItem.id);

  if (translatedMeaning === undefined) {
    return result;
  }

  return {
    ...result,
    relatedWords: [],
    sections: result.sections.map((currentSection, currentSectionIndex) => {
      if (currentSectionIndex !== sectionIndex) {
        return currentSection;
      }

      return {
        ...currentSection,
        items: currentSection.items.map((currentItem, currentItemIndex) =>
          currentItemIndex === itemIndex
            ? normalizedSubMeaningIndex === null
              ? {
                  ...currentItem,
                  translatedMeaning,
                }
              : {
                  ...currentItem,
                  translatedSubMeanings: createTranslatedSubMeanings(
                    currentItem,
                    normalizedSubMeaningIndex,
                    translatedMeaning,
                  ),
                }
            : currentItem,
        ),
      };
    }),
  };
}
