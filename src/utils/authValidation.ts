export function getEmailValidationError(email: string): string | null {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
        return "이메일 주소를 입력해주세요.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail.toLowerCase())) {
        return "유효한 이메일 주소를 입력해주세요.";
    }
    return null;
}

export function getGooglePasswordValidationError(password: string): string | null {
    if (!password) {
        return "비밀번호를 입력해주세요.";
    }
    if (password.length < 8) {
        return "비밀번호는 8자 이상이어야 해요.";
    }
    if (/\s/.test(password)) {
        return "비밀번호에는 공백을 사용할 수 없어요.";
    }
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
        return "비밀번호에는 영문과 숫자를 모두 포함해야 해요.";
    }
    return null;
}
