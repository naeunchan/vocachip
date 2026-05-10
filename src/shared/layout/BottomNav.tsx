import { screenMeta } from "../../core/state/constants";
import type { ScreenKey } from "../../core/state/types";

interface BottomNavProps {
  activeScreen: ScreenKey;
  compact?: boolean;
  onSelectScreen: (screen: ScreenKey) => void;
}

function NavIcon({ screen }: { screen: ScreenKey }) {
  if (screen === "wordbook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6 4.5H17.5C18.3284 4.5 19 5.17157 19 6V19.5L12.5 16.75L6 19.5V4.5Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (screen === "settings") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 7.8C9.68 7.8 7.8 9.68 7.8 12C7.8 14.32 9.68 16.2 12 16.2C14.32 16.2 16.2 14.32 16.2 12C16.2 9.68 14.32 7.8 12 7.8Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M12 4.8V6.3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M12 17.7V19.2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M19.2 12H17.7"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M6.3 12H4.8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M17.1 6.9L16 8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M8 16L6.9 17.1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M17.1 17.1L16 16"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M8 8L6.9 6.9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="10"
        cy="10"
        r="5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M14.5 14.5L19 19"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function BottomNav({
  activeScreen,
  compact = false,
  onSelectScreen,
}: BottomNavProps) {
  return (
    <nav className={`bottom-nav ${compact ? "bottom-nav--compact" : ""}`}>
      {(Object.keys(screenMeta) as ScreenKey[]).map((screen) => (
        <button
          key={screen}
          className={`nav-item ${activeScreen === screen ? "active" : ""}`}
          type="button"
          aria-label={screenMeta[screen].label}
          onClick={() => onSelectScreen(screen)}
        >
          <NavIcon screen={screen} />
          <span className="nav-label">{screenMeta[screen].label}</span>
        </button>
      ))}
    </nav>
  );
}
