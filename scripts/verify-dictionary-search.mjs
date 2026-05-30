const DEFAULT_ENDPOINT = "http://127.0.0.1:8787/api/dictionary/search";
const SEARCH_WORDS = ["take", "taking", "today", "glass", "core", "good"];
const REQUEST_TIMEOUT_MS = 12000;

function getDictionaryEndpoint() {
  return (
    process.env.DICTIONARY_TEST_ENDPOINT?.trim() ||
    process.env.VITE_DICTIONARY_ENDPOINT?.trim() ||
    DEFAULT_ENDPOINT
  );
}

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
}

function assertDictionarySearchResult(payload, query) {
  if (typeof payload !== "object" || payload === null) {
    throw new Error(`${query}: response is not an object`);
  }

  if (typeof payload.word !== "string" || payload.word.trim().length === 0) {
    throw new Error(`${query}: missing word`);
  }

  if (!Array.isArray(payload.sections) || payload.sections.length === 0) {
    throw new Error(`${query}: missing sections`);
  }

  for (const section of payload.sections) {
    if (typeof section?.label !== "string" || section.label.length === 0) {
      throw new Error(`${query}: invalid section label`);
    }

    if (!Array.isArray(section.items) || section.items.length === 0) {
      throw new Error(`${query}: section has no items`);
    }

    for (const item of section.items) {
      if (typeof item?.meaning !== "string" || item.meaning.length === 0) {
        throw new Error(`${query}: invalid definition meaning`);
      }
    }
  }
}

async function verifySearchWord(endpoint, word) {
  const url = new URL(endpoint);
  const requestSignal = createTimeoutSignal(REQUEST_TIMEOUT_MS);

  url.searchParams.set("word", word);
  url.searchParams.set("limit", "4");

  try {
    const response = await fetch(url, { signal: requestSignal.signal });

    if (!response.ok) {
      throw new Error(`${word}: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();

    assertDictionarySearchResult(payload, word);

    return {
      word,
      dictionaryWord: payload.word,
      sectionCount: payload.sections.length,
      definitionCount: payload.sections.reduce(
        (count, section) => count + section.items.length,
        0,
      ),
    };
  } finally {
    requestSignal.cleanup();
  }
}

async function main() {
  const endpoint = getDictionaryEndpoint();
  const results = [];

  for (const word of SEARCH_WORDS) {
    results.push(await verifySearchWord(endpoint, word));
  }

  console.log(JSON.stringify({ endpoint, results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
