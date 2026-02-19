# Store Auth Configuration (Apple & Google Sign-In)

This app already supports email/password and guest access through the local SQLite layer. Because the previous “social login” UX was a fake local shortcut, it has been removed from production builds until real Apple/Google OAuth is wired up. The steps below outline how to safely re-enable those providers once the native/platform configuration is complete.

---

## 1. Apple Sign-In (iOS)

### App-side configuration

1. **Bundle Identifier**  
   `app.json` currently uses `com.anonymous.vocationary`. Update this to your production bundle identifier before release.

2. **Expo config / entitlements**  
   When building with EAS for iOS, ensure that `expo build` or `eas build` uses a credentials profile that enables _Sign in with Apple_.
    - In `eas.json`, set `"ios": { "entitlements": { "com.apple.developer.applesignin": ["Default"] } }` once you have a real bundle ID.
    - If you add `expo-apple-authentication`, also follow its installation guide (`npx expo install expo-apple-authentication`) and wrap UI with `<AppleAuthenticationButton>` etc.

### Apple Developer Console steps (manual)

> **TODO for developer:** complete these steps in the Apple Developer portal.

1. **Create an App ID & enable Sign in with Apple**
    - Apple Developer → Certificates, Identifiers & Profiles → Identifiers → App IDs → enable _Sign in with Apple_.
2. **Create a Services ID**
    - Needed only if you plan to support web flows (`expo-auth-session`). For native-only flows you can rely on native capabilities.
3. **Configure Redirect URLs**
    - For AuthSession/web fallback: set `https://auth.expo.io/@your-username/your-slug`.
4. **Create a private key**
    - Apple Developer → Keys → Sign in with Apple. Download the `.p8` key and record the Key ID.
5. **Update EAS credentials**
    - In `eas credentials`, assign the key + service ID identifiers. Expo docs: https://docs.expo.dev/guides/sign-in-with-apple/

Add environment variables (e.g., `EXPO_PUBLIC_APPLE_CLIENT_ID`, `EXPO_PUBLIC_APPLE_REDIRECT_URI`) for use when wiring up the UI.

---

## 2. Google Sign-In (iOS + Android)

### App-side configuration

The project now uses `expo-auth-session` + `expo-web-browser` for the first-pass Google OAuth flow (VOC-25). Google 로그인 성공 시 앱에서 프로필을 검증한 뒤 `upsertOAuthUser` + 세션 생성 경로로 연결됩니다.

1. **Install the SDK**  
   `npx expo install expo-auth-session expo-web-browser`
2. **Configure reverse client ID for iOS**
    - Once you obtain a Google OAuth Client ID (iOS type), add it to `app.json` under:
        ```json
        "ios": {
          "bundleIdentifier": "your.bundle.id",
          "googleServicesFile": "./GoogleService-Info.plist",
          "config": {
            "googleSignIn": {
              "reservedClientId": "com.googleusercontent.apps.XXXX"
            }
          }
        }
        ```
3. **Configure Android**
    - Update `android.package` to the release package name.
    - If using `expo-auth-session`, set `androidClientId` with your OAuth client ID.
    - If using the native Google services JSON, add `"googleServicesFile": "./google-services.json"` to `android`.

### Google Cloud Console steps (manual)

> **TODO for developer:** run these steps in https://console.cloud.google.com/apis/credentials

1. **Create OAuth consent screen** (external or internal as needed).
2. **Create OAuth client IDs**
    - One “iOS” client with the bundle ID.
    - One “Android” client using the package name + SHA-1. Get SHA-1 by running `eas credentials` or `keytool -list -v -keystore`.
    - Optional: Web client for Expo web/`expo-auth-session`.
3. **Set redirect URIs**
    - For `expo-auth-session`: `https://auth.expo.io/@your-username/your-slug`.
4. **Download config files**
    - `GoogleService-Info.plist` → root directory.
    - `google-services.json` → root directory.

Update `.env` or `app.config` to expose (already wired in `app.config.ts`):

```
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
```

---

## 3. Wiring the UI

1. `LoginScreen.tsx`에서 Google 버튼을 통해 OAuth를 실행합니다.
2. `src/services/auth/googleSignIn.ts`가 `tokeninfo/userinfo` + JWT 디코드 fallback으로 프로필을 정규화합니다.
3. `useAppScreen.ts`에서 `upsertOAuthUser` 호출 후 사용자 세션을 생성합니다.
4. Apple Sign-In은 아직 별도 구현이 필요합니다.

Once console configuration and SDK wiring are complete, test both providers on physical devices, then update the App Store / Google Play listing screenshots accordingly.
