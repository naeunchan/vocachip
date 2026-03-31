import { FavoriteWordEntry } from "@/services/favorites/types";

export type FavoritesListProps = {
    entries: FavoriteWordEntry[];
    emptyMessage?: string;
    onMoveToReview: (word: string) => void;
    onPlayAudio: (word: FavoriteWordEntry["word"]) => void;
    pronunciationAvailable: boolean;
    audioLoadingWord?: string | null;
};

export type FavoriteItemProps = {
    item: FavoriteWordEntry;
    onMoveToReview: (word: string) => void;
    onPlayAudio: (word: FavoriteWordEntry["word"]) => void;
    pronunciationAvailable: boolean;
    audioLoadingWord?: string | null;
};
