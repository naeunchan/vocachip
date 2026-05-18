import type {
  DictionarySearchDefinition,
  DictionarySearchResult,
  DictionarySearchSection,
} from "./types";

const maxRelatedWords = 8;
const relatedWordTimeoutMs = 2200;
const relatedWordCache = new Map<string, string[]>();
const defaultDictionaryEndpoint =
  "https://vocationary.onrender.com/api/dictionary/search";

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

interface MerriamWebsterSound {
  audio?: string;
}

interface MerriamWebsterPronunciation {
  mw?: string;
  sound?: MerriamWebsterSound;
}

interface MerriamWebsterHeadword {
  hw?: string;
  prs?: MerriamWebsterPronunciation[];
}

interface MerriamWebsterMeta {
  id?: string;
  stems?: string[];
}

interface MerriamWebsterEntry {
  meta?: MerriamWebsterMeta;
  hwi?: MerriamWebsterHeadword;
  fl?: string;
  shortdef?: string[];
  def?: unknown[];
}

type MerriamWebsterResponseItem = MerriamWebsterEntry | string;

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

function getDictionaryEndpoint() {
  return (
    import.meta.env.VITE_DICTIONARY_ENDPOINT?.trim() ||
    defaultDictionaryEndpoint
  );
}

function createDictionaryEndpointUrl() {
  return new URL(getDictionaryEndpoint(), window.location.origin);
}

function isMerriamWebsterEntry(
  item: MerriamWebsterResponseItem,
): item is MerriamWebsterEntry {
  return typeof item === "object" && item !== null;
}

function cleanMerriamWebsterText(value: string) {
  return value
    .replace(/\*/g, "")
    .replace(/\{bc\}/g, ": ")
    .replace(/\{(?:[^{}|]+)\|([^{}|]+)(?:\|[^{}]*)*\}/g, "$1")
    .replace(/\{\/?[a-z_]+\}/gi, "")
    .replace(/\{[^{}]*\}/g, "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHeadword(value: string | undefined) {
  if (value === undefined) {
    return "";
  }

  return cleanMerriamWebsterText(value).replace(/:\d+$/, "").trim();
}

function pickWord(entries: MerriamWebsterEntry[], query: string) {
  for (const entry of entries) {
    const headword = normalizeHeadword(entry.hwi?.hw);

    if (headword.length > 0) {
      return headword;
    }

    const entryId = normalizeHeadword(entry.meta?.id);

    if (entryId.length > 0) {
      return entryId;
    }
  }

  return query;
}

function pickPhonetic(entries: MerriamWebsterEntry[]) {
  for (const entry of entries) {
    const pronunciation = entry.hwi?.prs?.find((item) => item.mw?.trim());
    const writtenPronunciation = pronunciation?.mw?.trim();

    if (writtenPronunciation) {
      return `/${writtenPronunciation}/`;
    }
  }

  return null;
}

function getAudioSubdirectory(audioName: string) {
  const normalizedAudioName = audioName.toLowerCase();

  if (normalizedAudioName.startsWith("bix")) {
    return "bix";
  }

  if (normalizedAudioName.startsWith("gg")) {
    return "gg";
  }

  if (!/^[a-z]/.test(normalizedAudioName)) {
    return "number";
  }

  return normalizedAudioName[0] ?? "";
}

function createAudioUrl(audioName: string | undefined) {
  const normalizedAudioName = audioName?.trim();

  if (!normalizedAudioName) {
    return null;
  }

  const audioSubdirectory = getAudioSubdirectory(normalizedAudioName);

  return `https://media.merriam-webster.com/audio/prons/en/us/mp3/${audioSubdirectory}/${normalizedAudioName}.mp3`;
}

function pickAudioUrl(entries: MerriamWebsterEntry[]) {
  for (const entry of entries) {
    for (const pronunciation of entry.hwi?.prs ?? []) {
      const audioUrl = createAudioUrl(pronunciation.sound?.audio);

      if (audioUrl !== null) {
        return audioUrl;
      }
    }
  }

  return null;
}

function normalizeDefinitionKey(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeRelatedTerm(value: string) {
  return cleanMerriamWebsterText(value).trim().replace(/\s+/g, " ");
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
  definition: string,
): DictionarySearchDefinition | null {
  const meaning = cleanMerriamWebsterText(definition);

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

  seenKeys.add(definitionKey);
  section.items.push(item);
}

function collectDefinitionTextValues(value: unknown, definitions: string[]) {
  if (typeof value === "string") {
    return;
  }

  if (Array.isArray(value)) {
    if (value[0] === "text" && typeof value[1] === "string") {
      definitions.push(value[1]);
      return;
    }

    value.forEach((item) => collectDefinitionTextValues(item, definitions));
    return;
  }

  if (typeof value === "object" && value !== null) {
    Object.values(value).forEach((item) =>
      collectDefinitionTextValues(item, definitions),
    );
  }
}

function getDefinitions(entry: MerriamWebsterEntry) {
  const shortDefinitions = entry.shortdef ?? [];

  if (shortDefinitions.length > 0) {
    return shortDefinitions;
  }

  const definitions: string[] = [];

  collectDefinitionTextValues(entry.def, definitions);

  return definitions;
}

function buildSections(entries: MerriamWebsterEntry[]) {
  const sectionMap = new Map<string, DictionarySearchSection>();
  const sectionDefinitionKeyMap = new Map<string, Set<string>>();

  for (const entry of entries) {
    const label = cleanMerriamWebsterText(entry.fl ?? "definition");

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

    for (const definition of getDefinitions(entry)) {
      const item = createDefinitionItem(definition);

      if (item !== null) {
        addUniqueDefinition(currentSection, seenKeys, item);
      }
    }
  }

  return [...sectionMap.values()].filter((section) => section.items.length > 0);
}

function buildInlineRelatedWords(
  entries: MerriamWebsterEntry[],
  query: string,
) {
  return collectUniqueRelatedTerms(
    entries.flatMap((entry) => entry.meta?.stems ?? []),
    query,
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

function haveSameRelatedWords(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((term, index) => term === right[index])
  );
}

export async function fetchDictionaryRelatedWords(
  result: DictionarySearchResult,
  signal?: AbortSignal,
) {
  if (result.relatedWords.length >= maxRelatedWords) {
    return result;
  }

  const relatedWords = collectUniqueRelatedTerms(
    [...result.relatedWords, ...(await fetchRelatedWords(result.word, signal))],
    result.word,
  );

  if (haveSameRelatedWords(result.relatedWords, relatedWords)) {
    return result;
  }

  return {
    ...result,
    relatedWords,
  };
}

export async function fetchDictionarySearchResult(
  query: string,
  signal?: AbortSignal,
): Promise<DictionarySearchResult | null> {
  const endpointUrl = createDictionaryEndpointUrl();

  endpointUrl.searchParams.set("word", query);

  const response = await fetch(endpointUrl.toString(), { signal });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("사전 API 호출에 실패했어요.");
  }

  const payload = (await response.json()) as MerriamWebsterResponseItem[];
  const entries = Array.isArray(payload)
    ? payload.filter(isMerriamWebsterEntry)
    : [];
  const sections = buildSections(entries);
  const inlineRelatedWords = buildInlineRelatedWords(entries, query);
  const dictionaryWord = pickWord(entries, query);

  if (entries.length === 0 || sections.length === 0) {
    return null;
  }

  return {
    word: dictionaryWord,
    phonetic: pickPhonetic(entries),
    audioUrl: pickAudioUrl(entries),
    sections,
    relatedWords: inlineRelatedWords,
  };
}
