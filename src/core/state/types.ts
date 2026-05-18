import type { LearningStatus } from "../../entities/vocabulary/mockData";

export type ScreenKey = "wordbook" | "search" | "settings";
export type ThemeMode = "system" | "light" | "dark";
export type DictionaryMode = "en-ko" | "en-en";
export type WordbookStage = "wordbook" | "learned" | "wrong";
export type StudyRecallFeedback = "again" | "hard" | "easy";
export type StudyEventType =
  | "recall_easy"
  | "recall_hard"
  | "recall_again";

export interface StudyEvent {
  id: string;
  wordId: string;
  type: StudyEventType;
  occurredAt: string;
}

export interface ScreenMeta {
  label: string;
}

export interface StatusCounts {
  memorize: number;
  review: number;
  mastered: number;
}

export interface StorageKeys {
  words: string;
  history: string;
  studyEvents: string;
  theme: string;
  dictionaryMode: string;
}

export type NextStatusMap = Partial<Record<LearningStatus, LearningStatus>>;
