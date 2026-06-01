# vocachip

Apps in Toss 프로젝트입니다.

## 시작하기

```bash
npm run dev
```

## 백엔드 API 설정

OpenAI API 키, Dictionary API 키, PostgreSQL 연결 정보는 브라우저에 노출하면 안 되기 때문에 서버 전용 환경변수로만 설정해요.

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
  - `DATABASE_URL`: Render PostgreSQL internal connection string
  - `DATABASE_SSL`: Render internal DB 연결이면 `false`, 외부 DB 연결이면 `true`
  - `APP_USER_KEY_HASH_SECRET`: 앱인토스 사용자 식별키 해시용 서버 비밀값
  - `API_RATE_LIMIT_WINDOW_MS`: rate limit 집계 시간. 기본값 `60000`
  - `AI_RATE_LIMIT_MAX`: IP별 AI 요청 제한. 기본값 `30`
  - `DICTIONARY_RATE_LIMIT_MAX`: IP별 사전 요청 제한. 기본값 `120`
  - `APP_STATE_RATE_LIMIT_MAX`: IP별 단어장 동기화 요청 제한. 기본값 `120`

Render 배포가 끝나면 발급된 API 주소를 앱 빌드 환경변수에 넣어 주세요.

```bash
VITE_AI_MEANING_ENDPOINT=https://vocationary.onrender.com/api/ai/meanings
VITE_AI_EXAMPLE_ENDPOINT=https://vocationary.onrender.com/api/ai/example
VITE_DICTIONARY_ENDPOINT=https://vocationary.onrender.com/api/dictionary/search
VITE_APP_STATE_ENDPOINT=https://vocationary.onrender.com/api/app-state
VITE_FEEDBACK_EMAIL=오류 제보를 받을 이메일
```

로컬 브라우저에서 서버 DB 동기화를 테스트할 때는 앱인토스 `getAnonymousKey()`를 받을 수 없으므로 개발 전용 식별키를 사용할 수 있어요.

```bash
VITE_DEV_ANONYMOUS_KEY=local-dev-user
```

이 값은 개발용으로만 사용하고 production 빌드 환경에는 넣지 마세요.

### Render PostgreSQL 동기화

`render.yaml`은 `vocachip-postgres` 데이터베이스를 만들고, Web Service의 `DATABASE_URL`에 internal connection string을 연결하도록 설정되어 있어요. 서버는 시작 후 첫 단어장 동기화 요청에서 아래 테이블을 자동으로 생성해요.

- `app_users`: 앱인토스 사용자 식별키의 해시값 저장
- `app_state`: 단어장, 검색 기록, 학습 기록, 화면 모드 저장

클라이언트는 앱인토스 `getAnonymousKey()`로 사용자를 식별하고, 최초 실행 시 로컬 데이터를 서버로 1회 마이그레이션한 뒤 이후 변경사항을 서버 DB에 저장해요. DB나 사용자 식별키를 사용할 수 없는 환경에서는 기존 localStorage 저장 방식으로 동작해요.

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
