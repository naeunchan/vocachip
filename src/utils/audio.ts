type HtmlAudioLike = {
    currentTime: number;
    pause: () => void;
    play: () => Promise<void> | void;
    load?: () => void;
    preload?: string;
    src: string;
    addEventListener: (eventName: string, listener: () => void) => void;
    removeEventListener: (eventName: string, listener: () => void) => void;
};

type AudioConstructor = new (src?: string) => HtmlAudioLike;

type CachedPlayer = {
    audio: HtmlAudioLike;
    readyPromise: Promise<void>;
    lastUsedAt: number;
};

const MAX_CACHED_PLAYERS = 6;
const PLAYER_READY_TIMEOUT_MS = 8000;

let activePlayerUri: string | null = null;
const cachedPlayers = new Map<string, CachedPlayer>();

function getAudioConstructor(): AudioConstructor | null {
    const candidate = (globalThis as typeof globalThis & { Audio?: AudioConstructor }).Audio;
    return typeof candidate === "function" ? candidate : null;
}

function createUnsupportedAudioError() {
    return new Error("현재 앱인토스 런타임에서는 오디오 재생을 지원하지 않아요.");
}

function isPromiseLike(value: Promise<void> | void): value is Promise<void> {
    return typeof value === "object" && value !== null && typeof value.catch === "function";
}

function removeEventListeners(audio: HtmlAudioLike, entries: [string, () => void][]) {
    entries.forEach(([eventName, listener]) => {
        audio.removeEventListener(eventName, listener);
    });
}

function waitUntilLoaded(audio: HtmlAudioLike): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        let settled = false;
        const listeners: [string, () => void][] = [];
        const timeoutId = setTimeout(() => {
            settle(new Error("오디오를 준비할 수 없어요."));
        }, PLAYER_READY_TIMEOUT_MS);

        const settle = (error?: Error) => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timeoutId);
            removeEventListeners(audio, listeners);
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        };

        const handleLoaded = () => settle();
        const handleError = () => settle(new Error("오디오를 불러오지 못했어요."));

        [
            ["canplaythrough", handleLoaded],
            ["canplay", handleLoaded],
            ["loadeddata", handleLoaded],
            ["error", handleError],
        ].forEach(([eventName, listener]) => {
            audio.addEventListener(eventName, listener);
            listeners.push([eventName, listener]);
        });

        audio.load?.();
    });
}

function disposePlayer(audio: HtmlAudioLike) {
    try {
        audio.pause();
    } catch (error) {
        console.warn("오디오 재생을 중단하는 중 문제가 발생했어요.", error);
    }

    audio.src = "";
}

function removeCachedPlayer(uri: string) {
    const cached = cachedPlayers.get(uri);
    if (!cached) {
        return;
    }

    cachedPlayers.delete(uri);
    if (activePlayerUri === uri) {
        activePlayerUri = null;
    }
    disposePlayer(cached.audio);
}

function trimCachedPlayers() {
    if (cachedPlayers.size <= MAX_CACHED_PLAYERS) {
        return;
    }

    const sortedByAge = [...cachedPlayers.entries()].sort((a, b) => a[1].lastUsedAt - b[1].lastUsedAt);
    for (const [uri] of sortedByAge) {
        if (cachedPlayers.size <= MAX_CACHED_PLAYERS) {
            break;
        }
        removeCachedPlayer(uri);
    }
}

function createAudioPlayer(uri: string): CachedPlayer {
    const Audio = getAudioConstructor();
    if (!Audio) {
        throw createUnsupportedAudioError();
    }

    const audio = new Audio(uri);
    audio.preload = "auto";

    const cached: CachedPlayer = {
        audio,
        readyPromise: waitUntilLoaded(audio).catch((error) => {
            removeCachedPlayer(uri);
            throw error;
        }),
        lastUsedAt: Date.now(),
    };

    cachedPlayers.set(uri, cached);
    trimCachedPlayers();
    return cached;
}

function getOrCreateCachedPlayer(uri: string): CachedPlayer {
    const existing = cachedPlayers.get(uri);
    if (existing) {
        existing.lastUsedAt = Date.now();
        return existing;
    }

    return createAudioPlayer(uri);
}

async function getReadyPlayer(uri: string): Promise<HtmlAudioLike> {
    const cached = getOrCreateCachedPlayer(uri);
    await cached.readyPromise;
    cached.lastUsedAt = Date.now();
    return cached.audio;
}

export async function prefetchRemoteAudio(uri: string): Promise<void> {
    await getReadyPlayer(uri);
}

export async function playRemoteAudio(uri: string) {
    const player = await getReadyPlayer(uri);

    if (activePlayerUri && activePlayerUri !== uri) {
        const previous = cachedPlayers.get(activePlayerUri);
        if (previous) {
            try {
                previous.audio.pause();
            } catch (error) {
                console.warn("이전 오디오 재생을 중단하는 중 문제가 발생했어요.", error);
            }
        }
    }

    activePlayerUri = uri;

    try {
        player.currentTime = 0;
    } catch {
        // Ignore seek failures and attempt playback anyway.
    }

    await new Promise<void>((resolve, reject) => {
        let settled = false;
        const listeners: [string, () => void][] = [];

        const settle = (error?: Error) => {
            if (settled) {
                return;
            }
            settled = true;
            removeEventListeners(player, listeners);
            if (activePlayerUri === uri) {
                activePlayerUri = null;
            }
            if (error) {
                removeCachedPlayer(uri);
                reject(error);
            } else {
                resolve();
            }
        };

        const handleEnded = () => settle();
        const handleError = () => settle(new Error("오디오를 재생할 수 없어요."));

        [
            ["ended", handleEnded],
            ["error", handleError],
        ].forEach(([eventName, listener]) => {
            player.addEventListener(eventName, listener);
            listeners.push([eventName, listener]);
        });

        try {
            const playback = player.play();
            if (isPromiseLike(playback)) {
                void playback.catch((error) => {
                    settle(error instanceof Error ? error : new Error("오디오를 재생할 수 없어요."));
                });
            }
        } catch (error) {
            settle(error instanceof Error ? error : new Error("오디오를 재생할 수 없어요."));
        }
    });
}
