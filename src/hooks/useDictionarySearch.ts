import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import type { DictionaryMode } from "../core/state/types";
import type { VocabularyEntry } from "../entities/vocabulary/mockData";
import { createVocabularyEntryFromSearchResult } from "../features/search/adapters";
import {
  createAiExampleRequests,
  fetchAiGeneratedExample,
} from "../features/search/aiExamples";
import { naturalizeDictionarySearchResultMeanings } from "../features/search/aiMeanings";
import { fetchDictionarySearchResult } from "../features/search/freeDictionary";
import {
  cacheEnglishDictionarySearchResult,
  cacheKoreanDictionarySearchResult,
  createDictionarySearchDefinitionKey,
  getCachedDictionarySearchResult,
  hasCompleteKoreanMeanings,
  hasKoreanMeaningsThroughCount,
} from "../features/search/searchResultCache";
import { INITIAL_VISIBLE_DEFINITION_COUNT } from "../features/search/displayConfig";
import type {
  AiExampleStatus,
  AiGeneratedExample,
  DictionarySearchResult,
  SearchStatus,
} from "../features/search/types";
import { STORAGE_KEYS } from "../core/state/constants";
import { getSearchResults } from "../core/state/helpers";
import { usePersistentState } from "./usePersistentState";

interface UseDictionarySearchParams {
  dictionaryMode: DictionaryMode;
  initialHistory: string[];
  words: VocabularyEntry[];
  setWords: Dispatch<SetStateAction<VocabularyEntry[]>>;
}

function getSearchResultForMode(
  result: DictionarySearchResult,
  dictionaryMode: DictionaryMode,
) {
  if (dictionaryMode !== "ko-en") {
    return result;
  }

  const cachedSearchResult = getCachedDictionarySearchResult(result.word);

  if (
    cachedSearchResult?.definitionKey ===
      createDictionarySearchDefinitionKey(result) &&
    cachedSearchResult.koreanResult !== null
  ) {
    return cachedSearchResult.koreanResult;
  }

  return result;
}

export function useDictionarySearch({
  dictionaryMode,
  initialHistory,
  words,
  setWords,
}: UseDictionarySearchParams) {
  const [searchHistory, setSearchHistory] = usePersistentState(
    STORAGE_KEYS.history,
    initialHistory,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");
  const [searchResult, setSearchResult] =
    useState<DictionarySearchResult | null>(null);
  const [searchSaveFeedback, setSearchSaveFeedback] = useState<
    "saved" | "existing" | null
  >(null);
  const [aiExampleStatus, setAiExampleStatus] =
    useState<AiExampleStatus>("idle");
  const [isAiMeaningLoading, setIsAiMeaningLoading] = useState(false);
  const [aiGeneratedExamples, setAiGeneratedExamples] = useState<
    AiGeneratedExample[]
  >([]);
  const searchAbortControllerRef = useRef<AbortController | null>(null);
  const aiExampleAbortControllerRef = useRef<AbortController | null>(null);
  const aiMeaningAbortControllerRef = useRef<AbortController | null>(null);
  const enrichedSearchMeaningKeyRef = useRef<string | null>(null);
  const matchedSearchWord =
    searchResult === null
      ? null
      : (words.find(
          (word) => word.word.toLowerCase() === searchResult.word.toLowerCase(),
        ) ?? null);
  const isSearchResultSaved = matchedSearchWord?.saved ?? false;
  const emptySearchSuggestions = Array.from(
    new Set(
      [
        ...getSearchResults(words, searchQuery).map((word) => word.word),
        ...searchHistory,
        "take",
        "make",
        "retain",
      ].filter(
        (term) =>
          term.trim().length > 0 &&
          term.toLowerCase() !== searchQuery.trim().toLowerCase(),
      ),
    ),
  ).slice(0, 4);

  useEffect(() => {
    return () => {
      searchAbortControllerRef.current?.abort();
      aiExampleAbortControllerRef.current?.abort();
      aiMeaningAbortControllerRef.current?.abort();
    };
  }, []);

  const syncSavedWordFromSearchResult = useCallback(
    (nextResult: DictionarySearchResult) => {
      setWords((currentWords) =>
        currentWords.map((word) =>
          word.saved &&
          word.word.toLowerCase() === nextResult.word.toLowerCase()
            ? createVocabularyEntryFromSearchResult(nextResult, word)
            : word,
        ),
      );
    },
    [setWords],
  );

  const rememberSearchResult = useCallback(
    (nextResult: DictionarySearchResult, fallbackQuery: string) => {
      const historyTerm = nextResult.word.trim() || fallbackQuery;

      setSearchHistory((currentHistory) =>
        [
          historyTerm,
          ...currentHistory.filter(
            (term) => term.toLowerCase() !== historyTerm.toLowerCase(),
          ),
        ].slice(0, 6),
      );
      syncSavedWordFromSearchResult(nextResult);
    },
    [setSearchHistory, syncSavedWordFromSearchResult],
  );

  function handleChangeSearchQuery(nextQuery: string) {
    setSearchQuery(nextQuery);

    if (nextQuery.trim().length > 0) {
      return;
    }

    searchAbortControllerRef.current?.abort();
    aiExampleAbortControllerRef.current?.abort();
    aiMeaningAbortControllerRef.current?.abort();
    setSearchStatus("idle");
    setSearchResult(null);
    setSearchSaveFeedback(null);
    setAiExampleStatus("idle");
    setIsAiMeaningLoading(false);
    setAiGeneratedExamples([]);
    enrichedSearchMeaningKeyRef.current = null;
  }

  async function handleSearchSubmit(nextQuery: string) {
    const trimmedQuery = nextQuery.trim();

    if (trimmedQuery.length === 0) {
      return;
    }

    setSearchQuery(trimmedQuery);

    searchAbortControllerRef.current?.abort();
    aiExampleAbortControllerRef.current?.abort();
    aiMeaningAbortControllerRef.current?.abort();

    const nextAbortController = new AbortController();
    const cachedSearchResult = getCachedDictionarySearchResult(trimmedQuery);

    searchAbortControllerRef.current = nextAbortController;
    enrichedSearchMeaningKeyRef.current = null;
    setSearchStatus("loading");
    setSearchResult(null);
    setSearchSaveFeedback(null);
    setAiExampleStatus("idle");
    setIsAiMeaningLoading(false);
    setAiGeneratedExamples([]);

    if (cachedSearchResult !== null) {
      const nextResult =
        cachedSearchResult.koreanResult ?? cachedSearchResult.englishResult;

      rememberSearchResult(nextResult, trimmedQuery);
      setSearchResult(nextResult);
      setSearchStatus("success");
      setIsAiMeaningLoading(
        dictionaryMode === "ko-en" &&
          !hasKoreanMeaningsThroughCount(
            nextResult,
            INITIAL_VISIBLE_DEFINITION_COUNT,
          ),
      );
      return;
    }

    try {
      const nextResult = await fetchDictionarySearchResult(
        trimmedQuery,
        nextAbortController.signal,
      );

      if (nextAbortController.signal.aborted) {
        return;
      }

      const shouldLoadAiMeanings =
        dictionaryMode === "ko-en" &&
        nextResult !== null &&
        !hasKoreanMeaningsThroughCount(
          nextResult,
          INITIAL_VISIBLE_DEFINITION_COUNT,
        );

      if (nextResult !== null) {
        cacheEnglishDictionarySearchResult(trimmedQuery, nextResult);
        rememberSearchResult(nextResult, trimmedQuery);
      }

      setIsAiMeaningLoading(shouldLoadAiMeanings);
      setSearchResult(nextResult);
      setSearchStatus(nextResult === null ? "empty" : "success");
    } catch {
      if (nextAbortController.signal.aborted) {
        return;
      }

      setIsAiMeaningLoading(false);
      setSearchResult(null);
      setSearchStatus("error");
    }
  }

  useEffect(() => {
    if (searchStatus !== "success" || searchResult === null) {
      return;
    }

    const searchMeaningKey = createDictionarySearchDefinitionKey(searchResult);
    const initialMeaningCount = INITIAL_VISIBLE_DEFINITION_COUNT;
    const enrichmentKey = `${dictionaryMode}:${searchMeaningKey}:${initialMeaningCount}`;
    const cachedSearchResult = getCachedDictionarySearchResult(
      searchResult.word,
    );

    if (dictionaryMode === "ko-en") {
      const nextResult = getSearchResultForMode(searchResult, dictionaryMode);

      if (nextResult !== searchResult) {
        setIsAiMeaningLoading(false);
        setSearchResult(nextResult);
        return;
      }
    }

    if (hasCompleteKoreanMeanings(searchResult)) {
      cacheKoreanDictionarySearchResult(searchResult.word, searchResult);
      enrichedSearchMeaningKeyRef.current = enrichmentKey;
      setIsAiMeaningLoading(false);
      return;
    }

    if (
      dictionaryMode === "ko-en" &&
      hasKoreanMeaningsThroughCount(searchResult, initialMeaningCount)
    ) {
      cacheKoreanDictionarySearchResult(searchResult.word, searchResult);
      enrichedSearchMeaningKeyRef.current = enrichmentKey;
      setIsAiMeaningLoading(false);
      return;
    }

    const hasCachedInitialKoreanResult =
      cachedSearchResult?.definitionKey === searchMeaningKey &&
      cachedSearchResult.koreanResult !== null &&
      hasKoreanMeaningsThroughCount(
        cachedSearchResult.koreanResult,
        initialMeaningCount,
      );
    const shouldTranslateMeanings =
      dictionaryMode === "ko-en" ||
      (dictionaryMode === "en-en" && !hasCachedInitialKoreanResult);

    if (!shouldTranslateMeanings) {
      enrichedSearchMeaningKeyRef.current = null;
      aiMeaningAbortControllerRef.current?.abort();
      setIsAiMeaningLoading(false);
      return;
    }

    if (enrichedSearchMeaningKeyRef.current === enrichmentKey) {
      return;
    }

    const nextAbortController = new AbortController();

    aiMeaningAbortControllerRef.current?.abort();
    aiMeaningAbortControllerRef.current = nextAbortController;
    enrichedSearchMeaningKeyRef.current = enrichmentKey;
    setIsAiMeaningLoading(dictionaryMode === "ko-en");

    void (async () => {
      try {
        const nextResult = await naturalizeDictionarySearchResultMeanings(
          searchResult,
          nextAbortController.signal,
          initialMeaningCount,
        );

        if (nextAbortController.signal.aborted) {
          return;
        }

        setIsAiMeaningLoading(false);

        if (nextResult === searchResult) {
          return;
        }

        cacheKoreanDictionarySearchResult(searchResult.word, nextResult);

        if (dictionaryMode === "en-en") {
          return;
        }

        syncSavedWordFromSearchResult(nextResult);
        setSearchResult(nextResult);
      } catch {
        if (!nextAbortController.signal.aborted) {
          setIsAiMeaningLoading(false);
        }

        return;
      }
    })();

    return () => {
      nextAbortController.abort();
    };
  }, [
    dictionaryMode,
    searchResult,
    searchStatus,
    syncSavedWordFromSearchResult,
  ]);

  function handleSaveSearchResult() {
    if (searchResult === null) {
      return;
    }

    let nextFeedback: "saved" | "existing" = "saved";

    setWords((currentWords) => {
      const existingWord =
        currentWords.find(
          (word) => word.word.toLowerCase() === searchResult.word.toLowerCase(),
        ) ?? null;

      if (existingWord?.saved) {
        nextFeedback = "existing";
      }

      const nextWord = createVocabularyEntryFromSearchResult(
        searchResult,
        existingWord ?? undefined,
      );

      if (existingWord === null) {
        return [nextWord, ...currentWords];
      }

      return currentWords.map((word) =>
        word.id === existingWord.id ? nextWord : word,
      );
    });

    setSearchSaveFeedback(nextFeedback);
  }

  function clearSearchHistory() {
    setSearchHistory([]);
  }

  async function handleRequestVisibleMeaningTranslations(
    visibleDefinitionCount: number,
  ) {
    if (
      dictionaryMode !== "ko-en" ||
      searchStatus !== "success" ||
      searchResult === null ||
      hasKoreanMeaningsThroughCount(searchResult, visibleDefinitionCount)
    ) {
      return;
    }

    const searchMeaningKey = createDictionarySearchDefinitionKey(searchResult);
    const enrichmentKey = `${dictionaryMode}:${searchMeaningKey}:${visibleDefinitionCount}`;

    if (
      enrichedSearchMeaningKeyRef.current === enrichmentKey &&
      isAiMeaningLoading
    ) {
      return;
    }

    const nextAbortController = new AbortController();

    aiMeaningAbortControllerRef.current?.abort();
    aiMeaningAbortControllerRef.current = nextAbortController;
    enrichedSearchMeaningKeyRef.current = enrichmentKey;
    setIsAiMeaningLoading(true);

    try {
      const nextResult = await naturalizeDictionarySearchResultMeanings(
        searchResult,
        nextAbortController.signal,
        visibleDefinitionCount,
      );

      if (nextAbortController.signal.aborted) {
        return;
      }

      setIsAiMeaningLoading(false);

      if (nextResult === searchResult) {
        return;
      }

      cacheKoreanDictionarySearchResult(searchResult.word, nextResult);
      syncSavedWordFromSearchResult(nextResult);
      setSearchResult(nextResult);
    } catch {
      if (!nextAbortController.signal.aborted) {
        setIsAiMeaningLoading(false);
      }
    }
  }

  async function handleGenerateAiExample() {
    if (searchResult === null) {
      return;
    }

    if (aiExampleStatus === "success" && aiGeneratedExamples.length > 0) {
      aiExampleAbortControllerRef.current?.abort();
      setAiGeneratedExamples([]);
      setAiExampleStatus("idle");
      return;
    }

    const aiExampleRequests = createAiExampleRequests(
      searchResult,
      dictionaryMode,
    );

    if (aiExampleRequests.length === 0) {
      setAiGeneratedExamples([]);
      setAiExampleStatus("error");
      return;
    }

    aiExampleAbortControllerRef.current?.abort();

    const nextAbortController = new AbortController();

    aiExampleAbortControllerRef.current = nextAbortController;
    setAiGeneratedExamples([]);
    setAiExampleStatus("loading");

    try {
      const nextExamples = await Promise.all(
        aiExampleRequests.map((request) =>
          fetchAiGeneratedExample(request, nextAbortController.signal),
        ),
      );

      if (nextAbortController.signal.aborted) {
        return;
      }

      setAiGeneratedExamples(nextExamples);
      setAiExampleStatus("success");
    } catch {
      if (nextAbortController.signal.aborted) {
        return;
      }

      setAiGeneratedExamples([]);
      setAiExampleStatus("error");
    }
  }

  return {
    searchQuery,
    searchStatus,
    searchResult,
    searchHistory,
    emptySearchSuggestions,
    matchedSearchWord,
    isSearchResultSaved,
    searchSaveFeedback,
    aiExampleStatus,
    isAiMeaningLoading,
    aiGeneratedExamples,
    handleChangeSearchQuery,
    handleSearchSubmit,
    handleSaveSearchResult,
    handleGenerateAiExample,
    handleRequestVisibleMeaningTranslations,
    clearSearchHistory,
  };
}
