# vocachip

Apps in Toss 프로젝트입니다.

## 시작하기

```bash
npm run dev
```

## AI API 설정

OpenAI API 키는 브라우저에 노출하면 안 되기 때문에 서버 전용 환경변수로만 설정해요.

1. `.env.example`을 참고해서 `.env.local`을 만들고 `OPENAI_API_KEY`를 넣어 주세요.
2. 로컬 테스트는 터미널 2개에서 실행해요.

```bash
npm run dev:api
npm run dev
```

3. 배포 환경에서는 같은 값을 서버리스/백엔드 환경변수로 등록해 주세요. 프론트에는 `VITE_AI_*` 엔드포인트만 노출할 수 있어요.

### Render로 AI API 배포하기

이 저장소에는 Render Blueprint 설정인 `render.yaml`이 포함되어 있어요.

Render에서 Blueprint로 배포하거나 Web Service를 직접 만들 때 아래 값으로 설정해 주세요.

- Build Command: `npm install`
- Start Command: `npm run start:api`
- Health Check Path: `/healthz`
- Environment Variables:
  - `OPENAI_API_KEY`: OpenAI API 키
  - `OPENAI_MODEL`: `gpt-4.1-mini`
  - `AI_ALLOWED_ORIGIN`: 앱 프론트 주소

Render 배포가 끝나면 발급된 API 주소를 앱 빌드 환경변수에 넣어 주세요.

```bash
VITE_AI_MEANING_ENDPOINT=https://vocachip-ai-api.onrender.com/api/ai/meanings
VITE_AI_EXAMPLE_ENDPOINT=https://vocachip-ai-api.onrender.com/api/ai/example
```

## 배포하기

- 앱인토스 배포 API 키는 [앱인토스 콘솔](https://apps-in-toss.toss.im/) > 워크스페이스 > API 키 > 콘솔 API 키 에서 발급받을 수 있어요.

```bash
npm run build
npm run deploy
```

## 유용한 링크

- [앱인토스 콘솔](https://apps-in-toss.toss.im/)
- [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [앱인토스 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)

AI를 사용하시는 경우 [여기](https://developers-apps-in-toss.toss.im/development/llms.html)를 확인해보세요.
