import { getEmailValidationError, getGooglePasswordValidationError } from "@/utils/authValidation";

describe("getEmailValidationError", () => {
    it("requires a non-empty value", () => {
        expect(getEmailValidationError("")).toBe("이메일 주소를 입력해주세요.");
        expect(getEmailValidationError("   ")).toBe("이메일 주소를 입력해주세요.");
    });

    it("rejects malformed addresses", () => {
        expect(getEmailValidationError("user@invalid")).toBe("유효한 이메일 주소를 입력해주세요.");
        expect(getEmailValidationError("user@@example.com")).toBe("유효한 이메일 주소를 입력해주세요.");
    });

    it("accepts valid addresses after trimming and lowercasing", () => {
        expect(getEmailValidationError("  USER@example.com  ")).toBeNull();
    });
});

describe("getGooglePasswordValidationError", () => {
    it("enforces presence and minimum length", () => {
        expect(getGooglePasswordValidationError("")).toBe("비밀번호를 입력해주세요.");
        expect(getGooglePasswordValidationError("abc12")).toBe("비밀번호는 8자 이상이어야 해요.");
    });

    it("rejects whitespace-only passwords", () => {
        expect(getGooglePasswordValidationError("Pass word1")).toBe("비밀번호에는 공백을 사용할 수 없어요.");
    });

    it("requires both letters and numbers", () => {
        expect(getGooglePasswordValidationError("abcdefgh")).toBe("비밀번호에는 영문과 숫자를 모두 포함해야 해요.");
        expect(getGooglePasswordValidationError("12345678")).toBe("비밀번호에는 영문과 숫자를 모두 포함해야 해요.");
    });

    it("returns null for a valid password", () => {
        expect(getGooglePasswordValidationError("Secure123")).toBeNull();
    });
});
