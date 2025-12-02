import { DictionaryMode } from "@/services/dictionary/types";

export type SearchHistoryEntry = {
    term: string;
    mode: DictionaryMode;
    searchedAt: string;
};

export const SEARCH_HISTORY_LIMIT = 10;
