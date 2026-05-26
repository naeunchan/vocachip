import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import type { VocabularyEntry } from "../entities/vocabulary/mockData";
import { createVocabularyEntryFromSearchResult } from "../features/search/adapters";
import {
  createAiExampleRequests,
  fetchAiGeneratedExample,
} from "../features/search/aiExamples";
import { naturalizeDictionarySearchDefinition } from "../features/search/aiMeanings";
import {
  DEFINITION_RENDER_BATCH_SIZE,
  INITIAL_VISIBLE_DEFINITION_COUNT,
} from "../features/search/displayConfig";
import { fetchDictionarySearchResult } from "../features/search/freeDictionary";
import {
  cacheEnglishDictionarySearchResult,
  cacheKoreanDictionarySearchResult,
  createDictionarySearchDefinitionKey,
  getCachedDictionarySearchResult,
  hasAnyKoreanMeanings,
} from "../features/search/searchResultCache";
import type {
  AiExampleStatus,
  AiGeneratedExample,
  DefinitionTranslationDialog,
  DictionarySearchResult,
  SearchStatus,
} from "../features/search/types";
import { STORAGE_KEYS } from "../core/state/constants";
import { getSearchResults } from "../core/state/helpers";
import { usePersistentState } from "./usePersistentState";

interface UseDictionarySearchParams {
  initialHistory: string[];
  words: VocabularyEntry[];
  setWords: Dispatch<SetStateAction<VocabularyEntry[]>>;
}

export function useDictionarySearch({
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
  const [definitionTranslationDialog, setDefinitionTranslationDialog] =
    useState<DefinitionTranslationDialog | null>(null);
  const [isLoadingMoreDefinitions, setIsLoadingMoreDefinitions] =
    useState(false);
  const [aiGeneratedExamples, setAiGeneratedExamples] = useState<
    AiGeneratedExample[]
  >([]);
  const searchAbortControllerRef = useRef<AbortController | null>(null);
  const definitionLoadAbortControllerRef = useRef<AbortController | null>(null);
  const aiExampleAbortControllerRef = useRef<AbortController | null>(null);
  const aiMeaningAbortControllerRef = useRef<AbortController | null>(null);
  const searchResultRef = useRef<DictionarySearchResult | null>(null);
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
    searchResultRef.current = searchResult;
  }, [searchResult]);

  useEffect(() => {
    return () => {
      searchAbortControllerRef.current?.abort();
      definitionLoadAbortControllerRef.current?.abort();
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

  function countDefinitions(result: DictionarySearchResult) {
    return result.sections.reduce(
      (definitionCount, section) => definitionCount + section.items.length,
      0,
    );
  }

  function mergeExistingDefinitionData(
    nextResult: DictionarySearchResult,
    currentResult: DictionarySearchResult,
  ): DictionarySearchResult {
    return {
      ...nextResult,
      relatedWords: [],
      sections: nextResult.sections.map((section, sectionIndex) => {
        const currentSection = currentResult.sections[sectionIndex];

        return {
          ...section,
          items: section.items.map((item, itemIndex) => {
            const currentItem = currentSection?.items[itemIndex];

            if (
              currentItem?.meaning === item.meaning &&
              currentItem.translatedMeaning !== null
            ) {
              return {
                ...item,
                translatedMeaning: currentItem.translatedMeaning,
              };
            }

            return item;
          }),
        };
      }),
    };
  }

  function handleChangeSearchQuery(nextQuery: string) {
    setSearchQuery(nextQuery);

    if (nextQuery.trim().length > 0) {
      return;
    }

    searchAbortControllerRef.current?.abort();
    definitionLoadAbortControllerRef.current?.abort();
    aiExampleAbortControllerRef.current?.abort();
    aiMeaningAbortControllerRef.current?.abort();
    setSearchStatus("idle");
    setSearchResult(null);
    setSearchSaveFeedback(null);
    setAiExampleStatus("idle");
    setDefinitionTranslationDialog(null);
    setIsLoadingMoreDefinitions(false);
    setAiGeneratedExamples([]);
  }

  async function handleSearchSubmit(nextQuery: string) {
    const trimmedQuery = nextQuery.trim();

    if (trimmedQuery.length === 0) {
      return;
    }

    setSearchQuery(trimmedQuery);

    searchAbortControllerRef.current?.abort();
    definitionLoadAbortControllerRef.current?.abort();
    aiExampleAbortControllerRef.current?.abort();
    aiMeaningAbortControllerRef.current?.abort();

    const nextAbortController = new AbortController();
    const cachedSearchResult = getCachedDictionarySearchResult(trimmedQuery);

    searchAbortControllerRef.current = nextAbortController;
    setSearchSaveFeedback(null);
    setAiExampleStatus("idle");
    setDefinitionTranslationDialog(null);
    setIsLoadingMoreDefinitions(false);
    setAiGeneratedExamples([]);

    if (cachedSearchResult !== null) {
      const nextResult = cachedSearchResult.englishResult;

      rememberSearchResult(nextResult, trimmedQuery);
      setSearchResult(nextResult);
      setSearchStatus("success");
      return;
    }

    setSearchStatus("loading");
    setSearchResult(null);

    try {
      const nextResult = await fetchDictionarySearchResult(
        trimmedQuery,
        nextAbortController.signal,
        INITIAL_VISIBLE_DEFINITION_COUNT,
      );

      if (nextAbortController.signal.aborted) {
        return;
      }

      if (nextResult !== null) {
        cacheEnglishDictionarySearchResult(trimmedQuery, nextResult);
        rememberSearchResult(nextResult, trimmedQuery);
      }

      setSearchResult(nextResult);
      setSearchStatus(nextResult === null ? "empty" : "success");
    } catch {
      if (nextAbortController.signal.aborted) {
        return;
      }

      setSearchResult(null);
      setSearchStatus("error");
    }
  }

  async function handleLoadMoreDefinitions() {
    const currentResult = searchResultRef.current;

    if (
      currentResult === null ||
      !currentResult.hasMoreDefinitions ||
      isLoadingMoreDefinitions
    ) {
      return;
    }

    definitionLoadAbortControllerRef.current?.abort();

    const nextAbortController = new AbortController();
    const nextDefinitionCount =
      countDefinitions(currentResult) + DEFINITION_RENDER_BATCH_SIZE;

    definitionLoadAbortControllerRef.current = nextAbortController;
    setIsLoadingMoreDefinitions(true);

    try {
      const nextResult = await fetchDictionarySearchResult(
        currentResult.word,
        nextAbortController.signal,
        nextDefinitionCount,
      );

      if (nextAbortController.signal.aborted || nextResult === null) {
        return;
      }

      const mergedResult = mergeExistingDefinitionData(
        nextResult,
        currentResult,
      );

      cacheEnglishDictionarySearchResult(currentResult.word, mergedResult);

      if (hasAnyKoreanMeanings(mergedResult)) {
        cacheKoreanDictionarySearchResult(currentResult.word, mergedResult);
      }

      syncSavedWordFromSearchResult(mergedResult);
      setSearchResult(mergedResult);
    } catch {
      if (nextAbortController.signal.aborted) {
        return;
      }
    } finally {
      if (!nextAbortController.signal.aborted) {
        setIsLoadingMoreDefinitions(false);
      }
    }
  }

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

  function closeDefinitionTranslation() {
    aiMeaningAbortControllerRef.current?.abort();
    setDefinitionTranslationDialog(null);
  }

  function getCachedDefinitionTranslation(
    result: DictionarySearchResult,
    sectionIndex: number,
    itemIndex: number,
  ) {
    const cachedSearchResult = getCachedDictionarySearchResult(result.word);

    if (
      cachedSearchResult?.definitionKey !==
        createDictionarySearchDefinitionKey(result) ||
      cachedSearchResult.koreanResult === null
    ) {
      return null;
    }

    return (
      cachedSearchResult.koreanResult.sections[sectionIndex]?.items[
        itemIndex
      ]?.translatedMeaning?.trim() || null
    );
  }

  function mergeTranslatedDefinition(
    result: DictionarySearchResult,
    sectionIndex: number,
    itemIndex: number,
    translatedMeaning: string,
  ): DictionarySearchResult {
    return {
      ...result,
      relatedWords: [],
      sections: result.sections.map((section, currentSectionIndex) => {
        if (currentSectionIndex !== sectionIndex) {
          return section;
        }

        return {
          ...section,
          items: section.items.map((item, currentItemIndex) =>
            currentItemIndex === itemIndex
              ? {
                  ...item,
                  translatedMeaning,
                }
              : item,
          ),
        };
      }),
    };
  }

  async function handleRequestDefinitionTranslation(
    sectionIndex: number,
    itemIndex: number,
  ) {
    const currentResult = searchResultRef.current;
    const section = currentResult?.sections[sectionIndex];
    const item = section?.items[itemIndex];

    if (currentResult === null || section === undefined || item === undefined) {
      return;
    }

    const cachedTranslatedMeaning =
      item.translatedMeaning?.trim() ||
      getCachedDefinitionTranslation(currentResult, sectionIndex, itemIndex);

    if (cachedTranslatedMeaning !== null) {
      const nextResult = mergeTranslatedDefinition(
        currentResult,
        sectionIndex,
        itemIndex,
        cachedTranslatedMeaning,
      );

      cacheKoreanDictionarySearchResult(currentResult.word, nextResult);
      syncSavedWordFromSearchResult(nextResult);
      setSearchResult(nextResult);
      setDefinitionTranslationDialog({
        word: currentResult.word,
        partOfSpeech: section.label,
        definition: item.meaning,
        translatedMeaning: cachedTranslatedMeaning,
        sectionIndex,
        itemIndex,
        status: "success",
      });
      return;
    }

    aiMeaningAbortControllerRef.current?.abort();

    const nextAbortController = new AbortController();

    aiMeaningAbortControllerRef.current = nextAbortController;
    setDefinitionTranslationDialog({
      word: currentResult.word,
      partOfSpeech: section.label,
      definition: item.meaning,
      translatedMeaning: null,
      sectionIndex,
      itemIndex,
      status: "loading",
    });

    try {
      const nextResult = await naturalizeDictionarySearchDefinition(
        currentResult,
        sectionIndex,
        itemIndex,
        nextAbortController.signal,
      );

      if (nextAbortController.signal.aborted) {
        return;
      }

      const translatedMeaning =
        nextResult.sections[sectionIndex]?.items[
          itemIndex
        ]?.translatedMeaning?.trim() ?? "";

      if (translatedMeaning.length === 0) {
        setDefinitionTranslationDialog({
          word: currentResult.word,
          partOfSpeech: section.label,
          definition: item.meaning,
          translatedMeaning: null,
          sectionIndex,
          itemIndex,
          status: "error",
        });
        return;
      }

      cacheKoreanDictionarySearchResult(currentResult.word, nextResult);
      syncSavedWordFromSearchResult(nextResult);
      setSearchResult(nextResult);
      setDefinitionTranslationDialog({
        word: currentResult.word,
        partOfSpeech: section.label,
        definition: item.meaning,
        translatedMeaning,
        sectionIndex,
        itemIndex,
        status: "success",
      });
    } catch {
      if (!nextAbortController.signal.aborted) {
        setDefinitionTranslationDialog({
          word: currentResult.word,
          partOfSpeech: section.label,
          definition: item.meaning,
          translatedMeaning: null,
          sectionIndex,
          itemIndex,
          status: "error",
        });
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

    const aiExampleRequests = createAiExampleRequests(searchResult);

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
    isLoadingMoreDefinitions,
    definitionTranslationDialog,
    aiGeneratedExamples,
    handleChangeSearchQuery,
    handleSearchSubmit,
    handleSaveSearchResult,
    handleLoadMoreDefinitions,
    handleGenerateAiExample,
    handleRequestDefinitionTranslation,
    closeDefinitionTranslation,
    clearSearchHistory,
  };
}
