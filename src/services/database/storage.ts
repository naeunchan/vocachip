import { debugLog } from "@/appsInToss/debug";
import { getRuntimeConfig } from "@/config/runtime";

type StorageBackend = {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
};

type AsyncStorageLike = StorageBackend & {
    clear?: () => Promise<void>;
};

let loggedBackendName: string | null = null;

function getAsyncStorageBackend(): StorageBackend {
    const moduleValue = require("@react-native-async-storage/async-storage") as {
        default?: AsyncStorageLike;
    };
    const storage = moduleValue.default ?? (moduleValue as unknown as AsyncStorageLike);

    return {
        getItem: (key) => storage.getItem(key),
        setItem: (key, value) => storage.setItem(key, value),
        removeItem: (key) => storage.removeItem(key),
    };
}

function getAppsInTossStorageBackend(): StorageBackend {
    const moduleValue = require("@apps-in-toss/framework") as {
        Storage?: StorageBackend;
    };

    if (!moduleValue.Storage) {
        throw new Error("Apps in Toss Storage를 사용할 수 없어요.");
    }

    return moduleValue.Storage;
}

export function getDatabaseStorage(): StorageBackend {
    const backendName = getRuntimeConfig().runtimeTarget === "apps-in-toss" ? "apps-in-toss" : "async-storage";

    if (loggedBackendName !== backendName) {
        loggedBackendName = backendName;
        debugLog("database storage backend selected", { backendName });
    }

    if (backendName === "apps-in-toss") {
        return getAppsInTossStorageBackend();
    }

    return getAsyncStorageBackend();
}
