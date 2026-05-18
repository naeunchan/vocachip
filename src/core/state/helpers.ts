import {
  defaultSearchHistory,
  defaultWordLearningProgress,
  defaultWords,
  type LearningStatus,
  type QuizResult,
  type VocabularyEntry,
} from "../../entities/vocabulary/mockData";
import {
  APP_STORAGE_VERSION,
  LEGACY_STORAGE_KEYS,
  STORAGE_KEYS,
  STORAGE_VERSION_KEY,
} from "./constants";
import type {
  DictionaryMode,
  StudyEvent,
  StudyEventType,
  StudyRecallFeedback,
  ThemeMode,
  WordbookStage,
} from "./types";

interface InitialAppState {
  words: VocabularyEntry[];
  history: string[];
  studyEvents: StudyEvent[];
  themeMode: ThemeMode;
  dictionaryMode: DictionaryMode;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const STUDY_EVENT_RETENTION_DAYS = 30;

function normalizeThemeMode(value: unknown): ThemeMode {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : "system";
}

function normalizeDictionaryMode(value: unknown): DictionaryMode {
  if (value === "ko-en") {
    return "en-ko";
  }

  return value === "en-en" ? "en-en" : "en-ko";
}

function normalizeNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function normalizeQuizResult(value: unknown): QuizResult | null {
  return value === "correct" || value === "wrong" ? value : null;
}

function normalizeReviewIntervalDays(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return defaultWordLearningProgress.reviewIntervalDays;
  }

  return Math.max(0, Math.round(value));
}

function normalizeCount(value: unknown, fallback = 0): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(0, Math.round(value));
}

function createStudyEventId() {
  if ("crypto" in globalThis && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeStudyEventType(value: unknown): StudyEventType | null {
  return value === "recall_easy" ||
    value === "recall_hard" ||
    value === "recall_again"
    ? value
    : null;
}

function normalizeStudyEvent(event: StudyEvent): StudyEvent | null {
  const type = normalizeStudyEventType(event.type);
  const occurredAt = normalizeNullableString(event.occurredAt);

  if (
    type === null ||
    occurredAt === null ||
    parseDateString(occurredAt) === null
  ) {
    return null;
  }

  return {
    id:
      typeof event.id === "string" && event.id.trim().length > 0
        ? event.id
        : createStudyEventId(),
    wordId:
      typeof event.wordId === "string" && event.wordId.trim().length > 0
        ? event.wordId
        : "unknown",
    type,
    occurredAt,
  };
}

function normalizeVocabularyEntry(word: VocabularyEntry): VocabularyEntry {
  return {
    ...defaultWordLearningProgress,
    ...word,
    reviewIntervalDays: normalizeReviewIntervalDays(word.reviewIntervalDays),
    nextReviewAt: normalizeNullableString(word.nextReviewAt),
    lastReviewedAt: normalizeNullableString(word.lastReviewedAt),
    correctStreak: normalizeCount(word.correctStreak),
    wrongCount: normalizeCount(word.wrongCount),
    lastWrongAt: normalizeNullableString(word.lastWrongAt),
    lastQuizResult: normalizeQuizResult(word.lastQuizResult),
  };
}

function cloneDefaultWord(word: VocabularyEntry): VocabularyEntry {
  return {
    ...defaultWordLearningProgress,
    ...word,
    exampleVariants: [...word.exampleVariants],
    dictionarySections: word.dictionarySections?.map((section) => ({
      ...section,
      items: section.items.map((item) => ({ ...item })),
    })),
  };
}

function trimStudyEvents(events: StudyEvent[], now = new Date()) {
  const cutoffDate = addDays(getStartOfDay(now), -STUDY_EVENT_RETENTION_DAYS);

  return events
    .filter((event) => {
      const occurredAt = parseDateString(event.occurredAt);

      return (
        occurredAt !== null && occurredAt.getTime() >= cutoffDate.getTime()
      );
    })
    .sort((firstEvent, secondEvent) => {
      const firstTime = parseDateString(firstEvent.occurredAt)?.getTime() ?? 0;
      const secondTime =
        parseDateString(secondEvent.occurredAt)?.getTime() ?? 0;

      return firstTime - secondTime;
    });
}

export function readStoredValue<T>(key: string, fallback: T): T {
  try {
    const rawValue = window.localStorage.getItem(key);

    return rawValue ? (JSON.parse(rawValue) as T) : fallback;
  } catch {
    return fallback;
  }
}

function createDefaultAppState(): InitialAppState {
  return {
    words: defaultWords.map((word) => cloneDefaultWord(word)),
    history: [...defaultSearchHistory],
    studyEvents: [],
    themeMode: "system",
    dictionaryMode: "en-ko",
  };
}

function mergeWordsWithDefaults(words: VocabularyEntry[]) {
  const mergedWords = defaultWords.map((defaultWord) => {
    const storedWord = words.find((word) => word.id === defaultWord.id);

    if (storedWord === undefined) {
      return cloneDefaultWord(defaultWord);
    }

    return normalizeVocabularyEntry({
      ...cloneDefaultWord(defaultWord),
      ...storedWord,
      meaning: defaultWord.meaning,
      exampleVariants:
        Array.isArray(storedWord.exampleVariants) &&
        storedWord.exampleVariants.length > 0
          ? [...storedWord.exampleVariants]
          : [...defaultWord.exampleVariants],
      dictionarySections: defaultWord.dictionarySections?.map((section) => ({
        ...section,
        items: section.items.map((item) => ({ ...item })),
      })),
    });
  });

  const extraWords = words
    .filter(
      (word) => !defaultWords.some((defaultWord) => defaultWord.id === word.id),
    )
    .map((word) => normalizeVocabularyEntry(word));

  return [...mergedWords, ...extraWords];
}

function writeStoredValue(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function clearLegacyStorage() {
  window.localStorage.removeItem(LEGACY_STORAGE_KEYS.words);
  window.localStorage.removeItem(LEGACY_STORAGE_KEYS.history);
  window.localStorage.removeItem(LEGACY_STORAGE_KEYS.studyEvents);
  window.localStorage.removeItem(LEGACY_STORAGE_KEYS.theme);
  window.localStorage.removeItem(LEGACY_STORAGE_KEYS.dictionaryMode);
}

function readPersistedAppState(defaultState: InitialAppState): InitialAppState {
  return {
    words: mergeWordsWithDefaults(
      readStoredValue(
        STORAGE_KEYS.words,
        readStoredValue(LEGACY_STORAGE_KEYS.words, defaultState.words),
      ),
    ),
    history: readStoredValue(
      STORAGE_KEYS.history,
      readStoredValue(LEGACY_STORAGE_KEYS.history, defaultState.history),
    ),
    studyEvents: trimStudyEvents(
      readStoredValue(
        STORAGE_KEYS.studyEvents,
        readStoredValue(
          LEGACY_STORAGE_KEYS.studyEvents,
          defaultState.studyEvents,
        ),
        )
        .map((event) => normalizeStudyEvent(event))
        .filter((event): event is StudyEvent => event !== null),
    ),
    themeMode: normalizeThemeMode(
      readStoredValue(
        STORAGE_KEYS.theme,
        normalizeThemeMode(
          readStoredValue(LEGACY_STORAGE_KEYS.theme, defaultState.themeMode),
        ),
      ),
    ),
    dictionaryMode: normalizeDictionaryMode(
      readStoredValue(
        STORAGE_KEYS.dictionaryMode,
        normalizeDictionaryMode(
          readStoredValue(
            LEGACY_STORAGE_KEYS.dictionaryMode,
            defaultState.dictionaryMode,
          ),
        ),
      ),
    ),
  };
}

function writePersistedAppState(state: InitialAppState) {
  writeStoredValue(STORAGE_KEYS.words, state.words);
  writeStoredValue(STORAGE_KEYS.history, state.history);
  writeStoredValue(
    STORAGE_KEYS.studyEvents,
    trimStudyEvents(state.studyEvents),
  );
  writeStoredValue(STORAGE_KEYS.theme, state.themeMode);
  writeStoredValue(STORAGE_KEYS.dictionaryMode, state.dictionaryMode);
}

export function loadInitialAppState(): InitialAppState {
  const defaultState = createDefaultAppState();

  try {
    const currentVersion = window.localStorage.getItem(STORAGE_VERSION_KEY);
    const persistedState = readPersistedAppState(defaultState);

    if (currentVersion !== APP_STORAGE_VERSION) {
      writePersistedAppState(persistedState);
      window.localStorage.setItem(STORAGE_VERSION_KEY, APP_STORAGE_VERSION);
      clearLegacyStorage();

      return persistedState;
    }

    return persistedState;
  } catch {
    return defaultState;
  }
}

export function shuffleItems<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index];

    shuffled[index] = shuffled[nextIndex];
    shuffled[nextIndex] = current;
  }

  return shuffled;
}

export function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number) {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateString(value: string | null) {
  if (value === null) {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isSameDay(dateString: string | null, compareDate = new Date()) {
  const parsedDate = parseDateString(dateString);

  if (parsedDate === null) {
    return false;
  }

  return toLocalDateKey(parsedDate) === toLocalDateKey(compareDate);
}

export function isWordDue(word: VocabularyEntry, now = new Date()) {
  if (!word.saved || word.status === "memorize") {
    return false;
  }

  const dueDate = parseDateString(word.nextReviewAt);

  if (dueDate === null) {
    return false;
  }

  return dueDate.getTime() <= now.getTime();
}

export function getDueReviewWords(words: VocabularyEntry[], now = new Date()) {
  return words
    .filter((word) => isWordDue(word, now))
    .sort((firstWord, secondWord) => {
      const firstDueDate =
        parseDateString(firstWord.nextReviewAt)?.getTime() ?? 0;
      const secondDueDate =
        parseDateString(secondWord.nextReviewAt)?.getTime() ?? 0;

      return firstDueDate - secondDueDate;
    });
}

export function getPendingWrongWords(words: VocabularyEntry[]) {
  return words
    .filter((word) => word.saved && word.lastQuizResult === "wrong")
    .sort((firstWord, secondWord) => {
      const secondWrongAt =
        parseDateString(secondWord.lastWrongAt)?.getTime() ?? 0;
      const firstWrongAt =
        parseDateString(firstWord.lastWrongAt)?.getTime() ?? 0;

      if (secondWrongAt !== firstWrongAt) {
        return secondWrongAt - firstWrongAt;
      }

      return secondWord.wrongCount - firstWord.wrongCount;
    });
}

export function getLearnedWordbookWords(
  words: VocabularyEntry[],
  now = new Date(),
) {
  const wrongWordIds = new Set(
    getPendingWrongWords(words).map((word) => word.id),
  );

  return words
    .filter(
      (word) =>
        word.saved && word.status !== "memorize" && !wrongWordIds.has(word.id),
    )
    .sort((firstWord, secondWord) => {
      const firstDuePriority = isWordDue(firstWord, now) ? 0 : 1;
      const secondDuePriority = isWordDue(secondWord, now) ? 0 : 1;

      if (firstDuePriority !== secondDuePriority) {
        return firstDuePriority - secondDuePriority;
      }

      const firstReviewAt =
        parseDateString(firstWord.nextReviewAt)?.getTime() ??
        Number.MAX_SAFE_INTEGER;
      const secondReviewAt =
        parseDateString(secondWord.nextReviewAt)?.getTime() ??
        Number.MAX_SAFE_INTEGER;

      if (firstReviewAt !== secondReviewAt) {
        return firstReviewAt - secondReviewAt;
      }

      return firstWord.word.localeCompare(secondWord.word);
    });
}

export function getWordbookStageForWord(word: VocabularyEntry): WordbookStage {
  if (word.lastQuizResult === "wrong") {
    return "wrong";
  }

  return word.status === "memorize" ? "wordbook" : "learned";
}

export function appendStudyEvent(
  events: StudyEvent[],
  wordId: string,
  type: StudyEventType,
  now = new Date(),
) {
  return trimStudyEvents(
    [
      ...events,
      {
        id: createStudyEventId(),
        wordId,
        type,
        occurredAt: now.toISOString(),
      },
    ],
    now,
  );
}

export function getStudyEventStreakDays(
  events: StudyEvent[],
  now = new Date(),
) {
  const eventDateKeys = new Set(
    events
      .map((event) => parseDateString(event.occurredAt))
      .filter((date): date is Date => date !== null)
      .map((date) => toLocalDateKey(date)),
  );

  if (!eventDateKeys.has(toLocalDateKey(now))) {
    return 0;
  }

  let streakDays = 0;
  let cursor = getStartOfDay(now);

  while (eventDateKeys.has(toLocalDateKey(cursor))) {
    streakDays += 1;
    cursor = addDays(cursor, -1);
  }

  return streakDays;
}

export function getTodayStudiedCount(
  words: VocabularyEntry[],
  now = new Date(),
) {
  return words.filter(
    (word) => word.saved && isSameDay(word.lastReviewedAt, now),
  ).length;
}

export function getStudyStreakDays(words: VocabularyEntry[], now = new Date()) {
  const reviewedDateKeys = new Set(
    words
      .map((word) => parseDateString(word.lastReviewedAt))
      .filter((date): date is Date => date !== null)
      .map((date) => toLocalDateKey(date)),
  );

  if (!reviewedDateKeys.has(toLocalDateKey(now))) {
    return 0;
  }

  let streakDays = 0;
  let cursor = getStartOfDay(now);

  while (reviewedDateKeys.has(toLocalDateKey(cursor))) {
    streakDays += 1;
    cursor = addDays(cursor, -1);
  }

  return streakDays;
}

export function getRelativeReviewLabel(
  nextReviewAt: string | null,
  now = new Date(),
) {
  const reviewDate = parseDateString(nextReviewAt);

  if (reviewDate === null) {
    return "일정 없음";
  }

  const diffInDays = Math.round(
    (getStartOfDay(reviewDate).getTime() - getStartOfDay(now).getTime()) /
      DAY_IN_MS,
  );

  if (diffInDays <= 0) {
    return "오늘";
  }

  if (diffInDays === 1) {
    return "내일";
  }

  return `${diffInDays}일 뒤`;
}

function getNextReviewIntervalDays(previousIntervalDays: number) {
  if (previousIntervalDays <= 0) {
    return 1;
  }

  if (previousIntervalDays === 1) {
    return 3;
  }

  if (previousIntervalDays === 3) {
    return 7;
  }

  return Math.min(previousIntervalDays * 2, 30);
}

export function applyStatusAdvance(word: VocabularyEntry, now = new Date()) {
  if (word.status === "mastered") {
    return word;
  }

  const reviewedAt = now.toISOString();
  const nextStatus = word.status === "memorize" ? "review" : "mastered";
  const nextIntervalDays =
    word.status === "memorize"
      ? 1
      : getNextReviewIntervalDays(Math.max(word.reviewIntervalDays, 1));

  return {
    ...word,
    status: nextStatus,
    reviewIntervalDays: nextIntervalDays,
    nextReviewAt: addDays(getStartOfDay(now), nextIntervalDays).toISOString(),
    lastReviewedAt: reviewedAt,
    correctStreak: Math.max(word.correctStreak + 1, 1),
    lastQuizResult: "correct" as const,
  };
}

export function applyRecallFeedbackToWord(
  word: VocabularyEntry,
  feedback: StudyRecallFeedback,
  now = new Date(),
) {
  const reviewedAt = now.toISOString();

  if (feedback === "again") {
    return {
      ...word,
      status: "review" as const,
      reviewIntervalDays: 1,
      nextReviewAt: reviewedAt,
      lastReviewedAt: reviewedAt,
      correctStreak: 0,
      wrongCount: word.wrongCount + 1,
      lastWrongAt: reviewedAt,
      lastQuizResult: "wrong" as const,
    };
  }

  if (feedback === "hard") {
    return {
      ...word,
      status: "review" as const,
      reviewIntervalDays: 1,
      nextReviewAt: addDays(getStartOfDay(now), 1).toISOString(),
      lastReviewedAt: reviewedAt,
      correctStreak: 0,
      lastQuizResult: "correct" as const,
    };
  }

  if (word.status === "mastered") {
    const nextIntervalDays = getNextReviewIntervalDays(
      Math.max(word.reviewIntervalDays, 3),
    );

    return {
      ...word,
      status: "mastered" as const,
      reviewIntervalDays: nextIntervalDays,
      nextReviewAt: addDays(getStartOfDay(now), nextIntervalDays).toISOString(),
      lastReviewedAt: reviewedAt,
      correctStreak: Math.max(word.correctStreak + 1, 1),
      lastQuizResult: "correct" as const,
    };
  }

  return applyStatusAdvance(word, now);
}

export function applyManualStatusChange(
  word: VocabularyEntry,
  status: LearningStatus,
  now = new Date(),
) {
  if (status === word.status) {
    return word;
  }

  if (status === "memorize") {
    return {
      ...word,
      status,
      reviewIntervalDays: 0,
      nextReviewAt: null,
      correctStreak: 0,
      lastQuizResult: null,
    };
  }

  if (status === "review") {
    return {
      ...word,
      status,
      nextReviewAt: now.toISOString(),
      reviewIntervalDays: Math.max(word.reviewIntervalDays, 1),
      lastQuizResult:
        word.lastQuizResult === "wrong" ? "wrong" : word.lastQuizResult,
    };
  }

  const nextIntervalDays = getNextReviewIntervalDays(
    Math.max(word.reviewIntervalDays, 1),
  );

  return {
    ...word,
    status,
    reviewIntervalDays: nextIntervalDays,
    nextReviewAt: addDays(getStartOfDay(now), nextIntervalDays).toISOString(),
    lastReviewedAt: now.toISOString(),
    correctStreak: Math.max(word.correctStreak, 1),
    lastQuizResult: "correct" as const,
  };
}

export function applyManualWordbookStageChange(
  word: VocabularyEntry,
  stage: WordbookStage,
  now = new Date(),
) {
  if (stage === "wordbook") {
    return applyManualStatusChange(word, "memorize", now);
  }

  if (stage === "learned") {
    const nextWord = applyManualStatusChange(word, "review", now);

    return {
      ...nextWord,
      lastQuizResult: "correct" as const,
    };
  }

  const reviewedAt = now.toISOString();

  return {
    ...word,
    status: word.status === "memorize" ? "review" : word.status,
    reviewIntervalDays: Math.max(word.reviewIntervalDays, 1),
    nextReviewAt: reviewedAt,
    lastReviewedAt: reviewedAt,
    correctStreak: 0,
    wrongCount: Math.max(word.wrongCount, 1),
    lastWrongAt: reviewedAt,
    lastQuizResult: "wrong" as const,
  };
}

export function scheduleWordForTodayReview(
  word: VocabularyEntry,
  now = new Date(),
) {
  return {
    ...word,
    status: "review" as const,
    reviewIntervalDays: Math.max(word.reviewIntervalDays, 1),
    nextReviewAt: now.toISOString(),
  };
}

export function resetWordLearningProgress(
  word: VocabularyEntry,
): VocabularyEntry {
  return {
    ...word,
    status: "memorize",
    saved: false,
    ...defaultWordLearningProgress,
  };
}

export function getSearchResults(words: VocabularyEntry[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return [];
  }

  return [...words]
    .filter((word) => word.word.toLowerCase().includes(normalizedQuery))
    .sort((firstWord, secondWord) => {
      const firstStartsWith = firstWord.word
        .toLowerCase()
        .startsWith(normalizedQuery)
        ? 0
        : 1;
      const secondStartsWith = secondWord.word
        .toLowerCase()
        .startsWith(normalizedQuery)
        ? 0
        : 1;

      if (firstStartsWith !== secondStartsWith) {
        return firstStartsWith - secondStartsWith;
      }

      return firstWord.word.localeCompare(secondWord.word);
    });
}

export function getFilteredWordbookWords(
  words: VocabularyEntry[],
  wordbookStage: WordbookStage,
) {
  const matchedWords = words.filter((word) => word.saved);

  if (wordbookStage === "wrong") {
    return getPendingWrongWords(matchedWords);
  }

  if (wordbookStage === "learned") {
    return getLearnedWordbookWords(matchedWords);
  }

  return matchedWords.filter((word) => word.status === "memorize");
}
