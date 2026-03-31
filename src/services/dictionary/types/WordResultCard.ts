import { WordResult } from "./WordResult";

export type WordResultCardProps = {
    result: WordResult;
    onToggleFavorite: (word: WordResult) => void;
    onPlayPronunciation: () => void;
    pronunciationAvailable: boolean;
    pronunciationLoading?: boolean;
    isFavorite: boolean;
    examplesVisible: boolean;
    onToggleExamples: () => void;
    onRegenerateExamples?: () => void;
};
