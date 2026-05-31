import { createHash, randomUUID } from "node:crypto";

import pg from "pg";

const { Pool } = pg;

const maxWords = 1000;
const maxSearchHistory = 20;
const maxStudyEvents = 1000;
const defaultStorageVersion = "unknown";
const validThemeModes = new Set(["system", "light", "dark"]);

let pool = null;
let initializationPromise = null;

function getDatabaseUrl() {
  return process.env.DATABASE_URL?.trim() ?? "";
}

function shouldUseSsl() {
  const configuredValue = process.env.DATABASE_SSL?.trim().toLowerCase();

  if (configuredValue === "false" || configuredValue === "0") {
    return false;
  }

  return process.env.RENDER === "true" || configuredValue === "true";
}

function getPool() {
  if (pool !== null) {
    return pool;
  }

  const connectionString = getDatabaseUrl();

  if (connectionString.length === 0) {
    return null;
  }

  pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
    ssl: shouldUseSsl() ? { rejectUnauthorized: false } : undefined,
  });

  return pool;
}

export function isAppStateDatabaseConfigured() {
  return getDatabaseUrl().length > 0;
}

export async function initializeAppStateDatabase() {
  const databasePool = getPool();

  if (databasePool === null) {
    throw createAppStateError("App state database is not configured", 503);
  }

  if (initializationPromise !== null) {
    return initializationPromise;
  }

  initializationPromise = databasePool.query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id uuid PRIMARY KEY,
      anonymous_key_hash text NOT NULL UNIQUE,
      created_at timestamptz NOT NULL DEFAULT now(),
      last_seen_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS app_state (
      user_id uuid PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
      storage_version text NOT NULL,
      words jsonb NOT NULL DEFAULT '[]'::jsonb,
      search_history jsonb NOT NULL DEFAULT '[]'::jsonb,
      study_events jsonb NOT NULL DEFAULT '[]'::jsonb,
      theme_mode text NOT NULL DEFAULT 'system',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  try {
    await initializationPromise;
  } catch (error) {
    initializationPromise = null;
    throw error;
  }
}

function createAppStateError(message, statusCode) {
  const error = new Error(message);

  error.statusCode = statusCode;
  return error;
}

function assertAnonymousKey(anonymousKey) {
  if (
    typeof anonymousKey !== "string" ||
    anonymousKey.trim().length < 8 ||
    anonymousKey.trim().length > 512
  ) {
    throw createAppStateError("anonymousKey is invalid", 400);
  }

  return anonymousKey.trim();
}

function hashAnonymousKey(anonymousKey) {
  const secret = process.env.APP_USER_KEY_HASH_SECRET?.trim() ?? "";

  return createHash("sha256")
    .update(`${secret}:${anonymousKey}`)
    .digest("hex");
}

function normalizeJsonArray(value, limit) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, limit);
}

function normalizeSearchHistory(value) {
  return normalizeJsonArray(value, maxSearchHistory)
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, maxSearchHistory);
}

function normalizeThemeMode(value) {
  return typeof value === "string" && validThemeModes.has(value)
    ? value
    : "system";
}

export function normalizeAppStatePayload(value) {
  const record = typeof value === "object" && value !== null ? value : {};
  const storageVersion =
    typeof record.storageVersion === "string" &&
    record.storageVersion.trim().length > 0
      ? record.storageVersion.trim().slice(0, 120)
      : defaultStorageVersion;

  return {
    storageVersion,
    words: normalizeJsonArray(record.words, maxWords),
    searchHistory: normalizeSearchHistory(record.searchHistory),
    studyEvents: normalizeJsonArray(record.studyEvents, maxStudyEvents),
    themeMode: normalizeThemeMode(record.themeMode),
  };
}

function deserializeAppState(row) {
  if (row === null || row === undefined) {
    return null;
  }

  return normalizeAppStatePayload({
    storageVersion: row.storage_version,
    words: row.words,
    searchHistory: row.search_history,
    studyEvents: row.study_events,
    themeMode: row.theme_mode,
  });
}

async function getOrCreateUserId(anonymousKey) {
  await initializeAppStateDatabase();

  const databasePool = getPool();
  const anonymousKeyHash = hashAnonymousKey(assertAnonymousKey(anonymousKey));
  const userId = randomUUID();
  const result = await databasePool.query(
    `
      INSERT INTO app_users (id, anonymous_key_hash)
      VALUES ($1, $2)
      ON CONFLICT (anonymous_key_hash)
      DO UPDATE SET last_seen_at = now()
      RETURNING id
    `,
    [userId, anonymousKeyHash],
  );

  return result.rows[0].id;
}

async function readAppStateByUserId(userId) {
  const databasePool = getPool();
  const result = await databasePool.query(
    `
      SELECT storage_version, words, search_history, study_events, theme_mode
      FROM app_state
      WHERE user_id = $1
    `,
    [userId],
  );

  return deserializeAppState(result.rows[0]);
}

function hasUserData(state) {
  return (
    state.words.some((word) => {
      return (
        typeof word === "object" &&
        word !== null &&
        (word.saved === true || typeof word.word === "string")
      );
    }) ||
    state.searchHistory.length > 0 ||
    state.studyEvents.length > 0
  );
}

export async function bootstrapAppState({ anonymousKey, localState }) {
  const userId = await getOrCreateUserId(anonymousKey);
  const existingState = await readAppStateByUserId(userId);

  if (existingState !== null) {
    return {
      state: existingState,
      source: "remote",
    };
  }

  const nextState = normalizeAppStatePayload(localState);

  await writeAppStateByUserId(userId, nextState);

  return {
    state: nextState,
    source: hasUserData(nextState) ? "local-migrated" : "created",
  };
}

async function writeAppStateByUserId(userId, state) {
  const databasePool = getPool();
  const normalizedState = normalizeAppStatePayload(state);

  await databasePool.query(
    `
      INSERT INTO app_state (
        user_id,
        storage_version,
        words,
        search_history,
        study_events,
        theme_mode
      )
      VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6)
      ON CONFLICT (user_id)
      DO UPDATE SET
        storage_version = EXCLUDED.storage_version,
        words = EXCLUDED.words,
        search_history = EXCLUDED.search_history,
        study_events = EXCLUDED.study_events,
        theme_mode = EXCLUDED.theme_mode,
        updated_at = now()
    `,
    [
      userId,
      normalizedState.storageVersion,
      JSON.stringify(normalizedState.words),
      JSON.stringify(normalizedState.searchHistory),
      JSON.stringify(normalizedState.studyEvents),
      normalizedState.themeMode,
    ],
  );

  return normalizedState;
}

export async function saveAppState({ anonymousKey, state }) {
  const userId = await getOrCreateUserId(anonymousKey);
  const nextState = await writeAppStateByUserId(userId, state);

  return {
    state: nextState,
    source: "saved",
  };
}
