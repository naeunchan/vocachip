import { t } from "@/shared/i18n";

type AuthMode = "login" | "signup";

export function getLoginCopy(mode: AuthMode) {
    const isLogin = mode === "login";

    return {
        title: isLogin ? t("auth.login.title") : t("auth.signup.title"),
        subtitle: isLogin ? t("auth.login.subtitle") : t("auth.signup.subtitle"),
        primaryButton: isLogin ? t("auth.login.primary") : t("auth.signup.primary"),
        togglePrompt: isLogin ? t("auth.toggle.toSignup") : t("auth.toggle.toLogin"),
        toggleAction: isLogin ? t("auth.toggle.signupAction") : t("auth.toggle.loginAction"),
    };
}
