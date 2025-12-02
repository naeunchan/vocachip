# Release Readiness Checklist (Phase 1–3)

- Update `app.json` versions (`expo.version`, `ios.buildNumber`, `android.versionCode`) before cutting builds.
- Replace `PRIVACY_POLICY_URL` / `TERMS_OF_SERVICE_URL` in `src/config/legal.ts` with your hosted pages (defaults are placeholders) and verify they open from Settings.
- Configure `OPENAI_PROXY_URL` for AI examples/TTS; if absent, keep store copy/screenshots AI-free.
- Ensure SecureStore credentials are cleared on logout; smoke-test login → logout → login flows.
- Run `npm test` and a release build (`eas build --profile production` or `expo export --platform android,ios`) before submission.
