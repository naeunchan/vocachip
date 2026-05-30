# vocachip

Apps in Toss 프로젝트입니다.

## 시작하기

```bash
npm run dev
```

## 백엔드 API 설정

OpenAI API 키와 Dictionary API 키는 브라우저에 노출하면 안 되기 때문에 서버 전용 환경변수로만 설정해요.

1. `.env.example`을 참고해서 `.env.local`을 만들고 `OPENAI_API_KEY`, `DICTIONARY_API_KEY`를 넣어 주세요.
2. 로컬 테스트는 터미널 2개에서 실행해요.

```bash
npm run dev:api
npm run dev
```

3. 배포 환경에서는 같은 값을 서버리스/백엔드 환경변수로 등록해 주세요. 프론트에는 `VITE_*_ENDPOINT` 값만 노출할 수 있어요.

### Render로 백엔드 API 배포하기

이 저장소에는 Render Blueprint 설정인 `render.yaml`이 포함되어 있어요.

Render에서 Blueprint로 배포하거나 Web Service를 직접 만들 때 아래 값으로 설정해 주세요.

- Build Command: `npm install`
- Start Command: `node server/index.js`
- Health Check Path: `/health`
- Environment Variables:
  - `OPENAI_API_KEY`: OpenAI API 키
  - `OPENAI_MODEL`: `gpt-4.1-mini`
  - `DICTIONARY_API_KEY`: dictionaryapi.com API 키
  - `DICTIONARY_API_REFERENCE`: `collegiate`
  - `AI_ALLOWED_ORIGIN`: 앱 프론트 주소. 여러 개면 쉼표로 구분
  - `API_RATE_LIMIT_WINDOW_MS`: rate limit 집계 시간. 기본값 `60000`
  - `AI_RATE_LIMIT_MAX`: IP별 AI 요청 제한. 기본값 `30`
  - `DICTIONARY_RATE_LIMIT_MAX`: IP별 사전 요청 제한. 기본값 `120`

Render 배포가 끝나면 발급된 API 주소를 앱 빌드 환경변수에 넣어 주세요.

```bash
VITE_AI_MEANING_ENDPOINT=https://vocationary.onrender.com/api/ai/meanings
VITE_AI_EXAMPLE_ENDPOINT=https://vocationary.onrender.com/api/ai/example
VITE_DICTIONARY_ENDPOINT=https://vocationary.onrender.com/api/dictionary/search
VITE_FEEDBACK_EMAIL=오류 제보를 받을 이메일
```

### 검색 API 스모크 테스트

로컬 API 서버 또는 Render API 서버가 핵심 검색어를 정상 처리하는지 확인할 수 있어요.

```bash
npm run test:search
```

Render 서버를 대상으로 확인할 때는 아래처럼 실행해요.

```bash
DICTIONARY_TEST_ENDPOINT=https://vocationary.onrender.com/api/dictionary/search npm run test:search
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
