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

interface DefinitionGroup {
  senseNumber: string;
  definitions: string[];
  seenDefinitionKeys: Set<string>;
}

interface BuildSectionsResult {
  sections: DictionarySearchSection[];
  hasMoreDefinitions: boolean;
}

type DefinitionCandidate = string | string[];

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

function getRecord(value: unknown) {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function getStringField(value: unknown, key: string) {
  const record = getRecord(value);
  const fieldValue = record?.[key];

  return typeof fieldValue === "string" ? fieldValue : null;
}

function cleanDefinitionText(value: string) {
  return cleanMerriamWebsterText(value)
    .replace(/^:\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getTopSenseNumber(value: string | null) {
  return value?.match(/\d+/)?.[0] ?? null;
}

function getOrCreateDefinitionGroup(
  groups: DefinitionGroup[],
  senseNumber: string,
) {
  const existingGroup = groups.find(
    (group) => group.senseNumber === senseNumber,
  );

  if (existingGroup !== undefined) {
    return existingGroup;
  }

  const nextGroup: DefinitionGroup = {
    senseNumber,
    definitions: [],
    seenDefinitionKeys: new Set(),
  };

  groups.push(nextGroup);

  return nextGroup;
}

function countDefinitionGroups(groups: DefinitionGroup[]) {
  return groups.filter((group) => group.definitions.length > 0).length;
}

function hasDefinitionGroup(groups: DefinitionGroup[], senseNumber: string) {
  return groups.some((group) => group.senseNumber === senseNumber);
}

function shouldStopBeforeDefinitionGroup(
  groups: DefinitionGroup[],
  senseNumber: string,
  maxDefinitionCount?: number,
) {
  return (
    maxDefinitionCount !== undefined &&
    !hasDefinitionGroup(groups, senseNumber) &&
    countDefinitionGroups(groups) >= maxDefinitionCount
  );
}

function addDefinitionToGroup(group: DefinitionGroup, definition: string) {
  const normalizedDefinition = cleanDefinitionText(definition);

  if (normalizedDefinition.length === 0) {
    return;
  }

  const definitionKey = normalizeDefinitionKey(normalizedDefinition);

  if (group.seenDefinitionKeys.has(definitionKey)) {
    return;
  }

  group.seenDefinitionKeys.add(definitionKey);
  group.definitions.push(normalizedDefinition);
}

function collectDefinitionTextsFromDt(value: unknown, definitions: string[]) {
  if (!Array.isArray(value)) {
    return;
  }

  for (const item of value) {
    if (
      Array.isArray(item) &&
      item[0] === "text" &&
      typeof item[1] === "string"
    ) {
      definitions.push(item[1]);
    }
  }
}

function collectSenseDefinitionTexts(sense: Record<string, unknown>) {
  const definitions: string[] = [];
  const sdsense = getRecord(sense.sdsense);
  const supplementalLabel = getStringField(sdsense, "sd");

  collectDefinitionTextsFromDt(sense.dt, definitions);

  if (sdsense !== null) {
    const supplementalDefinitions: string[] = [];

    collectDefinitionTextsFromDt(sdsense.dt, supplementalDefinitions);

    for (const definition of supplementalDefinitions) {
      definitions.push(
        supplementalLabel === null
          ? definition
          : `${supplementalLabel}: ${definition}`,
      );
    }
  }

  return definitions;
}

function addSenseDefinitions(
  groups: DefinitionGroup[],
  sense: unknown,
  activeSenseNumber: string | null,
  maxDefinitionCount?: number,
) {
  const senseRecord = getRecord(sense);

  if (senseRecord === null) {
    return {
      activeSenseNumber,
      isLimitReached: false,
    };
  }

  const explicitSenseNumber = getTopSenseNumber(getStringField(sense, "sn"));
  const nextSenseNumber = explicitSenseNumber ?? activeSenseNumber;

  if (nextSenseNumber === null) {
    return {
      activeSenseNumber,
      isLimitReached: false,
    };
  }

  if (
    shouldStopBeforeDefinitionGroup(groups, nextSenseNumber, maxDefinitionCount)
  ) {
    return {
      activeSenseNumber: nextSenseNumber,
      isLimitReached: true,
    };
  }

  const group = getOrCreateDefinitionGroup(groups, nextSenseNumber);

  for (const definition of collectSenseDefinitionTexts(senseRecord)) {
    addDefinitionToGroup(group, definition);
  }

  return {
    activeSenseNumber: nextSenseNumber,
    isLimitReached: false,
  };
}

function collectDefinitionGroupsFromSseq(
  value: unknown,
  groups: DefinitionGroup[],
  activeSenseNumber: string | null,
  maxDefinitionCount?: number,
) {
  if (!Array.isArray(value)) {
    return activeSenseNumber;
  }

  let currentSenseNumber = activeSenseNumber;
  let pendingSenseNumber: string | null = null;

  for (const item of value) {
    if (!Array.isArray(item)) {
      continue;
    }

    const [type, payload] = item;

    if (type === "sen") {
      pendingSenseNumber = getTopSenseNumber(getStringField(payload, "sn"));
      currentSenseNumber = pendingSenseNumber ?? currentSenseNumber;
      continue;
    }

    if (type === "sense") {
      const result = addSenseDefinitions(
        groups,
        payload,
        pendingSenseNumber ?? currentSenseNumber,
        maxDefinitionCount,
      );

      currentSenseNumber = result.activeSenseNumber;
      pendingSenseNumber = null;

      if (result.isLimitReached) {
        return currentSenseNumber;
      }

      continue;
    }

    if (type === "bs") {
      const result = addSenseDefinitions(
        groups,
        getRecord(payload)?.sense,
        pendingSenseNumber ?? currentSenseNumber,
        maxDefinitionCount,
      );

      currentSenseNumber = result.activeSenseNumber;
      pendingSenseNumber = null;

      if (result.isLimitReached) {
        return currentSenseNumber;
      }

      continue;
    }

    if (type === "pseq") {
      currentSenseNumber = collectDefinitionGroupsFromSseq(
        payload,
        groups,
        pendingSenseNumber ?? currentSenseNumber,
        maxDefinitionCount,
      );
      pendingSenseNumber = null;

      if (countDefinitionGroups(groups) >= (maxDefinitionCount ?? Infinity)) {
        return currentSenseNumber;
      }

      continue;
    }

    currentSenseNumber = collectDefinitionGroupsFromSseq(
      item,
      groups,
      pendingSenseNumber ?? currentSenseNumber,
      maxDefinitionCount,
    );
    pendingSenseNumber = null;

    if (countDefinitionGroups(groups) >= (maxDefinitionCount ?? Infinity)) {
      return currentSenseNumber;
    }
  }

  return currentSenseNumber;
}

function getDetailedDefinitions(
  entry: MerriamWebsterEntry,
  maxDefinitionCount?: number,
) {
  const groups: DefinitionGroup[] = [];

  for (const definitionBlock of entry.def ?? []) {
    const sseq = getRecord(definitionBlock)?.sseq;

    collectDefinitionGroupsFromSseq(sseq, groups, null, maxDefinitionCount);

    if (countDefinitionGroups(groups) >= (maxDefinitionCount ?? Infinity)) {
      break;
    }
  }

  return groups
    .map((group) => group.definitions)
    .filter((definitions) => definitions.length > 0);
}

function createDefinitionItem(
  definition: DefinitionCandidate,
): DictionarySearchDefinition | null {
  const subMeanings = (Array.isArray(definition) ? definition : [definition])
    .map((item) => cleanDefinitionText(item))
    .filter((item) => item.length > 0);
  const meaning = subMeanings.join("; ");

  if (meaning.length === 0) {
    return null;
  }

  return {
    meaning,
    translatedMeaning: null,
    subMeanings,
  };
}

function addUniqueDefinition(
  section: DictionarySearchSection,
  seenKeys: Set<string>,
  item: DictionarySearchDefinition,
) {
  const definitionKey = normalizeDefinitionKey(item.meaning);

  if (seenKeys.has(definitionKey)) {
    return false;
  }

  seenKeys.add(definitionKey);
  section.items.push(item);
  return true;
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

function getDefinitions(
  entry: MerriamWebsterEntry,
  maxDefinitionCount?: number,
): DefinitionCandidate[] {
  const detailedDefinitions = getDetailedDefinitions(entry, maxDefinitionCount);

  if (detailedDefinitions.length > 0) {
    return detailedDefinitions;
  }

  const shortDefinitions = (entry.shortdef ?? []).slice(0, maxDefinitionCount);

  if (shortDefinitions.length > 0) {
    return shortDefinitions;
  }

  const definitions: string[] = [];

  collectDefinitionTextValues(entry.def, definitions);

  return definitions.slice(0, maxDefinitionCount);
}

function buildSections(
  entries: MerriamWebsterEntry[],
  maxDefinitionCount?: number,
): BuildSectionsResult {
  const sectionMap = new Map<string, DictionarySearchSection>();
  const sectionDefinitionKeyMap = new Map<string, Set<string>>();
  let definitionCount = 0;
  let hasMoreDefinitions = false;

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

    const remainingDefinitionCount =
      maxDefinitionCount === undefined
        ? undefined
        : Math.max(0, maxDefinitionCount - definitionCount) + 1;

    for (const definition of getDefinitions(entry, remainingDefinitionCount)) {
      const item = createDefinitionItem(definition);

      if (item !== null) {
        if (
          maxDefinitionCount !== undefined &&
          definitionCount >= maxDefinitionCount
        ) {
          hasMoreDefinitions = true;
          break;
        }

        if (addUniqueDefinition(currentSection, seenKeys, item)) {
          definitionCount += 1;
        }
      }
    }

    if (hasMoreDefinitions) {
      break;
    }
  }

  return {
    sections: [...sectionMap.values()].filter(
      (section) => section.items.length > 0,
    ),
    hasMoreDefinitions,
  };
}

export async function fetchDictionarySearchResult(
  query: string,
  signal?: AbortSignal,
  maxDefinitionCount?: number,
): Promise<DictionarySearchResult | null> {
  const endpointUrl = createDictionaryEndpointUrl();

  endpointUrl.searchParams.set("word", query);

  if (maxDefinitionCount !== undefined) {
    endpointUrl.searchParams.set("limit", String(maxDefinitionCount));
  }

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
  const { sections, hasMoreDefinitions } = buildSections(
    entries,
    maxDefinitionCount,
  );
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
    hasMoreDefinitions,
  };
}
