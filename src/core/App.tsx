import { Badge, Text } from "@toss/tds-mobile";
import { useEffect, useRef, useState } from "react";

import "./App.css";
import { STORAGE_KEYS } from "./state/constants";
import {
  applyManualWordbookStageChange,
  applyRecallFeedbackToWord,
  appendStudyEvent,
  getLearnedWordbookWords,
  getPendingWrongWords,
  loadInitialAppState,
  resetWordLearningProgress,
} from "./state/helpers";
import { useDictionarySearch } from "../hooks/useDictionarySearch";
import { useDocumentTheme } from "../hooks/useDocumentTheme";
import { usePersistentState } from "../hooks/usePersistentState";
import { useWordbookDeck } from "../hooks/useWordbookDeck";
import type {
  ScreenKey,
  StatusCounts,
  StudyRecallFeedback,
  WordbookStage,
} from "./state/types";
import { BottomNav } from "../shared/layout/BottomNav";
import { type VocabularyEntry } from "../entities/vocabulary/mockData";
import { SearchScreen } from "../features/search/SearchScreen";
import { SettingsScreen } from "../features/settings/SettingsScreen";
import { WordbookScreen } from "../features/wordbook/WordbookScreen";

function TopAdBanner() {
  return (
    <aside className="top-ad-banner" aria-label="광고 배너">
      <div className="top-ad-banner__content">
        <Badge size="small" color="blue" variant="weak">
          광고
        </Badge>
        <div className="top-ad-banner__copy">
          <Text
            typography="t6"
            fontWeight="bold"
            color="var(--text-primary)"
            display="block"
          >
            하루 5분 영어 루틴
          </Text>
          <Text
            typography="t7"
            fontWeight="regular"
            color="var(--text-secondary)"
            display="block"
          >
            AI 예문으로 오늘 단어를 더 빠르게 복습해요
          </Text>
        </div>
      </div>
    </aside>
  );
}

function App() {
  const [initialAppState] = useState(() => loadInitialAppState());
  const [activeScreen, setActiveScreen] = useState<ScreenKey>("search");
  const [words, setWords] = usePersistentState(
    STORAGE_KEYS.words,
    initialAppState.words,
  );
  const [, setStudyEvents] = usePersistentState(
    STORAGE_KEYS.studyEvents,
    initialAppState.studyEvents,
  );
  const [themeMode, setThemeMode] = usePersistentState(
    STORAGE_KEYS.theme,
    initialAppState.themeMode,
  );
  const [wordbookStage, setWordbookStage] = useState<WordbookStage>("wordbook");
  const [preferredWordId, setPreferredWordId] = useState<string | null>(null);
  const searchAudioRef = useRef<HTMLAudioElement | null>(null);
  const [activePronunciationWord, setActivePronunciationWord] = useState<
    string | null
  >(null);

  useDocumentTheme(themeMode);

  const {
    currentWord,
    nextWordId: nextDeckWordId,
    showMeaning,
    setShowMeaning,
    showNextWord,
  } = useWordbookDeck({
    words,
    wordbookStage,
    preferredWordId,
    enabled: activeScreen === "wordbook",
  });
  const {
    searchQuery,
    searchStatus,
    searchResult,
    searchHistory,
    emptySearchSuggestions,
    isSearchResultSaved,
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
  } = useDictionarySearch({
    initialHistory: initialAppState.history,
    words,
    setWords,
  });

  useEffect(() => {
    return () => {
      searchAudioRef.current?.pause();

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const savedWords = words.filter((word) => word.saved);
  const statusCounts: StatusCounts = {
    memorize: savedWords.filter((word) => word.status === "memorize").length,
    review: savedWords.filter((word) => word.status === "review").length,
    mastered: savedWords.filter((word) => word.status === "mastered").length,
  };
  const wrongAnswerWords = getPendingWrongWords(savedWords);
  const learnedWordbookWords = getLearnedWordbookWords(savedWords);
  function clearPronunciation(word?: string) {
    setActivePronunciationWord((currentWord) =>
      word === undefined || currentWord === word ? null : currentWord,
    );
  }

  function stopPronunciation() {
    searchAudioRef.current?.pause();
    searchAudioRef.current = null;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    clearPronunciation();
  }

  function speakWord(word: string) {
    if (!("speechSynthesis" in window)) {
      clearPronunciation(word);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);

    utterance.lang = "en-US";
    utterance.rate = 0.92;
    utterance.onend = () => {
      clearPronunciation(word);
    };
    utterance.onerror = () => {
      clearPronunciation(word);
    };

    window.speechSynthesis.speak(utterance);
  }

  function playPronunciation(word: string, audioUrl?: string | null) {
    stopPronunciation();
    setActivePronunciationWord(word);

    if (audioUrl) {
      try {
        const nextAudio = new Audio(audioUrl);
        const handleAudioPlaybackDone = () => {
          if (searchAudioRef.current === nextAudio) {
            searchAudioRef.current = null;
          }

          clearPronunciation(word);
        };

        nextAudio.addEventListener("ended", handleAudioPlaybackDone, {
          once: true,
        });
        nextAudio.addEventListener("error", handleAudioPlaybackDone, {
          once: true,
        });

        searchAudioRef.current = nextAudio;
        void nextAudio.play().catch(() => {
          if (searchAudioRef.current === nextAudio) {
            searchAudioRef.current = null;
          }

          speakWord(word);
        });
        return;
      } catch {
        speakWord(word);
        return;
      }
    }

    speakWord(word);
  }

  function updateWord(
    wordId: string,
    updater: (entry: VocabularyEntry) => VocabularyEntry,
  ) {
    setWords((currentWords) =>
      currentWords.map((word) => (word.id === wordId ? updater(word) : word)),
    );
  }

  function applyRecallFeedback(wordId: string, feedback: StudyRecallFeedback) {
    const eventType =
      feedback === "easy"
        ? "recall_easy"
        : feedback === "hard"
          ? "recall_hard"
          : "recall_again";
    const preferredNextWordId =
      feedback === "again" ? (nextDeckWordId ?? wordId) : nextDeckWordId;

    setPreferredWordId(preferredNextWordId ?? null);
    updateWord(wordId, (word) => applyRecallFeedbackToWord(word, feedback));
    setStudyEvents((currentEvents) =>
      appendStudyEvent(currentEvents, wordId, eventType),
    );
  }

  function moveWordToWordbookStage(wordId: string, stage: WordbookStage) {
    updateWord(wordId, (word) => applyManualWordbookStageChange(word, stage));
  }

  function removeFromWordbook(wordId: string) {
    updateWord(wordId, (word) => resetWordLearningProgress(word));
  }

  return (
    <div
      className={`app-shell ${activeScreen === "wordbook" ? "app-shell--wordbook" : ""}`}
    >
      <div className="app-frame">
        <TopAdBanner />
        <main
          className={`screen-body ${activeScreen === "wordbook" ? "screen-body--wordbook" : ""}`}
        >
          {activeScreen === "wordbook" ? (
            <WordbookScreen
              wordbookStage={wordbookStage}
              wordbookCounts={{
                wordbook: statusCounts.memorize,
                learned: learnedWordbookWords.length,
                wrong: wrongAnswerWords.length,
              }}
              onSelectWordbookStage={(stage) => {
                setPreferredWordId(null);
                setWordbookStage(stage);
              }}
              currentWord={currentWord}
              showMeaning={showMeaning}
              isPronouncingWord={
                currentWord !== null &&
                activePronunciationWord === currentWord.word
              }
              onToggleMeaning={() => setShowMeaning((current) => !current)}
              onSpeakWord={playPronunciation}
              onNextWord={showNextWord}
              onApplyRecallFeedback={applyRecallFeedback}
              onMoveWordToWordbookStage={moveWordToWordbookStage}
              onRemoveFromWordbook={removeFromWordbook}
              onGoToSearch={() => setActiveScreen("search")}
            />
          ) : null}

          {activeScreen === "search" ? (
            <SearchScreen
              searchQuery={searchQuery}
              onChangeSearchQuery={handleChangeSearchQuery}
              onSubmitSearch={handleSearchSubmit}
              searchStatus={searchStatus}
              searchResult={searchResult}
              searchHistory={searchHistory}
              emptySuggestions={emptySearchSuggestions}
              isSaved={isSearchResultSaved}
              aiExampleStatus={aiExampleStatus}
              isLoadingMoreDefinitions={isLoadingMoreDefinitions}
              definitionTranslationDialog={definitionTranslationDialog}
              aiGeneratedExamples={aiGeneratedExamples}
              isPronouncingResult={
                searchResult !== null &&
                activePronunciationWord === searchResult.word
              }
              onSaveResult={handleSaveSearchResult}
              onSpeakResult={playPronunciation}
              onLoadMoreDefinitions={handleLoadMoreDefinitions}
              onGenerateAiExample={handleGenerateAiExample}
              onRequestDefinitionTranslation={
                handleRequestDefinitionTranslation
              }
              onCloseDefinitionTranslation={closeDefinitionTranslation}
              onSelectHistory={handleSearchSubmit}
              onClearHistory={clearSearchHistory}
            />
          ) : null}

          {activeScreen === "settings" ? (
            <SettingsScreen
              themeMode={themeMode}
              onSelectThemeMode={setThemeMode}
            />
          ) : null}
        </main>

        <BottomNav
          activeScreen={activeScreen}
          onSelectScreen={setActiveScreen}
        />
      </div>
    </div>
  );
}

export default App;
