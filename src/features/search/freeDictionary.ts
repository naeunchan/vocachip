import type {
  DictionarySearchDefinition,
  DictionarySearchResult,
  DictionarySearchSection,
} from "./types";

const defaultDictionaryEndpoint =
  "https://vocationary.onrender.com/api/dictionary/search";

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
  const dictionaryWord = pickWord(entries, query);

  if (entries.length === 0 || sections.length === 0) {
    return null;
  }

  return {
    word: dictionaryWord,
    phonetic: pickPhonetic(entries),
    audioUrl: pickAudioUrl(entries),
    sections,
    relatedWords: [],
  };
}
