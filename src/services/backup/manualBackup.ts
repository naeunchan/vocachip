import {
    getClipboardText,
    GetClipboardTextPermissionError,
    saveBase64Data,
    setClipboardText,
    SetClipboardTextPermissionError,
} from "@apps-in-toss/framework";
import { Buffer } from "buffer";
import CryptoJS from "crypto-js";

import { classifyUnsealError } from "@/services/backup/classifyUnsealError";
import { BackupUnsealError, decryptFailed, invalidPayload, unsupportedVersion } from "@/services/backup/errors";
import { createRestoreError, type RestoreResult } from "@/services/backup/restoreResult";
import { validateBackupPayload } from "@/services/backup/validateBackupPayload";
import { type BackupPayload, exportBackup, importBackup } from "@/services/database";
import { digestSha256, getRandomBytesAsync } from "@/utils/crypto";

const CLIPBOARD_BACKUP_PREFIX = "vocachip-backup:";
const DEFAULT_ITERATIONS = 120_000;

type SealedBackupV1 = {
    version: 1;
    encrypted: true;
    salt: string;
    ciphertext: string;
    integrity: string;
};

type SealedBackupV2 = {
    version: 2;
    encrypted: true;
    salt: string;
    iv: string;
    ciphertext: string;
    integrity: string;
    kdf: "pbkdf2-sha256";
    iterations: number;
    cipher: "aes-256-cbc";
};

type ExportBackupResult = {
    fileName: string;
    copiedToClipboard: boolean;
};

function assertValidBackupPayload(payload: unknown): BackupPayload {
    const validation = validateBackupPayload(payload);
    if (!validation.ok) {
        throw new BackupUnsealError(validation.code, validation.message, {
            details: validation.details,
        });
    }

    return validation.parsed;
}

async function deriveLegacyKey(passphrase: string, salt: string) {
    const digest = await digestSha256(`${salt}:${passphrase}`);
    return Buffer.from(digest, "hex");
}

function xorBytes(data: Uint8Array, key: Uint8Array) {
    const output = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i += 1) {
        output[i] = data[i] ^ key[i % key.length];
    }
    return output;
}

async function sealPayload(payload: BackupPayload, passphrase: string): Promise<SealedBackupV2> {
    if (!passphrase.trim()) {
        throw new Error("암호를 입력해주세요.");
    }

    const normalizedPayload = assertValidBackupPayload(payload);
    const saltBytes = await getRandomBytesAsync(16);
    const ivBytes = await getRandomBytesAsync(16);
    const salt = Buffer.from(saltBytes).toString("hex");
    const iv = Buffer.from(ivBytes).toString("hex");
    const iterations = DEFAULT_ITERATIONS;

    const saltWordArray = CryptoJS.enc.Hex.parse(salt);
    const ivWordArray = CryptoJS.enc.Hex.parse(iv);
    const key = CryptoJS.PBKDF2(passphrase, saltWordArray, {
        keySize: 256 / 32,
        iterations,
        hasher: CryptoJS.algo.SHA256,
    });
    const macKey = CryptoJS.PBKDF2(`${passphrase}-mac`, saltWordArray, {
        keySize: 256 / 32,
        iterations,
        hasher: CryptoJS.algo.SHA256,
    });

    const plaintext = JSON.stringify(normalizedPayload);
    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
        iv: ivWordArray,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });
    const ciphertext = encrypted.toString();
    const integrity = CryptoJS.HmacSHA256(`${ciphertext}:${iv}:${salt}`, macKey).toString(CryptoJS.enc.Hex);

    return {
        version: 2,
        encrypted: true,
        salt,
        iv,
        ciphertext,
        integrity,
        kdf: "pbkdf2-sha256",
        iterations,
        cipher: "aes-256-cbc",
    };
}

function createClipboardBackupText(serialized: string) {
    return `${CLIPBOARD_BACKUP_PREFIX}${Buffer.from(serialized, "utf8").toString("base64")}`;
}

function decodeClipboardPayload(encoded: string) {
    try {
        return Buffer.from(encoded, "base64").toString("utf8");
    } catch (error) {
        throw invalidPayload("클립보드의 백업 텍스트를 해석하지 못했어요.", undefined, error);
    }
}

function resolveSerializedBackupFromClipboard(clipboardText: string) {
    const trimmed = clipboardText.trim();
    if (!trimmed) {
        throw invalidPayload("클립보드에 백업 텍스트가 없어요. 백업 텍스트를 먼저 복사해주세요.");
    }

    if (trimmed.startsWith(CLIPBOARD_BACKUP_PREFIX)) {
        const encoded = trimmed.slice(CLIPBOARD_BACKUP_PREFIX.length).trim();
        if (!encoded) {
            throw invalidPayload("클립보드의 백업 텍스트 형식이 올바르지 않아요.");
        }
        return decodeClipboardPayload(encoded);
    }

    if (trimmed.startsWith("{")) {
        return trimmed;
    }

    if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed)) {
        const decoded = decodeClipboardPayload(trimmed.replace(/\s+/g, ""));
        if (decoded.trim().startsWith("{")) {
            return decoded;
        }
    }

    throw invalidPayload("클립보드의 백업 텍스트 형식이 올바르지 않아요.");
}

async function ensureClipboardPermission(
    clipboardApi: Partial<Pick<typeof getClipboardText, "getPermission" | "openPermissionDialog">>,
) {
    if (typeof clipboardApi.getPermission !== "function" || typeof clipboardApi.openPermissionDialog !== "function") {
        return true;
    }

    try {
        const status = await clipboardApi.getPermission();
        if (status === "allowed") {
            return true;
        }
        return (await clipboardApi.openPermissionDialog()) === "allowed";
    } catch {
        return false;
    }
}

async function copyBackupToClipboard(serialized: string) {
    const canWrite = await ensureClipboardPermission(setClipboardText);
    if (!canWrite) {
        return false;
    }

    try {
        await setClipboardText(createClipboardBackupText(serialized));
        return true;
    } catch (error) {
        if (error instanceof SetClipboardTextPermissionError) {
            return false;
        }
        throw error;
    }
}

async function unsealPayload(serialized: string, passphrase: string): Promise<BackupPayload> {
    if (!passphrase.trim()) {
        throw decryptFailed(undefined, "암호를 입력해주세요.");
    }

    let parsed: SealedBackupV1 | SealedBackupV2 | BackupPayload;
    try {
        parsed = JSON.parse(serialized);
    } catch (error) {
        throw invalidPayload("백업 데이터를 읽을 수 없어요.", undefined, error);
    }

    if (!(parsed as SealedBackupV1 | SealedBackupV2).encrypted) {
        return assertValidBackupPayload(parsed);
    }

    const sealed = parsed as SealedBackupV1 | SealedBackupV2;
    if (sealed.version !== 1 && sealed.version !== 2) {
        throw unsupportedVersion(sealed.version);
    }

    if (sealed.version === 2) {
        if (!sealed.ciphertext || !sealed.salt || !sealed.iv || !sealed.integrity) {
            throw invalidPayload("백업 데이터 형식이 올바르지 않아요.");
        }

        let plaintext = "";
        try {
            const saltWordArray = CryptoJS.enc.Hex.parse(sealed.salt);
            const ivWordArray = CryptoJS.enc.Hex.parse(sealed.iv);
            const iterations = sealed.iterations || DEFAULT_ITERATIONS;
            const key = CryptoJS.PBKDF2(passphrase, saltWordArray, {
                keySize: 256 / 32,
                iterations,
                hasher: CryptoJS.algo.SHA256,
            });
            const macKey = CryptoJS.PBKDF2(`${passphrase}-mac`, saltWordArray, {
                keySize: 256 / 32,
                iterations,
                hasher: CryptoJS.algo.SHA256,
            });
            const expectedIntegrity = CryptoJS.HmacSHA256(
                `${sealed.ciphertext}:${sealed.iv}:${sealed.salt}`,
                macKey,
            ).toString(CryptoJS.enc.Hex);

            if (expectedIntegrity !== sealed.integrity) {
                throw decryptFailed(undefined, "백업 데이터 무결성 검증에 실패했어요.");
            }

            const decrypted = CryptoJS.AES.decrypt(sealed.ciphertext, key, {
                iv: ivWordArray,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
            });
            plaintext = decrypted.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            if (error instanceof BackupUnsealError) {
                throw error;
            }
            throw decryptFailed(error);
        }

        if (!plaintext) {
            throw decryptFailed(undefined, "백업 데이터를 복호화하지 못했어요.");
        }

        let payload: unknown;
        try {
            payload = JSON.parse(plaintext);
        } catch (error) {
            throw invalidPayload("백업 데이터 구조가 올바르지 않아요.", undefined, error);
        }

        return assertValidBackupPayload(payload);
    }

    if (!sealed.ciphertext || !sealed.salt || !sealed.integrity) {
        throw invalidPayload("백업 데이터 형식이 올바르지 않아요.");
    }

    const expectedIntegrity = await digestSha256(`${sealed.ciphertext}:${sealed.salt}`);
    if (expectedIntegrity !== sealed.integrity) {
        throw decryptFailed(undefined, "백업 데이터 무결성 검증에 실패했어요.");
    }

    let payload: unknown;
    try {
        const key = await deriveLegacyKey(passphrase, sealed.salt);
        const cipherBytes = Buffer.from(sealed.ciphertext, "base64");
        const plainBytes = xorBytes(cipherBytes, key);
        const plaintext = Buffer.from(plainBytes).toString("utf8");
        payload = JSON.parse(plaintext);
    } catch (error) {
        if (error instanceof BackupUnsealError) {
            throw error;
        }
        throw invalidPayload("백업 데이터 구조가 올바르지 않아요.", undefined, error);
    }

    return assertValidBackupPayload(payload);
}

export async function exportBackupToFile(passphrase: string): Promise<ExportBackupResult> {
    const sealed = await sealPayload(await exportBackup(), passphrase);
    const fileName = `vocachip-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    const compactSerialized = JSON.stringify(sealed);
    const fileSerialized = JSON.stringify(sealed, null, 2);

    await saveBase64Data({
        data: Buffer.from(fileSerialized, "utf8").toString("base64"),
        fileName,
        mimeType: "application/json",
    });

    const copiedToClipboard = await copyBackupToClipboard(compactSerialized);

    return {
        fileName,
        copiedToClipboard,
    };
}

export type ImportBackupFromDocumentResult = RestoreResult | { canceled: true };

export async function importBackupFromDocument(passphrase: string): Promise<ImportBackupFromDocumentResult> {
    const canRead = await ensureClipboardPermission(getClipboardText);
    if (!canRead) {
        return createRestoreError("UNKNOWN", "클립보드 읽기 권한이 필요해요. 권한을 허용한 뒤 다시 시도해주세요.");
    }

    let clipboardText = "";
    try {
        clipboardText = await getClipboardText();
    } catch (error) {
        if (error instanceof GetClipboardTextPermissionError) {
            return createRestoreError("UNKNOWN", "클립보드 읽기 권한이 필요해요. 권한을 허용한 뒤 다시 시도해주세요.");
        }

        return createRestoreError("UNKNOWN", "클립보드에서 백업 텍스트를 읽지 못했어요.", {
            errorMessage: error instanceof Error ? error.message : String(error),
        });
    }

    let payload: BackupPayload;
    try {
        const serialized = resolveSerializedBackupFromClipboard(clipboardText);
        payload = await unsealPayload(serialized, passphrase);
    } catch (error) {
        const classified = classifyUnsealError(error);
        return createRestoreError(classified.code, classified.message, classified.details);
    }

    return await importBackup(payload);
}

export const __manualBackupInternals = {
    createClipboardBackupText,
    deriveLegacyKey,
    resolveSerializedBackupFromClipboard,
    sealPayload,
    unsealPayload,
    xorBytes,
};
