# React Project Structure Guide

이 문서는 현재 React 프로젝트에 일관된 폴더 구조를 적용하기 위한 기준 문서다.  
Codex는 아래 규칙을 우선적으로 따르고, 새로운 파일 생성/수정 시 반드시 이 구조를 준수한다.

---

## 1. 목표

- 기능 중심(feature-based) 구조를 사용한다.
- 공통 요소와 도메인 요소를 명확히 분리한다.
- 유지보수성과 확장성을 높인다.
- 파일 위치를 예측 가능하게 만든다.
- 불필요한 중복을 줄인다.

---

## 2. 기본 원칙

### 2-1. 기능 중심 구조

- 도메인/기능별 코드는 `src/features` 아래에 둔다.
- 예: 검색, 인증, 단어, 퀴즈, 사용자 등

### 2-2. 공통 요소 분리

- 여러 기능에서 재사용되는 UI는 `src/components/common` 에 둔다.
- 레이아웃 관련 컴포넌트는 `src/components/layout` 에 둔다.
- 전역 커스텀 훅은 `src/hooks` 에 둔다.
- 전역 유틸 함수는 `src/utils` 에 둔다.

### 2-3. 페이지와 기능 분리

- 라우팅 단위 화면은 `src/pages` 에 둔다.
- 페이지 내부에서 사용하는 비즈니스 로직은 최대한 `src/features` 로 분리한다.

### 2-4. 파일 책임 최소화

- 한 파일에는 하나의 주요 책임만 둔다.
- 컴포넌트, 훅, API, 타입, 유틸을 역할별로 나눈다.

### 2-5. 전역 상태 최소화

- 전역 상태는 꼭 필요한 경우에만 사용한다.
- 기능 내부에서 해결 가능한 상태는 feature 내부에 둔다.

---

## 3. 최종 폴더 구조

```bash
src/
├── app/
│   ├── providers/
│   ├── router/
│   └── store/
│
├── pages/
│   ├── Home/
│   │   └── HomePage.tsx
│   ├── Search/
│   │   └── SearchPage.tsx
│   └── NotFound/
│       └── NotFoundPage.tsx
│
├── features/
│   ├── auth/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── search/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── word/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── quiz/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   │
│   └── user/
│       ├── api/
│       ├── components/
│       ├── hooks/
│       ├── types/
│       └── utils/
│
├── components/
│   ├── common/
│   └── layout/
│
├── hooks/
├── services/
├── utils/
├── constants/
├── types/
├── assets/
├── styles/
├── App.tsx
└── main.tsx
```
