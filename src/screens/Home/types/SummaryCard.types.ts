import { DictionaryMode } from "@/services/dictionary/types";
import { MemorizationStatus } from "@/services/favorites/types";

export type SummaryCardProps = {
    userName: string;
    mode: DictionaryMode;
    counts: Record<MemorizationStatus, number>;
};
