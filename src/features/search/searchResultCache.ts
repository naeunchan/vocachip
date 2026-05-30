import type { DictionarySearchDefinition, DictionarySearchResult } from "./types";

interface SearchResultCacheEntry {
  query: string;
  word: string;
  definitionKey: string;
  englishResult: DictionarySearchResult;
  koreanResult: DictionarySearchResult | null;
  updatedAt: number;
  koreanUpdatedAt: number | null;
}

interface SearchResultCacheState {
  version: 8;
  entries: Record<string, SearchResultCacheEntry>;
}

export interface CachedDictionarySearchResult {
  englishResult: DictionarySearchResult;
  koreanResult: DictionarySearchResult | null;
  definitionKey: string;
}

const SEARCH_RESULT_CACHE_STORAGE_KEY = "vocachip.search-result-cache.v8";
const SEARCH_RESULT_CACHE_STORAGE_KEY_PREFIX = "vocachip.search-result-cache.";
const SEARCH_RESULT_CACHE_MAX_ENTRIES = 50;
const SEARCH_RESULT_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const KOREAN_TEXT_PATTERN = /[ㄱ-ㅎㅏ-ㅣ가-힣]/;

function normalizeCacheKey(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function createDictionarySearchDefinitionKey(
  result: DictionarySearchResult,
) {
  return [
    result.word.toLowerCase(),
    ...result.sections.flatMap((section) => [
      section.label.toLowerCase(),
      ...section.items.map((item) => item.meaning),
    ]),
  ].join("\u001f");
}

function cloneSearchResult(result: DictionarySearchResult) {
  return {
    ...result,
    relatedWords: [],
    hasMoreDefinitions: result.hasMoreDefinitions ?? false,
    sections: result.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        translatedSubMeanings:
          item.translatedSubMeanings === undefined
            ? undefined
            : [...item.translatedSubMeanings],
      })),
    })),
  };
}

function getSubMeaningTranslationCount(item: DictionarySearchDefinition) {
  return Math.max(
    item.subMeaningDetails?.length ?? 0,
    item.subMeanings?.length ?? 0,
    item.translatedSubMeanings?.length ?? 0,
  );
}

function createEmptyTranslatedSubMeanings(item: DictionarySearchDefinition) {
  const subMeaningCount = getSubMeaningTranslationCount(item);

  return subMeaningCount > 0
    ? Array.from({ length: subMeaningCount }, () => null as string | null)
    : undefined;
}

function createEnglishSearchResult(result: DictionarySearchResult) {
  return {
    ...result,
    relatedWords: [],
    sections: result.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        translatedMeaning: null,
        translatedSubMeanings: createEmptyTranslatedSubMeanings(item),
      })),
    })),
  };
}

function mergeTranslatedSubMeanings(
  item: DictionarySearchDefinition,
  existingItem: DictionarySearchDefinition | undefined,
) {
  const subMeaningCount = Math.max(
    getSubMeaningTranslationCount(item),
    existingItem === undefined ? 0 : getSubMeaningTranslationCount(existingItem),
  );

  if (subMeaningCount === 0) {
    return item.translatedSubMeanings;
  }

  return Array.from({ length: subMeaningCount }, (_, index) => {
    const itemMeaning = item.translatedSubMeanings?.[index];

    if (hasKoreanMeaning(itemMeaning)) {
      return itemMeaning;
    }

    const existingMeaning = existingItem?.translatedSubMeanings?.[index];

    return hasKoreanMeaning(existingMeaning) ? existingMeaning : itemMeaning ?? null;
  });
}

function mergeKoreanSearchResult(
  result: DictionarySearchResult,
  existingResult: DictionarySearchResult | null,
) {
  if (existingResult === null) {
    return cloneSearchResult(result);
  }

  return {
    ...result,
    relatedWords: [],
    sections: result.sections.map((section, sectionIndex) => {
      const existingSection = existingResult.sections[sectionIndex];

      return {
        ...section,
        items: section.items.map((item, itemIndex) => {
          const existingItem = existingSection?.items[itemIndex];

          if (hasKoreanMeaning(item.translatedMeaning)) {
            return {
              ...item,
              translatedSubMeanings: mergeTranslatedSubMeanings(
                item,
                existingItem,
              ),
            };
          }

          const existingMeaning = existingItem?.translatedMeaning;

          return {
            ...item,
            translatedMeaning: hasKoreanMeaning(existingMeaning)
              ? existingMeaning
              : item.translatedMeaning,
            translatedSubMeanings: mergeTranslatedSubMeanings(
              item,
              existingItem,
            ),
          };
        }),
      };
    }),
  };
}

function hasKoreanMeaning(value: string | null | undefined) {
  return (
    value !== null && value !== undefined && KOREAN_TEXT_PATTERN.test(value)
  );
}

function getDefinitionItems(result: DictionarySearchResult) {
  return result.sections.flatMap((section) => section.items);
}

function hasAnyItemKoreanMeaning(item: DictionarySearchDefinition) {
  return (
    hasKoreanMeaning(item.translatedMeaning) ||
    (item.translatedSubMeanings?.some((meaning) => hasKoreanMeaning(meaning)) ??
      false)
  );
}

function hasCompleteItemKoreanMeaning(item: DictionarySearchDefinition) {
  const subMeaningCount = getSubMeaningTranslationCount(item);

  if (subMeaningCount === 0) {
    return hasKoreanMeaning(item.translatedMeaning);
  }

  return Array.from({ length: subMeaningCount }).every((_, index) =>
    hasKoreanMeaning(item.translatedSubMeanings?.[index]),
  );
}

export function hasAnyKoreanMeanings(result: DictionarySearchResult) {
  return getDefinitionItems(result).some(hasAnyItemKoreanMeaning);
}

export function hasCompleteKoreanMeanings(result: DictionarySearchResult) {
  const items = getDefinitionItems(result);

  return (
    items.length > 0 &&
    items.every((item) => hasCompleteItemKoreanMeaning(item))
  );
}

export function hasKoreanMeaningsThroughCount(
  result: DictionarySearchResult,
  definitionCount: number,
) {
  const items = getDefinitionItems(result).slice(
    0,
    Math.max(0, definitionCount),
  );

  return (
    items.length > 0 &&
    items.every((item) => hasCompleteItemKoreanMeaning(item))
  );
}

function createEmptyCacheState(): SearchResultCacheState {
  return {
    version: 8,
    entries: {},
  };
}

function getRecord(value: unknown) {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function readCacheState() {
  try {
    const rawCache = window.localStorage.getItem(
      SEARCH_RESULT_CACHE_STORAGE_KEY,
    );

    if (rawCache === null) {
      return createEmptyCacheState();
    }

    const parsedCache = getRecord(JSON.parse(rawCache));

    if (parsedCache?.version !== 8 || getRecord(parsedCache.entries) === null) {
      return createEmptyCacheState();
    }

    return parsedCache as unknown as SearchResultCacheState;
  } catch {
    return createEmptyCacheState();
  }
}

function writeCacheState(cacheState: SearchResultCacheState) {
  try {
    window.localStorage.setItem(
      SEARCH_RESULT_CACHE_STORAGE_KEY,
      JSON.stringify(cacheState),
    );
  } catch {
    return;
  }
}

function isFreshCacheEntry(entry: SearchResultCacheEntry, now: number) {
  return now - entry.updatedAt <= SEARCH_RESULT_CACHE_TTL_MS;
}

function pruneCacheEntries(entries: SearchResultCacheEntry[]) {
  return entries
    .sort((left, right) => {
      const leftUpdatedAt = Math.max(left.updatedAt, left.koreanUpdatedAt ?? 0);
      const rightUpdatedAt = Math.max(
        right.updatedAt,
        right.koreanUpdatedAt ?? 0,
      );

      return rightUpdatedAt - leftUpdatedAt;
    })
    .slice(0, SEARCH_RESULT_CACHE_MAX_ENTRIES);
}

function saveCacheEntryForKeys(
  cacheState: SearchResultCacheState,
  entry: SearchResultCacheEntry,
  keys: string[],
) {
  for (const key of keys) {
    if (key.length > 0) {
      cacheState.entries[key] = {
        ...entry,
        query: key,
      };
    }
  }
}

function writePrunedCacheState(cacheState: SearchResultCacheState) {
  const now = Date.now();
  const freshEntries = Object.values(cacheState.entries).filter((entry) =>
    isFreshCacheEntry(entry, now),
  );
  const prunedEntries = pruneCacheEntries(freshEntries);

  writeCacheState({
    version: 8,
    entries: Object.fromEntries(
      prunedEntries.map((entry) => [entry.query, entry]),
    ),
  });
}

export function getCachedDictionarySearchResult(
  query: string,
): CachedDictionarySearchResult | null {
  const cacheKey = normalizeCacheKey(query);

  if (cacheKey.length === 0) {
    return null;
  }

  const cacheState = readCacheState();
  const cacheEntry = cacheState.entries[cacheKey];

  if (cacheEntry === undefined || !isFreshCacheEntry(cacheEntry, Date.now())) {
    return null;
  }

  return {
    definitionKey: cacheEntry.definitionKey,
    englishResult: cloneSearchResult(cacheEntry.englishResult),
    koreanResult:
      cacheEntry.koreanResult !== null &&
      hasAnyKoreanMeanings(cacheEntry.koreanResult)
        ? cloneSearchResult(cacheEntry.koreanResult)
        : null,
  };
}

export function cacheEnglishDictionarySearchResult(
  query: string,
  result: DictionarySearchResult,
) {
  const cacheState = readCacheState();
  const queryKey = normalizeCacheKey(query);
  const wordKey = normalizeCacheKey(result.word);
  const definitionKey = createDictionarySearchDefinitionKey(result);
  const existingEntry =
    cacheState.entries[queryKey] ?? cacheState.entries[wordKey];
  const shouldKeepKoreanResult =
    existingEntry?.definitionKey === definitionKey &&
    existingEntry.koreanResult !== null &&
    hasAnyKoreanMeanings(existingEntry.koreanResult);
  const now = Date.now();
  const entry: SearchResultCacheEntry = {
    query: queryKey,
    word: result.word,
    definitionKey,
    englishResult: createEnglishSearchResult(result),
    koreanResult: shouldKeepKoreanResult
      ? cloneSearchResult(existingEntry.koreanResult)
      : null,
    updatedAt: now,
    koreanUpdatedAt: shouldKeepKoreanResult
      ? (existingEntry.koreanUpdatedAt ?? now)
      : null,
  };

  saveCacheEntryForKeys(cacheState, entry, [queryKey, wordKey]);
  writePrunedCacheState(cacheState);
}

export function cacheKoreanDictionarySearchResult(
  query: string,
  result: DictionarySearchResult,
) {
  if (!hasAnyKoreanMeanings(result)) {
    return;
  }

  const cacheState = readCacheState();
  const queryKey = normalizeCacheKey(query);
  const wordKey = normalizeCacheKey(result.word);
  const definitionKey = createDictionarySearchDefinitionKey(result);
  const existingEntry =
    cacheState.entries[queryKey] ?? cacheState.entries[wordKey];
  const existingKoreanResult =
    existingEntry?.definitionKey === definitionKey
      ? existingEntry.koreanResult
      : null;
  const mergedKoreanResult = mergeKoreanSearchResult(
    result,
    existingKoreanResult,
  );
  const now = Date.now();
  const entry: SearchResultCacheEntry = {
    query: queryKey,
    word: result.word,
    definitionKey,
    englishResult:
      existingEntry?.definitionKey === definitionKey
        ? cloneSearchResult(existingEntry.englishResult)
        : createEnglishSearchResult(result),
    koreanResult: mergedKoreanResult,
    updatedAt: existingEntry?.updatedAt ?? now,
    koreanUpdatedAt: now,
  };

  saveCacheEntryForKeys(cacheState, entry, [queryKey, wordKey]);
  writePrunedCacheState(cacheState);
}

export function clearDictionarySearchResultCache() {
  try {
    const cacheKeys = Array.from(
      { length: window.localStorage.length },
      (_, index) => window.localStorage.key(index),
    ).filter(
      (key): key is string =>
        key !== null && key.startsWith(SEARCH_RESULT_CACHE_STORAGE_KEY_PREFIX),
    );

    for (const cacheKey of cacheKeys) {
      window.localStorage.removeItem(cacheKey);
    }
  } catch {
    return;
  }
}
