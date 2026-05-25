import type { LearningStatus } from "../../entities/vocabulary/mockData";
import type {
  NextStatusMap,
  ScreenKey,
  ScreenMeta,
  StorageKeys,
} from "./types";

export const STORAGE_KEYS: StorageKeys = {
  words: "vocachip.words",
  history: "vocachip.history",
  studyEvents: "vocachip.study-events",
  theme: "vocachip.theme",
};

export const STORAGE_VERSION_KEY = "vocachip.storage-version";
export const APP_STORAGE_VERSION = "2026-05-25.translation-on-demand";

export const LEGACY_STORAGE_KEYS: StorageKeys = {
  words: "vocahip.words",
  history: "vocahip.history",
  studyEvents: "vocahip.study-events",
  theme: "vocahip.theme",
};

export const screenMeta: Record<ScreenKey, ScreenMeta> = {
  search: {
    label: "단어 검색",
  },
  wordbook: {
    label: "내 단어장",
  },
  settings: {
    label: "설정",
  },
};

export const nextStatusMap: NextStatusMap = {
  memorize: "review",
  review: "mastered",
};

export const statusActionLabels: Record<LearningStatus, string> = {
  memorize: "복습으로 이동",
  review: "완료로 이동",
  mastered: "내 단어장에서 삭제",
};
