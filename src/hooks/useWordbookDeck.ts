import { useEffect, useState } from "react";

import type { VocabularyEntry } from "../entities/vocabulary/mockData";
import type { WordbookStage } from "../core/state/types";
import { getFilteredWordbookWords, shuffleItems } from "../core/state/helpers";

interface UseWordbookDeckParams {
  words: VocabularyEntry[];
  wordbookStage: WordbookStage;
  preferredWordId?: string | null;
  enabled?: boolean;
}

interface DeckState {
  ids: string[];
  index: number;
}

function getDeckIds(
  wordIds: string[],
  wordbookStage: WordbookStage,
  preferredWordId: string | null,
) {
  const baseIds =
    wordbookStage === "wordbook" ? shuffleItems(wordIds) : [...wordIds];

  if (preferredWordId === null || !baseIds.includes(preferredWordId)) {
    return baseIds;
  }

  return [
    preferredWordId,
    ...baseIds.filter((wordId) => wordId !== preferredWordId),
  ];
}

function getNextCycleDeckIds(
  wordIds: string[],
  wordbookStage: WordbookStage,
  currentWordId: string | null,
) {
  const nextIds = wordbookStage === "wordbook" ? shuffleItems(wordIds) : wordIds;

  if (
    currentWordId === null ||
    nextIds.length <= 1 ||
    nextIds[0] !== currentWordId
  ) {
    return nextIds;
  }

  return [...nextIds.slice(1), nextIds[0]];
}

export function useWordbookDeck({
  words,
  wordbookStage,
  preferredWordId = null,
  enabled = true,
}: UseWordbookDeckParams) {
  const [deckState, setDeckState] = useState<DeckState>({
    ids: [],
    index: 0,
  });
  const [showMeaning, setShowMeaning] = useState(false);
  const filteredWordbookWords = getFilteredWordbookWords(words, wordbookStage);
  const filteredWordbookIds = filteredWordbookWords.map((word) => word.id);
  const deckIds = deckState.ids;
  const deckIndex = deckState.index;
  const currentDeckWordId =
    deckIds.length > 0
      ? deckIds[Math.min(deckIndex, deckIds.length - 1)]
      : null;
  const currentWord =
    filteredWordbookWords.find((word) => word.id === currentDeckWordId) ??
    filteredWordbookWords[0] ??
    null;
  const currentWordPosition =
    currentWord === null || deckIds.length === 0
      ? 0
      : Math.min(deckIndex, deckIds.length - 1) + 1;
  const nextWordId =
    deckIds.length === 0 || deckIndex >= deckIds.length - 1
      ? null
      : deckIds[deckIndex + 1];

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const nextFilteredWordbookIds = getFilteredWordbookWords(
      words,
      wordbookStage,
    ).map((word) => word.id);

    setShowMeaning(false);

    if (nextFilteredWordbookIds.length === 0) {
      setDeckState({ ids: [], index: 0 });
      return;
    }

    setDeckState({
      ids: getDeckIds(nextFilteredWordbookIds, wordbookStage, preferredWordId),
      index: 0,
    });
  }, [enabled, preferredWordId, wordbookStage, words]);

  function showNextWord(currentWordId = currentWord?.id ?? null) {
    if (!enabled) {
      return;
    }

    setShowMeaning(false);
    setDeckState((currentDeckState) => {
      const activeDeckIds =
        currentDeckState.ids.length > 0
          ? currentDeckState.ids.filter((wordId) =>
              filteredWordbookIds.includes(wordId),
            )
          : getDeckIds(filteredWordbookIds, wordbookStage, preferredWordId);

      if (activeDeckIds.length === 0) {
        return { ids: [], index: 0 };
      }

      if (activeDeckIds.length === 1) {
        return { ids: activeDeckIds, index: 0 };
      }

      const currentIndex =
        currentWordId === null ? -1 : activeDeckIds.indexOf(currentWordId);

      if (currentIndex === -1) {
        const fallbackIndex = Math.min(
          currentDeckState.index + 1,
          activeDeckIds.length - 1,
        );

        return { ids: activeDeckIds, index: fallbackIndex };
      }

      const nextIndex = currentIndex + 1;

      if (nextIndex < activeDeckIds.length) {
        return { ids: activeDeckIds, index: nextIndex };
      }

      return {
        ids: getNextCycleDeckIds(activeDeckIds, wordbookStage, currentWordId),
        index: 0,
      };
    });
  }

  return {
    currentWord,
    currentWordPosition,
    filteredWordbookIds,
    nextWordId,
    showMeaning,
    setShowMeaning,
    showNextWord,
  };
}
