import type {
  DictionarySearchDefinition,
  DictionarySearchResult,
  DictionarySearchSection,
} from "./types";

const maxDefinitionsPerSection = 3;
const maxTranslationRequestsPerSearch = 9;
const maxRelatedWords = 8;
const translationByteLimit = 500;
const translationTimeoutMs = 3500;
const relatedWordTimeoutMs = 2200;
const translationCache = new Map<string, string | null>();
const relatedWordCache = new Map<string, string[]>();

interface RelatedWordQueryConfig {
  parameter: "rel_syn" | "rel_trg" | "rel_spc" | "rel_gen" | "ml";
  max: number;
  weight: number;
}

const relatedWordQueryConfigs: RelatedWordQueryConfig[] = [
  { parameter: "rel_syn", max: 6, weight: 5 },
  { parameter: "rel_trg", max: 5, weight: 4 },
  { parameter: "rel_spc", max: 4, weight: 3 },
  { parameter: "rel_gen", max: 4, weight: 2 },
  { parameter: "ml", max: 6, weight: 1 },
];

interface FreeDictionaryDefinition {
  definition: string;
  synonyms?: string[];
  antonyms?: string[];
}

interface FreeDictionaryMeaning {
  partOfSpeech: string;
  definitions: FreeDictionaryDefinition[];
  synonyms?: string[];
  antonyms?: string[];
}

interface FreeDictionaryPhonetic {
  text?: string;
  audio?: string;
}

interface FreeDictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics?: FreeDictionaryPhonetic[];
  meanings?: FreeDictionaryMeaning[];
}

interface MyMemoryTranslationResponse {
  responseData?: {
    translatedText?: string;
  };
}

interface DatamuseWord {
  word?: string;
  score?: number;
}

interface RankedRelatedWord {
  term: string;
  sourceWeight: number;
  bestScore: number;
  bestPosition: number;
}

function normalizeAudioUrl(audioUrl: string | undefined) {
  if (audioUrl === undefined || audioUrl.trim().length === 0) {
    return null;
  }

  return audioUrl.startsWith("//") ? `https:${audioUrl}` : audioUrl;
}

function pickPhonetic(entries: FreeDictionaryEntry[]) {
  for (const entry of entries) {
    if (entry.phonetic?.trim()) {
      return entry.phonetic.trim();
    }

    const phonetic = entry.phonetics?.find((item) => item.text?.trim());

    if (phonetic?.text?.trim()) {
      return phonetic.text.trim();
    }
  }

  return null;
}

function isPreferredUsAudio(audioUrl: string) {
  const normalizedAudioUrl = audioUrl.toLowerCase();

  return (
    normalizedAudioUrl.includes("-us.") ||
    normalizedAudioUrl.includes("_us.") ||
    normalizedAudioUrl.includes("/us/")
  );
}

function pickAudioUrl(entries: FreeDictionaryEntry[]) {
  const audioUrls = entries.flatMap(
    (entry) =>
      entry.phonetics
        ?.map((item) => item.audio?.trim())
        .filter((audioUrl): audioUrl is string => Boolean(audioUrl)) ?? [],
  );

  const preferredAudioUrl = audioUrls.find(isPreferredUsAudio) ?? audioUrls[0];

  return normalizeAudioUrl(preferredAudioUrl);
}

function normalizeDefinitionKey(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeRelatedTerm(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isValidRelatedTerm(term: string, query: string) {
  return (
    term.length > 0 &&
    term.length <= 24 &&
    term.toLowerCase() !== query.toLowerCase() &&
    term.split(" ").length <= 2 &&
    /^[a-zA-Z][a-zA-Z' -]*$/.test(term)
  );
}

function collectUniqueRelatedTerms(terms: string[], query: string) {
  const uniqueTerms: string[] = [];
  const seenTerms = new Set<string>();

  for (const term of terms) {
    const normalizedTerm = normalizeRelatedTerm(term);
    const relatedTermKey = normalizedTerm.toLowerCase();

    if (
      !isValidRelatedTerm(normalizedTerm, query) ||
      seenTerms.has(relatedTermKey)
    ) {
      continue;
    }

    seenTerms.add(relatedTermKey);
    uniqueTerms.push(normalizedTerm);

    if (uniqueTerms.length >= maxRelatedWords) {
      break;
    }
  }

  return uniqueTerms;
}

function createDefinitionItem(
  definition: FreeDictionaryDefinition,
): DictionarySearchDefinition | null {
  const meaning = definition.definition.trim().replace(/\s+/g, " ");

  if (meaning.length === 0) {
    return null;
  }

  return {
    meaning,
    translatedMeaning: null,
  };
}

function addUniqueDefinition(
  section: DictionarySearchSection,
  seenKeys: Set<string>,
  item: DictionarySearchDefinition,
) {
  const definitionKey = normalizeDefinitionKey(item.meaning);

  if (seenKeys.has(definitionKey)) {
    return;
  }

  if (section.items.length >= maxDefinitionsPerSection) {
    return;
  }

  seenKeys.add(definitionKey);
  section.items.push(item);
}

function buildSections(entries: FreeDictionaryEntry[]) {
  const sectionMap = new Map<string, DictionarySearchSection>();
  const sectionDefinitionKeyMap = new Map<string, Set<string>>();

  for (const entry of entries) {
    for (const meaning of entry.meanings ?? []) {
      const label = meaning.partOfSpeech.trim();

      if (label.length === 0) {
        continue;
      }

      let currentSection = sectionMap.get(label);

      if (currentSection === undefined) {
        currentSection = {
          label,
          items: [],
        };
        sectionMap.set(label, currentSection);
        sectionDefinitionKeyMap.set(label, new Set());
      }

      const seenKeys = sectionDefinitionKeyMap.get(label);

      if (seenKeys === undefined) {
        continue;
      }

      for (const definition of meaning.definitions) {
        const item = createDefinitionItem(definition);

        if (item !== null) {
          addUniqueDefinition(currentSection, seenKeys, item);
        }
      }
    }
  }

  return [...sectionMap.values()].filter((section) => section.items.length > 0);
}

function buildInlineRelatedWords(
  entries: FreeDictionaryEntry[],
  query: string,
) {
  const rawSynonyms = entries.flatMap((entry) =>
    (entry.meanings ?? []).flatMap((meaning) => [
      ...(meaning.synonyms ?? []),
      ...meaning.definitions.flatMap((definition) => [
        ...(definition.synonyms ?? []),
      ]),
    ]),
  );

  const inlineSynonyms = collectUniqueRelatedTerms(rawSynonyms, query);

  if (inlineSynonyms.length >= maxRelatedWords) {
    return inlineSynonyms;
  }

  const rawAntonyms = entries.flatMap((entry) =>
    (entry.meanings ?? []).flatMap((meaning) => [
      ...(meaning.antonyms ?? []),
      ...meaning.definitions.flatMap((definition) => definition.antonyms ?? []),
    ]),
  );

  return collectUniqueRelatedTerms([...inlineSynonyms, ...rawAntonyms], query);
}

function getTranslationCacheKey(text: string) {
  return text.toLowerCase();
}

function isTranslationWorthUsing(sourceText: string, translatedText: string) {
  return (
    translatedText.length > 0 &&
    translatedText.toLowerCase() !== sourceText.toLowerCase()
  );
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  signal?: AbortSignal,
) {
  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(
    () => timeoutController.abort(),
    timeoutMs,
  );
  const abortTimeoutRequest = () => timeoutController.abort();

  signal?.addEventListener("abort", abortTimeoutRequest, { once: true });

  try {
    return await fetch(url, { signal: timeoutController.signal });
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortTimeoutRequest);
  }
}

async function translateTextToKorean(text: string, signal?: AbortSignal) {
  const normalizedText = text.trim().replace(/\s+/g, " ");
  const cacheKey = getTranslationCacheKey(normalizedText);
  const cachedTranslation = translationCache.get(cacheKey);

  if (cachedTranslation !== undefined) {
    return cachedTranslation;
  }

  if (
    normalizedText.length === 0 ||
    new TextEncoder().encode(normalizedText).length > translationByteLimit
  ) {
    translationCache.set(cacheKey, null);
    return null;
  }

  const params = new URLSearchParams({
    q: normalizedText,
    langpair: "en|ko",
  });

  try {
    const response = await fetchWithTimeout(
      `https://api.mymemory.translated.net/get?${params.toString()}`,
      translationTimeoutMs,
      signal,
    );

    if (!response.ok) {
      translationCache.set(cacheKey, null);
      return null;
    }

    const data = (await response.json()) as MyMemoryTranslationResponse;
    const translatedText = data.responseData?.translatedText?.trim() ?? "";
    const result = isTranslationWorthUsing(normalizedText, translatedText)
      ? translatedText
      : null;

    translationCache.set(cacheKey, result);
    return result;
  } catch {
    if (!signal?.aborted) {
      translationCache.set(cacheKey, null);
    }

    return null;
  }
}

async function translateSectionsToKorean(
  sections: DictionarySearchSection[],
  limit = maxTranslationRequestsPerSearch,
  signal?: AbortSignal,
) {
  await Promise.all(
    sections
      .flatMap((section) => section.items)
      .filter((item) => item.translatedMeaning === null)
      .slice(0, limit)
      .map(async (item) => {
        item.translatedMeaning = await translateTextToKorean(
          item.meaning,
          signal,
        );
      }),
  );
}

export async function hydrateDictionarySearchResultTranslations(
  result: DictionarySearchResult,
  signal?: AbortSignal,
): Promise<DictionarySearchResult> {
  const nextResult: DictionarySearchResult = {
    ...result,
    relatedWords: [...result.relatedWords],
    sections: result.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({ ...item })),
    })),
  };

  await translateSectionsToKorean(
    nextResult.sections,
    Number.POSITIVE_INFINITY,
    signal,
  );

  return nextResult;
}

async function fetchRelatedWords(query: string, signal?: AbortSignal) {
  const normalizedQuery = normalizeRelatedTerm(query);
  const cacheKey = normalizedQuery.toLowerCase();
  const cachedRelatedWords = relatedWordCache.get(cacheKey);

  if (cachedRelatedWords !== undefined) {
    return cachedRelatedWords;
  }

  try {
    const rankedWordMap = new Map<string, RankedRelatedWord>();

    await Promise.all(
      relatedWordQueryConfigs.map(async (config) => {
        try {
          const params = new URLSearchParams();
          params.set(config.parameter, normalizedQuery);
          params.set("max", String(config.max));

          const response = await fetchWithTimeout(
            `https://api.datamuse.com/words?${params.toString()}`,
            relatedWordTimeoutMs,
            signal,
          );

          if (!response.ok) {
            return;
          }

          const words = (await response.json()) as DatamuseWord[];

          words.forEach((item, index) => {
            const term = normalizeRelatedTerm(item.word ?? "");

            if (!isValidRelatedTerm(term, query)) {
              return;
            }

            const termKey = term.toLowerCase();
            const existingTerm = rankedWordMap.get(termKey);

            if (existingTerm !== undefined) {
              existingTerm.sourceWeight += config.weight;
              existingTerm.bestScore = Math.max(
                existingTerm.bestScore,
                item.score ?? 0,
              );
              existingTerm.bestPosition = Math.min(
                existingTerm.bestPosition,
                index,
              );
              return;
            }

            rankedWordMap.set(termKey, {
              term,
              sourceWeight: config.weight,
              bestScore: item.score ?? 0,
              bestPosition: index,
            });
          });
        } catch {
          return;
        }
      }),
    );

    const rankedRelatedWords = [...rankedWordMap.values()]
      .sort((left, right) => {
        if (left.sourceWeight !== right.sourceWeight) {
          return right.sourceWeight - left.sourceWeight;
        }

        if (left.bestScore !== right.bestScore) {
          return right.bestScore - left.bestScore;
        }

        if (left.bestPosition !== right.bestPosition) {
          return left.bestPosition - right.bestPosition;
        }

        if (left.term.split(" ").length !== right.term.split(" ").length) {
          return left.term.split(" ").length - right.term.split(" ").length;
        }

        return left.term.length - right.term.length;
      })
      .map((item) => item.term);

    const result = collectUniqueRelatedTerms(rankedRelatedWords, query);

    if (!signal?.aborted) {
      relatedWordCache.set(cacheKey, result);
    }

    return result;
  } catch {
    return [];
  }
}

export async function fetchDictionarySearchResult(
  query: string,
  signal?: AbortSignal,
): Promise<DictionarySearchResult | null> {
  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`,
    { signal },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("사전 API 호출에 실패했어요.");
  }

  const entries = (await response.json()) as FreeDictionaryEntry[];
  const sections = buildSections(entries);
  const inlineRelatedWords = buildInlineRelatedWords(entries, query);
  const relatedWordSeed = entries[0]?.word?.trim() || query;

  if (entries.length === 0 || sections.length === 0) {
    return null;
  }

  const relatedWordsPromise =
    inlineRelatedWords.length >= maxRelatedWords
      ? Promise.resolve<string[]>([])
      : fetchRelatedWords(relatedWordSeed, signal);

  await translateSectionsToKorean(
    sections,
    maxTranslationRequestsPerSearch,
    signal,
  );
  const relatedWords = collectUniqueRelatedTerms(
    [...inlineRelatedWords, ...(await relatedWordsPromise)],
    query,
  );

  return {
    word: entries[0]?.word?.trim() || query,
    phonetic: pickPhonetic(entries),
    audioUrl: pickAudioUrl(entries),
    sections,
    relatedWords,
  };
}
