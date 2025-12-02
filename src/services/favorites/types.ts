import type { WordResult } from "@/services/dictionary/types";

export type MemorizationStatus = "toMemorize" | "review" | "mastered";

export const MEMORIZATION_STATUSES: Record<MemorizationStatus, string> = {
    toMemorize: "외울 단어장",
    review: "복습 단어장",
    mastered: "터득한 단어장",
};

export const MEMORIZATION_STATUS_ORDER: MemorizationStatus[] = ["toMemorize", "review", "mastered"];

export function isMemorizationStatus(value: unknown): value is MemorizationStatus {
    return value === "toMemorize" || value === "review" || value === "mastered";
}

export type FavoriteWordEntry = {
    word: WordResult;
    status: MemorizationStatus;
    updatedAt: string;
};

export function createFavoriteEntry(word: WordResult, status: MemorizationStatus = "toMemorize"): FavoriteWordEntry {
    return {
        word,
        status,
        updatedAt: new Date().toISOString(),
    };
}
