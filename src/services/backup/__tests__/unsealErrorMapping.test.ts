import { classifyUnsealError } from "@/services/backup/classifyUnsealError";
import { BackupUnsealError } from "@/services/backup/errors";

describe("manualBackup unseal error mapping", () => {
    it("maps typed errors by code even when message text is misleading", () => {
        const misleadingError = new BackupUnsealError(
            "DECRYPT_FAILED",
            "this message says INVALID_PAYLOAD but it should still map by code",
        );

        expect(classifyUnsealError(misleadingError).code).toBe("DECRYPT_FAILED");
    });

    it("does not classify raw Error messages by string parsing", () => {
        expect(classifyUnsealError(new Error("DECRYPT_FAILED")).code).toBe("UNKNOWN");
    });
});
