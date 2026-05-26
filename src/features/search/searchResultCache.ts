import type { DictionarySearchResult } from "./types";

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
  version: 5;
  entries: Record<string, SearchResultCacheEntry>;
}

export interface CachedDictionarySearchResult {
  englishResult: DictionarySearchResult;
  koreanResult: DictionarySearchResult | null;
  definitionKey: string;
}

const SEARCH_RESULT_CACHE_STORAGE_KEY = "vocachip.search-result-cache.v5";
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
      items: section.items.map((item) => ({ ...item })),
    })),
  };
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
      })),
    })),
  };
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
          if (hasKoreanMeaning(item.translatedMeaning)) {
            return { ...item };
          }

          const existingMeaning =
            existingSection?.items[itemIndex]?.translatedMeaning;

          return {
            ...item,
            translatedMeaning: hasKoreanMeaning(existingMeaning)
              ? existingMeaning
              : item.translatedMeaning,
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

export function hasAnyKoreanMeanings(result: DictionarySearchResult) {
  return getDefinitionItems(result).some((item) =>
    hasKoreanMeaning(item.translatedMeaning),
  );
}

export function hasCompleteKoreanMeanings(result: DictionarySearchResult) {
  const items = getDefinitionItems(result);

  return (
    items.length > 0 &&
    items.every((item) => hasKoreanMeaning(item.translatedMeaning))
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
    items.every((item) => hasKoreanMeaning(item.translatedMeaning))
  );
}

function createEmptyCacheState(): SearchResultCacheState {
  return {
    version: 5,
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

    if (parsedCache?.version !== 5 || getRecord(parsedCache.entries) === null) {
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
    version: 5,
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
