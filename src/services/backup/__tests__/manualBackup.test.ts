import { Buffer } from "buffer";

import { exportBackupToFile, importBackupFromDocument } from "../manualBackup";

const mockImportBackup = jest.fn(async () => ({
    ok: true as const,
    code: "OK" as const,
    restored: {
        users: 1,
        favorites: 0,
        searchHistory: 0,
    },
}));

jest.mock("@apps-in-toss/framework", () => {
    const getClipboardText = jest.fn(async () => "");
    getClipboardText.getPermission = jest.fn(async () => "allowed");
    getClipboardText.openPermissionDialog = jest.fn(async () => "allowed");

    const setClipboardText = jest.fn(async () => {});
    setClipboardText.getPermission = jest.fn(async () => "allowed");
    setClipboardText.openPermissionDialog = jest.fn(async () => "allowed");

    return {
        getClipboardText,
        saveBase64Data: jest.fn(async () => {}),
        setClipboardText,
    };
});

const frameworkMock = jest.requireMock("@apps-in-toss/framework");

const mockGetClipboardText = frameworkMock.getClipboardText;
const mockSaveBase64Data = frameworkMock.saveBase64Data;
const mockSetClipboardText = frameworkMock.setClipboardText;

jest.mock("@/services/database", () => ({
    exportBackup: jest.fn(async () => ({
        version: 1,
        exportedAt: "2025-01-01T00:00:00Z",
        users: [],
        favorites: {},
        searchHistory: [],
    })),
    importBackup: (...args: unknown[]) => mockImportBackup(...args),
}));

describe("manualBackup", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetClipboardText.getPermission.mockResolvedValue("allowed");
        mockGetClipboardText.openPermissionDialog.mockResolvedValue("allowed");
        mockSetClipboardText.getPermission.mockResolvedValue("allowed");
        mockSetClipboardText.openPermissionDialog.mockResolvedValue("allowed");
    });

    it("exports a sealed backup file and copies restore text to the clipboard", async () => {
        const result = await exportBackupToFile("secret");
        const { fileName } = result;

        expect(fileName).toContain("vocachip-backup-");
        expect(result.copiedToClipboard).toBe(true);
        expect(mockSaveBase64Data).toHaveBeenCalledWith(
            expect.objectContaining({
                fileName,
                mimeType: "application/json",
                data: expect.any(String),
            }),
        );

        const encoded = mockSaveBase64Data.mock.calls[0][0].data as string;
        const serialized = Buffer.from(encoded, "base64").toString("utf8");
        const payload = JSON.parse(serialized);
        const clipboardText = mockSetClipboardText.mock.calls[0][0] as string;

        expect(payload).toMatchObject({
            version: 2,
            encrypted: true,
            kdf: "pbkdf2-sha256",
            cipher: "aes-256-cbc",
        });
        expect(clipboardText).toMatch(/^vocachip-backup:/);
    });

    it("restores a backup from clipboard text", async () => {
        const exportResult = await exportBackupToFile("secret");
        const clipboardText = mockSetClipboardText.mock.calls[0][0] as string;

        mockGetClipboardText.mockResolvedValueOnce(clipboardText);
        mockImportBackup.mockResolvedValueOnce({
            ok: true,
            code: "OK",
            restored: {
                users: 0,
                favorites: 0,
                searchHistory: 0,
            },
        });

        await expect(importBackupFromDocument("secret")).resolves.toMatchObject({
            ok: true,
            code: "OK",
        });
        expect(exportResult.copiedToClipboard).toBe(true);
        expect(mockImportBackup).toHaveBeenCalledWith(
            expect.objectContaining({
                version: 1,
                users: [],
                favorites: {},
                searchHistory: [],
            }),
        );
    });

    it("returns a validation error when clipboard text is missing", async () => {
        mockGetClipboardText.mockResolvedValueOnce("   ");

        await expect(importBackupFromDocument("secret")).resolves.toMatchObject({
            ok: false,
            code: "INVALID_PAYLOAD",
        });
    });
});
