import {
    deletePersistedPronunciationUri,
    getPersistedPronunciationUri,
    setPersistedPronunciationUri,
} from "@/api/dictionary/aiPersistentCache";
import {
    createAIHttpError,
    createAIInvalidPayloadError,
    createAIUnavailableError,
    normalizeAIProxyError,
} from "@/api/dictionary/aiProxyError";
import { getOpenAIConfig } from "@/config/openAI";
import { createAppError } from "@/errors/AppError";

const TTS_MODEL = "gpt-4o-mini-tts";
const TTS_VOICE = "alloy";
const TTS_FORMAT = "mp3";
const AUDIO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const AUDIO_CACHE: Map<string, string> = new Map();
const AUDIO_REQUESTS: Map<string, Promise<string>> = new Map();

function normalizeWord(input: string) {
    return input.trim().toLowerCase();
}

async function resolveCachedAudioUri(normalized: string): Promise<string | null> {
    const cachedUri = AUDIO_CACHE.get(normalized);
    if (!cachedUri) {
        const persisted = await getPersistedPronunciationUri(normalized);
        if (!persisted || !persisted.isFresh) {
            if (persisted) {
                await deletePersistedPronunciationUri(normalized);
            }
            return null;
        }

        AUDIO_CACHE.set(normalized, persisted.value);
        return await validateCachedAudioUri(normalized, persisted.value);
    }

    return await validateCachedAudioUri(normalized, cachedUri);
}

async function validateCachedAudioUri(normalized: string, cachedUri: string): Promise<string | null> {
    if (!cachedUri) {
        return null;
    }

    if (cachedUri.startsWith("data:audio/")) {
        AUDIO_CACHE.delete(normalized);
        await deletePersistedPronunciationUri(normalized);
        return null;
    }

    return cachedUri;
}

function shouldPersistAudioUri(uri: string): boolean {
    return uri.startsWith("http://") || uri.startsWith("https://");
}

async function requestPronunciationAudio(normalized: string): Promise<string> {
    const { proxyKey, proxyUrl } = getOpenAIConfig();
    const endpointBase = proxyUrl.replace(/\/+$/, "");
    const requestUrl = `${endpointBase}/dictionary/tts`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, 8000);

    let response: Response;
    try {
        response = await fetch(requestUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(proxyKey ? { "x-api-key": proxyKey } : {}),
            },
            body: JSON.stringify({
                text: normalized,
                model: TTS_MODEL,
                voice: TTS_VOICE,
                format: TTS_FORMAT,
            }),
            signal: controller.signal,
        });
    } catch (error) {
        throw normalizeAIProxyError(error, "tts");
    } finally {
        clearTimeout(timeoutId);
    }

    if (!response.ok) {
        throw createAIHttpError(response.status, "tts");
    }

    let data: unknown;
    try {
        data = await response.json();
    } catch (error) {
        throw createAIInvalidPayloadError("tts", error);
    }

    const payload = (data ?? {}) as { audioBase64?: unknown; audioUrl?: unknown };
    const base64 = typeof payload.audioBase64 === "string" && payload.audioBase64 ? payload.audioBase64 : null;
    const directUrl = typeof payload.audioUrl === "string" && payload.audioUrl ? payload.audioUrl : null;

    if (directUrl) {
        AUDIO_CACHE.set(normalized, directUrl);
        await setPersistedPronunciationUri(normalized, directUrl, AUDIO_CACHE_TTL_MS);
        return directUrl;
    }

    const finalUri = base64 ? `data:audio/${TTS_FORMAT};base64,${base64}` : null;

    if (!finalUri) {
        throw createAIInvalidPayloadError("tts");
    }

    AUDIO_CACHE.set(normalized, finalUri);
    if (shouldPersistAudioUri(finalUri)) {
        await setPersistedPronunciationUri(normalized, finalUri, AUDIO_CACHE_TTL_MS);
    }
    return finalUri;
}

async function resolveAudioUri(normalized: string): Promise<string> {
    const cachedUri = await resolveCachedAudioUri(normalized);
    if (cachedUri) {
        return cachedUri;
    }

    const inFlight = AUDIO_REQUESTS.get(normalized);
    if (inFlight) {
        return await inFlight;
    }

    const requestPromise = requestPronunciationAudio(normalized).finally(() => {
        AUDIO_REQUESTS.delete(normalized);
    });
    AUDIO_REQUESTS.set(normalized, requestPromise);
    return await requestPromise;
}

export async function getPronunciationAudio(word: string) {
    const normalized = normalizeWord(word);
    if (!normalized) {
        throw createAppError("ValidationError", "발음으로 변환할 단어가 없어요.", {
            code: "AI_TTS_EMPTY_WORD",
            retryable: false,
        });
    }

    const { featureEnabled, proxyUrl } = getOpenAIConfig();

    if (!featureEnabled || !proxyUrl) {
        throw createAIUnavailableError("tts");
    }

    return await resolveAudioUri(normalized);
}

export async function prefetchPronunciationAudio(word: string): Promise<string> {
    return await getPronunciationAudio(word);
}

export async function invalidatePronunciationAudioCache(word: string): Promise<void> {
    const normalized = normalizeWord(word);
    if (!normalized) {
        return;
    }

    AUDIO_CACHE.delete(normalized);
    AUDIO_REQUESTS.delete(normalized);
    await deletePersistedPronunciationUri(normalized);
}
