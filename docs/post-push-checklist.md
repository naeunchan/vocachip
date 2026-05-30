# Commit/Push 이후 진행할 일

이 문서는 `codex/production-hardening` 브랜치를 원격에 올린 뒤 production 배포 전 확인해야 할 일을 정리한다.

## 1. Render 환경변수 확인

Render API 서버에 아래 값을 설정한다.

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
DICTIONARY_API_KEY=
DICTIONARY_API_REFERENCE=collegiate
AI_ALLOWED_ORIGIN=
API_RATE_LIMIT_WINDOW_MS=60000
AI_RATE_LIMIT_MAX=30
DICTIONARY_RATE_LIMIT_MAX=120
```

- `AI_ALLOWED_ORIGIN`에는 API 서버 주소가 아니라 앱 프론트 origin을 넣는다.
- 여러 origin이 필요하면 쉼표로 구분한다.
- Render 로그에 찍히는 `origin` 값을 확인해서 실제 앱 origin과 일치시키는 것이 가장 안전하다.

## 2. 프론트 빌드 환경변수 확인

앱 빌드 환경에 아래 값을 설정한다.

```bash
VITE_AI_MEANING_ENDPOINT=https://vocationary.onrender.com/api/ai/meanings
VITE_AI_EXAMPLE_ENDPOINT=https://vocationary.onrender.com/api/ai/example
VITE_DICTIONARY_ENDPOINT=https://vocationary.onrender.com/api/dictionary/search
VITE_FEEDBACK_EMAIL=
```

- `VITE_FEEDBACK_EMAIL`이 비어 있으면 오류 제보는 GitHub issue 생성 링크로 이동한다.
- 실제 운영에서 받을 이메일이 있으면 `VITE_FEEDBACK_EMAIL`을 설정한다.

## 3. 배포 후 API 상태 확인

Render 배포가 끝나면 아래 항목을 확인한다.

- `/health`가 200으로 응답하는지 확인한다.
- Render 로그에서 `api_request` 로그가 정상적으로 찍히는지 확인한다.
- 허용되지 않은 origin 요청이 403으로 차단되는지 확인한다.
- rate limit 초과 시 429와 `Retry-After` 헤더가 내려오는지 확인한다.

검색 API 스모크 테스트를 실행한다.

```bash
DICTIONARY_TEST_ENDPOINT=https://vocationary.onrender.com/api/dictionary/search npm run test:search
```

## 4. 앱 QA

아래 단어를 검색해 결과가 비어 있지 않고 UI가 유지되는지 확인한다.

- `take`
- `taking`
- `today`
- `glass`
- `core`
- `good`

추가로 아래 동작을 확인한다.

- 단어 검색 결과가 첫 화면에 빠르게 표시되는지
- 뜻 더보기 클릭 시 추가 뜻이 자연스럽게 늘어나는지
- 번역 아이콘 클릭 직후 스피너가 바로 표시되는지
- 번역 팝업에서 한글 뜻이 정상 표시되는지
- iOS WebView에서 빈 화면으로 사라지는 현상이 재발하지 않는지
- 설정 화면의 단어장 백업 내보내기가 정상 동작하는지
- 오류 제보 버튼이 의도한 경로로 이동하는지

## 5. Merriam-Webster 사용 조건 확인

현재 질의해 둔 사전 사용 조건 답변이 오면 아래 항목을 확인한다.

- 상업적 서비스 사용 가능 여부
- 앱 내 출처 또는 로고 표시 필요 여부
- 무료/유료 플랜의 쿼리 제한
- API 응답 데이터 캐싱 가능 여부
- 정의 데이터를 가공해서 앱 UI에 재표시할 수 있는 범위

이 항목이 확정되기 전에는 production 공개 배포를 보류한다.

## 6. 개인정보 및 AI 안내 정리

앱 내 안내 외에도 외부 문서 또는 정책 페이지가 필요한지 결정한다.

- 검색어와 선택한 뜻이 사전 API 및 AI API 처리에 사용될 수 있음을 명시한다.
- AI 번역/예문은 참고용이며 부정확할 수 있음을 명시한다.
- 단어장과 학습 기록이 브라우저 저장소에 저장된다는 점을 명시한다.
- 사용자가 데이터 백업을 직접 내보낼 수 있음을 안내한다.

## 7. 출시 보류 조건

아래 중 하나라도 해당하면 출시를 보류한다.

- Merriam-Webster 사용 조건이 명확하지 않다.
- production origin이 CORS에서 차단된다.
- 검색 API 스모크 테스트가 실패한다.
- iOS WebView에서 검색 후 빈 화면 문제가 재현된다.
- 개인정보/AI 안내가 서비스 노출 기준에 부족하다.
- Render 로그에서 반복적인 5xx 또는 rate limit 오탐이 확인된다.
