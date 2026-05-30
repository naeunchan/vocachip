function isMerriamWebsterEntry(item) {
  return typeof item === "object" && item !== null;
}

function getRecord(value) {
  return typeof value === "object" && value !== null ? value : null;
}

function getStringField(value, key) {
  const record = getRecord(value);
  const fieldValue = record?.[key];

  return typeof fieldValue === "string" ? fieldValue : null;
}

function cleanMerriamWebsterText(value) {
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

function cleanDefinitionText(value) {
  return cleanMerriamWebsterText(value)
    .replace(/^:\s*/, "")
    .replace(/\s*\((?:such as|for example|e\.g\.)[^)]*\)/gi, "")
    .replace(/(?:\s*:\s*|\s+)such as$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHeadword(value) {
  if (value === undefined) {
    return "";
  }

  return cleanMerriamWebsterText(value).replace(/:\d+$/, "").trim();
}

function pickWord(entries, query) {
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

function pickPhonetic(entries) {
  for (const entry of entries) {
    const pronunciation = entry.hwi?.prs?.find((item) => item.mw?.trim());
    const writtenPronunciation = pronunciation?.mw?.trim();

    if (writtenPronunciation) {
      return `/${writtenPronunciation}/`;
    }
  }

  return null;
}

function getAudioSubdirectory(audioName) {
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

function createAudioUrl(audioName) {
  const normalizedAudioName = audioName?.trim();

  if (!normalizedAudioName) {
    return null;
  }

  const audioSubdirectory = getAudioSubdirectory(normalizedAudioName);

  return `https://media.merriam-webster.com/audio/prons/en/us/mp3/${audioSubdirectory}/${normalizedAudioName}.mp3`;
}

function pickAudioUrl(entries) {
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

function normalizeDefinitionKey(value) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function createDefinitionDetail(value) {
  const meaning = cleanDefinitionText(value);

  if (meaning.length === 0) {
    return null;
  }

  return {
    meaning,
    examples: [],
    notes: [],
  };
}

function getTopSenseNumber(value) {
  return value?.trim().match(/^(\d+)/)?.[1] ?? null;
}

function isNestedSenseNumber(value) {
  return /^\([^)]+\)/.test(value?.trim() ?? "");
}

function getOrCreateDefinitionGroup(groups, senseNumber) {
  const existingGroup = groups.find(
    (group) => group.senseNumber === senseNumber,
  );

  if (existingGroup !== undefined) {
    return existingGroup;
  }

  const nextGroup = {
    senseNumber,
    definitions: [],
    seenDefinitionKeys: new Set(),
  };

  groups.push(nextGroup);

  return nextGroup;
}

function countDefinitionGroups(groups) {
  return groups.filter((group) => group.definitions.length > 0).length;
}

function hasDefinitionGroup(groups, senseNumber) {
  return groups.some((group) => group.senseNumber === senseNumber);
}

function shouldStopBeforeDefinitionGroup(
  groups,
  senseNumber,
  maxDefinitionCount,
) {
  return (
    maxDefinitionCount !== undefined &&
    !hasDefinitionGroup(groups, senseNumber) &&
    countDefinitionGroups(groups) >= maxDefinitionCount
  );
}

function addUniqueCleanText(values, value) {
  const normalizedValue = cleanDefinitionText(value);

  if (normalizedValue.length === 0) {
    return;
  }

  const valueKey = normalizeDefinitionKey(normalizedValue);

  if (values.some((item) => normalizeDefinitionKey(item) === valueKey)) {
    return;
  }

  values.push(normalizedValue);
}

function appendExamplesToList(currentExamples, examples) {
  for (const example of examples) {
    if (
      currentExamples.some(
        (item) =>
          normalizeDefinitionKey(item.text) ===
          normalizeDefinitionKey(example.text),
      )
    ) {
      continue;
    }

    currentExamples.push(example);
  }
}

function appendExamples(definition, examples) {
  appendExamplesToList(definition.examples, examples);
}

function normalizeNestedMeaning(definition) {
  const normalizedDefinition = createDefinitionDetail(definition.meaning);

  if (normalizedDefinition === null) {
    return null;
  }

  for (const example of definition.examples) {
    appendExamples(normalizedDefinition, [
      {
        text: example.text,
        source: example.source,
      },
    ]);
  }

  for (const note of definition.notes) {
    addUniqueCleanText(normalizedDefinition.notes, note);
  }

  return {
    meaning: normalizedDefinition.meaning,
    examples: normalizedDefinition.examples,
    notes: normalizedDefinition.notes,
  };
}

function appendNestedMeaning(definition, nestedMeaning) {
  const normalizedNestedMeaning = normalizeNestedMeaning(nestedMeaning);

  if (normalizedNestedMeaning === null) {
    return;
  }

  const nestedMeaningKey = normalizeDefinitionKey(
    normalizedNestedMeaning.meaning,
  );
  const currentNestedMeanings = definition.nestedMeanings ?? [];

  if (
    currentNestedMeanings.some(
      (item) => normalizeDefinitionKey(item.meaning) === nestedMeaningKey,
    )
  ) {
    return;
  }

  definition.nestedMeanings = [
    ...currentNestedMeanings,
    normalizedNestedMeaning,
  ];
}

function normalizeDefinitionDetail(definition) {
  const normalizedDefinition = createDefinitionDetail(definition.meaning);

  if (normalizedDefinition === null) {
    return null;
  }

  for (const example of definition.examples) {
    const text = cleanDefinitionText(example.text);

    if (text.length === 0) {
      continue;
    }

    const source = example.source?.trim()
      ? cleanMerriamWebsterText(example.source)
      : null;

    if (
      normalizedDefinition.examples.some(
        (item) =>
          normalizeDefinitionKey(item.text) === normalizeDefinitionKey(text),
      )
    ) {
      continue;
    }

    normalizedDefinition.examples.push({
      text,
      source: source === "" ? null : source,
    });
  }

  for (const note of definition.notes) {
    addUniqueCleanText(normalizedDefinition.notes, note);
  }

  for (const nestedMeaning of definition.nestedMeanings ?? []) {
    appendNestedMeaning(normalizedDefinition, nestedMeaning);
  }

  return normalizedDefinition;
}

function addDefinitionToGroup(group, definition, options = {}) {
  const normalizedDefinition = normalizeDefinitionDetail(definition);

  if (normalizedDefinition === null) {
    return;
  }

  if (
    options.nestUnderPreviousDefinition === true &&
    group.definitions.length > 0
  ) {
    appendNestedMeaning(group.definitions[group.definitions.length - 1], {
      meaning: normalizedDefinition.meaning,
      examples: normalizedDefinition.examples,
      notes: normalizedDefinition.notes,
    });
    return;
  }

  const definitionKey = normalizeDefinitionKey(normalizedDefinition.meaning);

  if (definitionKey === "such as") {
    const previousDefinition = group.definitions.at(-1);

    if (previousDefinition !== undefined) {
      addUniqueCleanText(previousDefinition.notes, normalizedDefinition.meaning);
    }

    return;
  }

  if (group.seenDefinitionKeys.has(definitionKey)) {
    return;
  }

  group.seenDefinitionKeys.add(definitionKey);
  group.definitions.push(normalizedDefinition);
}

function createExampleSource(value) {
  const attribution = getRecord(value);

  if (attribution === null) {
    return null;
  }

  const sourceParts = ["auth", "source", "subsource"]
    .map((key) => getStringField(attribution, key))
    .filter((item) => item !== null)
    .map((item) => cleanMerriamWebsterText(item))
    .filter((item) => item.length > 0);

  return sourceParts.length > 0 ? sourceParts.join(", ") : null;
}

function collectExamplesFromVis(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const example = getRecord(item);
    const text = getStringField(example, "t");

    if (text === null) {
      return [];
    }

    const normalizedText = cleanDefinitionText(text);

    if (normalizedText.length === 0) {
      return [];
    }

    return [
      {
        text: normalizedText,
        source: createExampleSource(example?.aq),
      },
    ];
  });
}

function collectUsageNoteContent(value, content) {
  if (!Array.isArray(value)) {
    return;
  }

  for (const item of value) {
    if (!Array.isArray(item)) {
      continue;
    }

    if (item[0] === "text" && typeof item[1] === "string") {
      addUniqueCleanText(content.notes, item[1]);
      continue;
    }

    if (item[0] === "vis") {
      appendExamplesToList(content.examples, collectExamplesFromVis(item[1]));
      continue;
    }

    collectUsageNoteContent(item, content);
  }
}

function collectDefinitionDetailsFromDt(value) {
  const definitions = [];

  if (!Array.isArray(value)) {
    return definitions;
  }

  let currentDefinition = null;

  for (const item of value) {
    if (!Array.isArray(item)) {
      continue;
    }

    if (item[0] === "text" && typeof item[1] === "string") {
      const definition = createDefinitionDetail(item[1]);

      if (definition !== null) {
        definitions.push(definition);
        currentDefinition = definition;
      }

      continue;
    }

    if (item[0] === "vis" && currentDefinition !== null) {
      appendExamples(currentDefinition, collectExamplesFromVis(item[1]));
      continue;
    }

    if (item[0] === "uns" && currentDefinition !== null) {
      collectUsageNoteContent(item[1], currentDefinition);
    }
  }

  return definitions;
}

function collectSenseDefinitionDetails(sense) {
  const definitions = [];
  const sdsense = getRecord(sense.sdsense);
  const supplementalLabel = getStringField(sdsense, "sd");

  definitions.push(...collectDefinitionDetailsFromDt(sense.dt));

  if (sdsense !== null) {
    const normalizedSupplementalLabel =
      supplementalLabel === null ? null : cleanDefinitionText(supplementalLabel);
    const supplementalDefinitions = collectDefinitionDetailsFromDt(sdsense.dt);

    if (
      normalizedSupplementalLabel === "also" &&
      definitions.length > 0 &&
      supplementalDefinitions.length > 0
    ) {
      const targetDefinition = definitions[definitions.length - 1];

      for (const definition of supplementalDefinitions) {
        addUniqueCleanText(
          targetDefinition.notes,
          `${normalizedSupplementalLabel}: ${definition.meaning}`,
        );
        appendExamples(targetDefinition, definition.examples);

        for (const note of definition.notes) {
          addUniqueCleanText(targetDefinition.notes, note);
        }

        for (const nestedMeaning of definition.nestedMeanings ?? []) {
          appendNestedMeaning(targetDefinition, nestedMeaning);
        }
      }

      return definitions;
    }

    for (const definition of supplementalDefinitions) {
      definitions.push({
        ...definition,
        meaning:
          normalizedSupplementalLabel === null ||
          normalizedSupplementalLabel.length === 0
            ? definition.meaning
            : `${normalizedSupplementalLabel}: ${definition.meaning}`,
      });
    }
  }

  return definitions;
}

function addSenseDefinitions(
  groups,
  sense,
  activeSenseNumber,
  maxDefinitionCount,
) {
  const senseRecord = getRecord(sense);

  if (senseRecord === null) {
    return {
      activeSenseNumber,
      isLimitReached: false,
    };
  }

  const senseNumber = getStringField(senseRecord, "sn");
  const explicitSenseNumber = getTopSenseNumber(senseNumber);
  const nextSenseNumber = explicitSenseNumber ?? activeSenseNumber;
  const shouldNestUnderPreviousDefinition =
    explicitSenseNumber === null && isNestedSenseNumber(senseNumber);

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

  for (const definition of collectSenseDefinitionDetails(senseRecord)) {
    addDefinitionToGroup(group, definition, {
      nestUnderPreviousDefinition: shouldNestUnderPreviousDefinition,
    });
  }

  return {
    activeSenseNumber: nextSenseNumber,
    isLimitReached: false,
  };
}

function collectDefinitionGroupsFromSseq(
  value,
  groups,
  activeSenseNumber,
  maxDefinitionCount,
) {
  if (!Array.isArray(value)) {
    return activeSenseNumber;
  }

  let currentSenseNumber = activeSenseNumber;
  let pendingSenseNumber = null;

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

function getDetailedDefinitions(entry, maxDefinitionCount) {
  const groups = [];

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

function createDefinitionItem(definition) {
  const subMeaningDetails = (Array.isArray(definition) ? definition : [definition])
    .map((item) => normalizeDefinitionDetail(item))
    .filter((item) => item !== null);
  const subMeanings = subMeaningDetails.map((item) => item.meaning);
  const meaning = subMeanings.join("; ");

  if (meaning.length === 0) {
    return null;
  }

  return {
    meaning,
    translatedMeaning: null,
    translatedSubMeanings: subMeanings.map(() => null),
    subMeanings,
    subMeaningDetails,
  };
}

function addUniqueDefinition(section, seenKeys, item) {
  const definitionKey = normalizeDefinitionKey(item.meaning);

  if (seenKeys.has(definitionKey)) {
    return false;
  }

  seenKeys.add(definitionKey);
  section.items.push(item);
  return true;
}

function collectDefinitionTextValues(value, definitions) {
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

function getDefinitions(entry, maxDefinitionCount) {
  const detailedDefinitions = getDetailedDefinitions(entry, maxDefinitionCount);

  if (detailedDefinitions.length > 0) {
    return detailedDefinitions;
  }

  const shortDefinitions = (entry.shortdef ?? [])
    .slice(0, maxDefinitionCount)
    .map((definition) => createDefinitionDetail(definition))
    .filter((definition) => definition !== null);

  if (shortDefinitions.length > 0) {
    return shortDefinitions;
  }

  const definitions = [];

  collectDefinitionTextValues(entry.def, definitions);

  return definitions
    .slice(0, maxDefinitionCount)
    .map((definition) => createDefinitionDetail(definition))
    .filter((definition) => definition !== null);
}

function buildSections(entries, maxDefinitionCount) {
  const sectionMap = new Map();
  const sectionDefinitionKeyMap = new Map();
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

export function parseMerriamWebsterSearchResult(
  payload,
  query,
  maxDefinitionCount,
) {
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
