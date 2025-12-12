import Constants from "expo-constants";

/**
 * Reads legal URLs from Expo extra so we don't accidentally ship placeholder links.
 * When empty, the app will show the built-in legal modal instead of opening a broken URL.
 */
const extra = Constants.expoConfig?.extra ?? {};
export const PRIVACY_POLICY_URL =
    typeof extra.privacyPolicyUrl === "string" && extra.privacyPolicyUrl.trim().length > 0
        ? extra.privacyPolicyUrl.trim()
        : "";
export const TERMS_OF_SERVICE_URL =
    typeof extra.termsOfServiceUrl === "string" && extra.termsOfServiceUrl.trim().length > 0
        ? extra.termsOfServiceUrl.trim()
        : "";
