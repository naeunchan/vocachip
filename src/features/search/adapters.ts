import {
  defaultWordLearningProgress,
  type VocabularyEntry,
} from "../../entities/vocabulary/mockData";
import type { DictionarySearchResult } from "./types";

function createWordId(word: string) {
  const slug = word
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  const fallbackSlug = slug.length > 0 ? slug : "word";

  if ("crypto" in globalThis && "randomUUID" in globalThis.crypto) {
    return `${fallbackSlug}-${globalThis.crypto.randomUUID()}`;
  }

  return `${fallbackSlug}-${Date.now()}`;
}

function hasKoreanText(value: string | null | undefined) {
  return (
    value !== null && value !== undefined && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(value)
  );
}

function toConciseMeaning(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = value.trim().replace(/\s+/g, " ");

  if (!hasKoreanText(normalized)) {
    return null;
  }

  const withoutParentheses = normalized.replace(/\([^)]*\)/g, "").trim();
  const firstSentence = withoutParentheses.split(/[.;]/)[0]?.trim() ?? "";
  const firstChunk = firstSentence.split(/[;,]/)[0]?.trim() ?? "";

  return firstChunk.length > 0 ? firstChunk : normalized;
}

function getConciseTranslatedMeaning(
  item: DictionarySearchResult["sections"][number]["items"][number] | undefined,
) {
  const translatedSubMeaning =
    item?.translatedSubMeanings
      ?.map((meaning) => toConciseMeaning(meaning))
      .find((meaning): meaning is string => meaning !== null) ?? null;

  return toConciseMeaning(item?.translatedMeaning) ?? translatedSubMeaning;
}

export function createVocabularyEntryFromSearchResult(
  result: DictionarySearchResult,
  existingWord?: VocabularyEntry,
): VocabularyEntry {
  const firstSection = result.sections[0];
  const firstItem = firstSection?.items[0];
  const existingMeaning = existingWord?.meaning;
  const translatedMeaning = getConciseTranslatedMeaning(firstItem);
  const displayMeaning =
    existingMeaning !== undefined && hasKoreanText(existingMeaning)
      ? existingMeaning
      : translatedMeaning ||
        existingMeaning ||
        firstItem?.meaning ||
        result.word;
  const existingExamples = existingWord?.exampleVariants ?? [];

  return {
    ...defaultWordLearningProgress,
    id: existingWord?.id ?? createWordId(result.word),
    word: result.word,
    phonetic: result.phonetic ?? existingWord?.phonetic ?? "",
    audioUrl: result.audioUrl ?? existingWord?.audioUrl ?? null,
    partOfSpeech:
      firstSection?.label.toLowerCase() ?? existingWord?.partOfSpeech ?? "word",
    meaning: displayMeaning,
    definition: firstItem?.meaning ?? existingWord?.definition ?? result.word,
    usageTip:
      existingWord?.usageTip ?? "사전에서 불러온 정의를 먼저 익혀 보세요.",
    saved: true,
    status: existingWord?.status ?? "memorize",
    reviewIntervalDays:
      existingWord?.reviewIntervalDays ??
      defaultWordLearningProgress.reviewIntervalDays,
    nextReviewAt:
      existingWord?.nextReviewAt ?? defaultWordLearningProgress.nextReviewAt,
    lastReviewedAt:
      existingWord?.lastReviewedAt ??
      defaultWordLearningProgress.lastReviewedAt,
    correctStreak:
      existingWord?.correctStreak ?? defaultWordLearningProgress.correctStreak,
    wrongCount:
      existingWord?.wrongCount ?? defaultWordLearningProgress.wrongCount,
    lastWrongAt:
      existingWord?.lastWrongAt ?? defaultWordLearningProgress.lastWrongAt,
    lastQuizResult:
      existingWord?.lastQuizResult ??
      defaultWordLearningProgress.lastQuizResult,
    exampleVariants: [...existingExamples],
    dictionarySections: result.sections.map((section) => ({
      label: section.label,
      items: section.items.map((item) => ({
        meaning: item.meaning,
        example: "",
      })),
    })),
  };
}
