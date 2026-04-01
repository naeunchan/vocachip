const DEBUG_PREFIX = "[ait-debug]";

export function debugLog(message: string, details?: unknown) {
    if (details === undefined) {
        console.log(`${DEBUG_PREFIX} ${message}`);
        return;
    }

    console.log(`${DEBUG_PREFIX} ${message}`, details);
}

export function debugError(message: string, error?: unknown) {
    if (error === undefined) {
        console.error(`${DEBUG_PREFIX} ${message}`);
        return;
    }

    console.error(`${DEBUG_PREFIX} ${message}`, error);
}
