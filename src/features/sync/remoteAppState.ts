import { getAnonymousKey } from "@apps-in-toss/web-framework";

import { APP_STORAGE_VERSION } from "../../core/state/constants";
import type { StudyEvent, ThemeMode } from "../../core/state/types";
import type { VocabularyEntry } from "../../entities/vocabulary/mockData";

const DEFAULT_APP_STATE_ENDPOINT =
  "https://vocationary.onrender.com/api/app-state";
const APP_STATE_REQUEST_TIMEOUT_MS = 10_000;

export type RemoteAppStateStatus =
  | "idle"
  | "loading"
  | "synced"
  | "local-only"
  | "error";

export interface RemoteAppState {
  storageVersion: string;
  words: VocabularyEntry[];
  searchHistory: string[];
  studyEvents: StudyEvent[];
  themeMode: ThemeMode;
}

interface RemoteAppStateResponse {
  state?: Partial<RemoteAppState>;
  source?: string;
}

function getAppStateEndpoint() {
  return (
    import.meta.env.VITE_APP_STATE_ENDPOINT?.trim() ||
    DEFAULT_APP_STATE_ENDPOINT
  );
}

function createAppStateUrl(path = "") {
  const endpoint = getAppStateEndpoint().replace(/\/+$/, "");

  return new URL(`${endpoint}${path}`, window.location.origin);
}

function createTimedSignal(timeoutMs: number) {
  const abortController = new AbortController();
  const timeoutId = window.setTimeout(() => {
    abortController.abort();
  }, timeoutMs);

  return {
    signal: abortController.signal,
    clear: () => window.clearTimeout(timeoutId),
  };
}

function normalizeRemoteThemeMode(value: unknown): ThemeMode {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : "system";
}

function normalizeRemoteStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeRemoteState(value: unknown): RemoteAppState {
  const record = typeof value === "object" && value !== null ? value : {};
  const partialState = record as Partial<RemoteAppState>;

  return {
    storageVersion:
      typeof partialState.storageVersion === "string" &&
      partialState.storageVersion.trim().length > 0
        ? partialState.storageVersion
        : APP_STORAGE_VERSION,
    words: Array.isArray(partialState.words) ? partialState.words : [],
    searchHistory: normalizeRemoteStringArray(partialState.searchHistory),
    studyEvents: Array.isArray(partialState.studyEvents)
      ? partialState.studyEvents
      : [],
    themeMode: normalizeRemoteThemeMode(partialState.themeMode),
  };
}

async function readJsonResponse(response: Response) {
  const payload = (await response.json()) as RemoteAppStateResponse;

  if (!response.ok) {
    throw new Error("Remote app state request failed");
  }

  return {
    source: payload.source ?? "remote",
    state: normalizeRemoteState(payload.state),
  };
}

export async function resolveAnonymousAppUserKey() {
  const devAnonymousKey = import.meta.env.VITE_DEV_ANONYMOUS_KEY?.trim();

  if (devAnonymousKey) {
    return devAnonymousKey;
  }

  try {
    const result = await getAnonymousKey();

    if (result && result !== "ERROR" && result.type === "HASH") {
      return result.hash;
    }
  } catch {
    return null;
  }

  return null;
}

async function sendRemoteAppStateRequest(
  path: string,
  method: "POST" | "PUT",
  body: {
    anonymousKey: string;
    localState?: RemoteAppState;
    state?: RemoteAppState;
  },
) {
  const { signal, clear } = createTimedSignal(APP_STATE_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(createAppStateUrl(path), {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal,
    });

    return await readJsonResponse(response);
  } finally {
    clear();
  }
}

export function createRemoteAppState({
  words,
  searchHistory,
  studyEvents,
  themeMode,
}: Omit<RemoteAppState, "storageVersion">): RemoteAppState {
  return {
    storageVersion: APP_STORAGE_VERSION,
    words,
    searchHistory,
    studyEvents,
    themeMode,
  };
}

export function bootstrapRemoteAppState(
  anonymousKey: string,
  state: RemoteAppState,
) {
  return sendRemoteAppStateRequest("/bootstrap", "POST", {
    anonymousKey,
    localState: state,
  });
}

export function saveRemoteAppState(
  anonymousKey: string,
  state: RemoteAppState,
) {
  return sendRemoteAppStateRequest("", "PUT", {
    anonymousKey,
    state,
  });
}
