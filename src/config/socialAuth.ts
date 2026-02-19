import Constants from "expo-constants";

type SocialAuthConfig = {
    expoClientId: string;
    iosClientId: string;
    androidClientId: string;
    webClientId: string;
};

function readString(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

function resolveConfigValue(extraKey: string, envKey: string): string {
    const fromExtra = readString(extra[extraKey]);
    const fromEnv = readString(process.env[envKey]);
    return fromEnv || fromExtra;
}

export const GOOGLE_AUTH_CONFIG: SocialAuthConfig = {
    expoClientId: resolveConfigValue("googleExpoClientId", "EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID"),
    iosClientId: resolveConfigValue("googleIosClientId", "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID"),
    androidClientId: resolveConfigValue("googleAndroidClientId", "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID"),
    webClientId: resolveConfigValue("googleWebClientId", "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"),
};

export const GOOGLE_AUTH_ALLOWED_AUDIENCES = [
    GOOGLE_AUTH_CONFIG.expoClientId,
    GOOGLE_AUTH_CONFIG.iosClientId,
    GOOGLE_AUTH_CONFIG.androidClientId,
    GOOGLE_AUTH_CONFIG.webClientId,
].filter(Boolean);

export const GOOGLE_AUTH_ENABLED = GOOGLE_AUTH_ALLOWED_AUDIENCES.length > 0;
