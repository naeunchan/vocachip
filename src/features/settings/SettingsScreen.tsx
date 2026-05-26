import { SegmentedControl } from "@toss/tds-mobile";

import type { ThemeMode } from "../../core/state/types";

interface SettingsScreenProps {
  themeMode: ThemeMode;
  onSelectThemeMode: (mode: ThemeMode) => void;
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

export function SettingsScreen({
  themeMode,
  onSelectThemeMode,
}: SettingsScreenProps) {
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
    </>
  );
}
