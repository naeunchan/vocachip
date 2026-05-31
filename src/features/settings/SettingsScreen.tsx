import { useState } from "react";

import { Button, SegmentedControl } from "@toss/tds-mobile";

import type { ThemeMode } from "../../core/state/types";
import type { RemoteAppStateStatus } from "../sync/remoteAppState";

interface SettingsScreenProps {
  themeMode: ThemeMode;
  onSelectThemeMode: (mode: ThemeMode) => void;
  savedWordCount: number;
  backupStatus: "idle" | "success" | "error";
  remoteSyncStatus: RemoteAppStateStatus;
  onExportBackup: () => void;
  onReportIssue: () => void;
}

function ThemeModeIcon({ mode }: { mode: ThemeMode }) {
  if (mode === "light") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M12 4.5V6.4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M12 17.6V19.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M19.5 12H17.6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M6.4 12H4.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M17.3 6.7L16 8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M8 16L6.7 17.3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M17.3 17.3L16 16"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M8 8L6.7 6.7"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (mode === "dark") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M15.8 4.7C13.2 5 11.1 7.2 11.1 9.9C11.1 13 13.6 15.5 16.7 15.5C17.4 15.5 18.1 15.4 18.7 15.1C18 17.6 15.7 19.5 13 19.5C9.8 19.5 7.2 16.9 7.2 13.7C7.2 10.8 9.3 8.4 12.1 7.9C13.3 7.7 14.7 7.8 15.8 4.7Z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="5.5"
        y="6"
        width="13"
        height="9.5"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9.5 18.5H14.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

const PRIVACY_AI_NOTICE_SECTIONS = [
  {
    title: "처리하는 정보",
    items: [
      "앱인토스 사용자 식별키의 해시값",
      "사용자가 검색한 단어와 선택한 뜻",
      "저장한 단어, 검색 기록, 학습 기록",
      "API 요청 로그의 IP, User-Agent, Origin, 요청 경로, 응답 상태, 처리 시간",
    ],
  },
  {
    title: "사용 목적",
    items: [
      "단어 뜻 검색과 검색 결과 표시",
      "선택한 뜻의 한글 번역과 AI 예문 생성",
      "오류 분석, 악용 방지, API 요청 제한 적용",
      "단어장 백업 파일 생성",
    ],
  },
  {
    title: "외부 서비스",
    items: [
      "Merriam-Webster 사전 API로 단어 뜻을 조회할 수 있어요.",
      "OpenAI API로 선택한 뜻의 번역과 예문 생성을 요청할 수 있어요.",
      "Render 서버와 PostgreSQL DB에서 단어장 동기화와 운영 로그를 처리할 수 있어요.",
    ],
  },
  {
    title: "저장과 삭제",
    items: [
      "단어장과 학습 기록은 이 기기의 브라우저 저장소와 서버 DB에 저장될 수 있어요.",
      "브라우저 데이터 삭제 시 이 기기의 캐시는 제거되지만, 서버 동기화 데이터는 남아 있을 수 있어요.",
      "서버 로그 보관 기간과 외부 API의 데이터 처리는 각 운영 정책을 따라요.",
    ],
  },
  {
    title: "AI 결과 유의사항",
    items: [
      "AI 번역과 예문은 학습 참고용이며, 항상 정확하지 않을 수 있어요.",
      "검색어나 예문 요청에 민감정보를 입력하지 않는 것을 권장해요.",
      "부정확하거나 어색한 결과는 오류 제보로 알려줄 수 있어요.",
    ],
  },
];

const remoteSyncStatusLabels: Record<RemoteAppStateStatus, string> = {
  idle: "동기화 대기 중",
  loading: "서버와 동기화 중",
  synced: "서버 DB와 동기화됨",
  "local-only": "이 기기에만 저장 중",
  error: "서버 동기화 실패",
};

export function SettingsScreen({
  themeMode,
  onSelectThemeMode,
  savedWordCount,
  backupStatus,
  remoteSyncStatus,
  onExportBackup,
  onReportIssue,
}: SettingsScreenProps) {
  const [isPrivacyNoticeOpen, setIsPrivacyNoticeOpen] = useState(false);
  const themeItems = [
    { key: "system" as const, label: "시스템" },
    { key: "light" as const, label: "라이트" },
    { key: "dark" as const, label: "다크" },
  ];

  return (
    <>
      <section className="content-card settings-panel-card settings-theme-card">
        <div className="settings-panel-header">
          <h3>화면 모드</h3>
        </div>

        <SegmentedControl
          size="large"
          value={themeMode}
          className="dictionary-mode-segmented toss-blue-segmented"
          aria-label="화면 모드 선택"
          onChange={(value) => onSelectThemeMode(value as ThemeMode)}
        >
          {themeItems.map((item) => (
            <SegmentedControl.Item
              key={item.key}
              value={item.key}
              aria-label={`화면 모드 ${item.label}`}
            >
              <span className="settings-theme-segment" aria-hidden="true">
                <ThemeModeIcon mode={item.key} />
              </span>
              <span>{item.label}</span>
            </SegmentedControl.Item>
          ))}
        </SegmentedControl>
      </section>

      <section className="content-card settings-panel-card">
        <div className="settings-panel-header">
          <h3>데이터 및 AI 안내</h3>
        </div>
        <div className="settings-info-list settings-policy-summary">
          <p>
            검색어와 선택한 뜻은 사전 API와 AI API 처리에 사용될 수 있어요.
          </p>
          <p>
            AI 번역과 예문은 학습 보조용이며, 실제 의미와 다를 수 있어요.
          </p>
          <p>
            단어장과 학습 기록은 이 기기와 서버 DB에 동기화될 수 있어요.
          </p>
        </div>
        <p
          className={`settings-sync-status settings-sync-status--${remoteSyncStatus}`}
          role="status"
        >
          {remoteSyncStatusLabels[remoteSyncStatus]}
        </p>
        <Button
          className="settings-action-button settings-privacy-notice-button"
          size="large"
          variant="fill"
          color="primary"
          type="button"
          onClick={() => setIsPrivacyNoticeOpen(true)}
        >
          개인정보 및 AI 안내 보기
        </Button>
      </section>

      <section className="content-card settings-panel-card">
        <div className="settings-panel-header">
          <h3>단어장 백업</h3>
        </div>
        <p className="settings-helper-text">
          저장된 단어 {savedWordCount}개를 JSON 파일로 내보낼 수 있어요.
        </p>
        <Button
          className="settings-action-button"
          size="large"
          color="dark"
          type="button"
          onClick={onExportBackup}
        >
          단어장 내보내기
        </Button>
        {backupStatus === "success" ? (
          <p className="settings-status-text" role="status">
            백업 파일을 만들었어요.
          </p>
        ) : null}
        {backupStatus === "error" ? (
          <p className="settings-status-text settings-status-text--error" role="alert">
            백업 파일을 만들 수 없어요.
          </p>
        ) : null}
      </section>

      <section className="content-card settings-panel-card">
        <div className="settings-panel-header">
          <h3>오류 제보</h3>
        </div>
        <p className="settings-helper-text">
          검색 결과가 비어 보이거나 번역이 어색하면 현재 단어와 상황을 함께 알려주세요.
        </p>
        <Button
          className="settings-action-button"
          size="large"
          variant="weak"
          color="dark"
          type="button"
          onClick={onReportIssue}
        >
          오류 제보하기
        </Button>
      </section>

      {isPrivacyNoticeOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsPrivacyNoticeOpen(false);
            }
          }}
        >
          <div
            className="modal-card privacy-ai-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-ai-notice-title"
          >
            <div className="privacy-ai-modal__header">
              <div>
                <h3 id="privacy-ai-notice-title">개인정보 및 AI 안내</h3>
                <p>최종 업데이트: 2026.05.31</p>
              </div>
            </div>
            <p className="privacy-ai-modal__intro">
              VocaChip은 영어 단어 학습을 돕기 위해 사전 API와 AI API를
              사용할 수 있고, 저장한 단어와 학습 기록을 서버 DB와 동기화할 수
              있어요. 아래 내용은 앱에서 어떤 데이터가 사용되는지와 AI 결과를
              어떻게 이해해야 하는지 설명해요.
            </p>
            <div className="privacy-ai-modal__sections">
              {PRIVACY_AI_NOTICE_SECTIONS.map((section) => (
                <section className="privacy-ai-modal__section" key={section.title}>
                  <h4>{section.title}</h4>
                  <ul>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <div className="modal-actions privacy-ai-modal__actions">
              <Button
                className="modal-action-button"
                onClick={() => setIsPrivacyNoticeOpen(false)}
                size="large"
                color="dark"
                type="button"
              >
                확인했어요
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
