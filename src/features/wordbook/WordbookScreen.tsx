import { type CSSProperties, type KeyboardEvent } from "react";
import { Button } from "@toss/tds-mobile";

import type { DictionaryMode, WordbookStage } from "../../core/state/types";
import { type VocabularyEntry } from "../../entities/vocabulary/mockData";

interface WordbookScreenProps {
  wordbookStage: WordbookStage;
  wordbookCounts: Record<WordbookStage, number>;
  onSelectWordbookStage: (stage: WordbookStage) => void;
  currentWord: VocabularyEntry | null;
  dictionaryMode: DictionaryMode;
  showMeaning: boolean;
  isPronouncingWord: boolean;
  onToggleMeaning: () => void;
  onSpeakWord: (word: string, audioUrl?: string | null) => void;
  onNextWord: (wordId: string) => void;
  onApplyRecallFeedback: (wordId: string, feedback: "easy") => void;
  onMoveWordToWordbookStage: (wordId: string, stage: WordbookStage) => void;
  onRemoveFromWordbook: (wordId: string) => void;
  onGoToSearch: () => void;
}

function ActionIcon({
  icon,
}: {
  icon:
    | "eye"
    | "sound"
    | "next"
    | "promote"
    | "search"
    | "check"
    | "delete"
    | "memorize"
    | "review"
    | "mastered"
    | "refresh"
    | "trophy";
}) {
  if (icon === "memorize") {
    return (
      <span className="wordbook-emoji-icon" aria-hidden="true">
        📖
      </span>
    );
  }

  if (icon === "refresh") {
    return (
      <span className="wordbook-emoji-icon" aria-hidden="true">
        👀
      </span>
    );
  }

  if (icon === "check") {
    return (
      <span className="wordbook-emoji-icon" aria-hidden="true">
        ✅
      </span>
    );
  }

  if (icon === "trophy") {
    return (
      <span className="wordbook-emoji-icon" aria-hidden="true">
        🏆
      </span>
    );
  }

  if (icon === "eye") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M2.5 12C4.4 8.7 7.8 6.5 12 6.5C16.2 6.5 19.6 8.7 21.5 12C19.6 15.3 16.2 17.5 12 17.5C7.8 17.5 4.4 15.3 2.5 12Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    );
  }

  if (icon === "sound") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M5 14.5H8L12.5 18V6L8 9.5H5V14.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M15.5 9C16.4 9.7 17 10.8 17 12C17 13.2 16.4 14.3 15.5 15"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M17.8 6.8C19.3 8.2 20.25 10 20.25 12C20.25 14 19.3 15.8 17.8 17.2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (icon === "next") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M10 7.5L14.5 12L10 16.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (icon === "search") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle
          cx="10.5"
          cy="10.5"
          r="4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M14.2 14.2L18 18"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (icon === "promote") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M5.8 8H13.8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M5.8 12H13.8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M5.8 16H11.2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M17.2 8.2V14.2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M14.2 11.2H20.2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (icon === "review") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="7.25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M12 8.3V12L14.7 14.1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (icon === "mastered") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7.5 12.4L10.3 15.2L16.6 8.9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8.5 7.5H15.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M9.5 7.5V6.5C9.5 5.95 9.95 5.5 10.5 5.5H13.5C14.05 5.5 14.5 5.95 14.5 6.5V7.5"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M7.5 9L8.2 17.1C8.28 18.03 9.06 18.75 10 18.75H14C14.94 18.75 15.72 18.03 15.8 17.1L16.5 9"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M10.5 11.25V15.25"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M13.5 11.25V15.25"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function WordbookScreen({
  wordbookStage,
  wordbookCounts,
  onSelectWordbookStage,
  currentWord,
  dictionaryMode,
  showMeaning,
  isPronouncingWord,
  onToggleMeaning,
  onSpeakWord,
  onNextWord,
  onApplyRecallFeedback,
  onMoveWordToWordbookStage,
  onRemoveFromWordbook,
  onGoToSearch,
}: WordbookScreenProps) {
  const meaningActionLabel = showMeaning ? "뜻 숨기기" : "뜻 보기";
  const wordbookStageMeta: Record<
    WordbookStage,
    {
      label: string;
      icon: "memorize" | "refresh" | "check";
      emptyTitle: string;
    }
  > = {
    wordbook: {
      label: "단어장",
      icon: "memorize",
      emptyTitle: "저장된 단어가 없어요.",
    },
    learned: {
      label: "외운 단어장",
      icon: "refresh",
      emptyTitle: "외운 단어가 아직 없어요.",
    },
    wrong: {
      label: "외외운 단어장",
      icon: "check",
      emptyTitle: "완전히 익힌 단어가 아직 없어요.",
    },
  };
  const currentStageMeta = wordbookStageMeta[wordbookStage];
  const stageActionMeta: Record<
    WordbookStage,
    {
      icon: "refresh" | "check" | "trophy";
      tone: "promote" | "success";
      label: string;
    }
  > = {
    wordbook: {
      icon: "refresh",
      tone: "promote",
      label: "외운 단어장으로 이동",
    },
    learned: {
      icon: "check",
      tone: "success",
      label: "외외운 단어장으로 이동",
    },
    wrong: {
      icon: "trophy",
      tone: "success",
      label: "단어장에서 지우기",
    },
  };
  const currentStageAction = stageActionMeta[wordbookStage];
  const currentMeaning =
    currentWord === null
      ? ""
      : dictionaryMode === "ko-en"
        ? currentWord.meaning || currentWord.definition
        : currentWord.definition || currentWord.meaning;
  const currentDefinition =
    currentWord === null
      ? ""
      : dictionaryMode === "ko-en"
        ? currentWord.definition
        : currentWord.meaning;
  const nextActionLabel = "다른 단어 보기";
  const wordbookSearchButtonStyle: CSSProperties & Record<string, string> = {
    "--button-background-color": "#3182F6",
    "--button-gradient-color": "rgba(27, 100, 218, 1)",
    "--button-color": "#FFFFFF",
    "--button-border-radius": "20px",
    "--tds-paragraph-color": "#FFFFFF",
    border: "0",
    boxShadow: "0 10px 22px rgba(49, 130, 246, 0.22)",
  };
  const wordbookStageItems = [
    {
      key: "wordbook" as const,
      label: wordbookStageMeta.wordbook.label,
      icon: wordbookStageMeta.wordbook.icon,
      countLabel: `${wordbookCounts.wordbook}개`,
      ariaLabel: `${wordbookStageMeta.wordbook.label} ${wordbookCounts.wordbook}개`,
    },
    {
      key: "learned" as const,
      label: wordbookStageMeta.learned.label,
      icon: wordbookStageMeta.learned.icon,
      countLabel: `${wordbookCounts.learned}개`,
      ariaLabel: `${wordbookStageMeta.learned.label} ${wordbookCounts.learned}개`,
    },
    {
      key: "wrong" as const,
      label: wordbookStageMeta.wrong.label,
      icon: wordbookStageMeta.wrong.icon,
      countLabel: `${wordbookCounts.wrong}개`,
      ariaLabel: `${wordbookStageMeta.wrong.label} ${wordbookCounts.wrong}개`,
    },
  ];
  const emptyStateTitle = currentStageMeta.emptyTitle;
  const wordbookStagePanelId = "wordbook-stage-panel";
  const activeWordbookTabId = `wordbook-stage-tab-${wordbookStage}`;

  function handleStageAction() {
    if (currentWord === null) {
      return;
    }

    if (wordbookStage === "learned") {
      onMoveWordToWordbookStage(currentWord.id, "wrong");
      return;
    }

    if (wordbookStage === "wrong") {
      onRemoveFromWordbook(currentWord.id);
      return;
    }

    onApplyRecallFeedback(currentWord.id, "easy");
  }

  function handleWordbookStageTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    if (
      event.key !== "ArrowRight" &&
      event.key !== "ArrowLeft" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }

    event.preventDefault();

    const lastIndex = wordbookStageItems.length - 1;
    const nextIndex =
      event.key === "ArrowRight"
        ? currentIndex === lastIndex
          ? 0
          : currentIndex + 1
        : event.key === "ArrowLeft"
          ? currentIndex === 0
            ? lastIndex
            : currentIndex - 1
          : event.key === "Home"
            ? 0
            : lastIndex;
    const nextStage = wordbookStageItems[nextIndex]?.key;

    if (nextStage === undefined) {
      return;
    }

    onSelectWordbookStage(nextStage);

    const nextTab = document.getElementById(`wordbook-stage-tab-${nextStage}`);
    if (nextTab instanceof HTMLButtonElement) {
      nextTab.focus();
    }
  }

  return (
    <>
      <section className="content-card wordbook-tabs-card">
        <div
          className="wordbook-tab-browser"
          role="tablist"
          aria-label="단어장 단계 선택"
        >
          {wordbookStageItems.map((item, index) => (
            <button
              key={item.key}
              id={`wordbook-stage-tab-${item.key}`}
              type="button"
              role="tab"
              className={`wordbook-tab-button wordbook-tab-browser__item ${item.key === wordbookStage ? "active" : ""}`}
              aria-label={item.ariaLabel}
              aria-selected={item.key === wordbookStage}
              aria-controls={wordbookStagePanelId}
              tabIndex={item.key === wordbookStage ? 0 : -1}
              onClick={() => onSelectWordbookStage(item.key)}
              onKeyDown={(event) => handleWordbookStageTabKeyDown(event, index)}
            >
              <span className="wordbook-stage-segment">
                <span className="wordbook-tab-button__label-row">
                  <span
                    className="wordbook-session-chip__icon"
                    aria-hidden="true"
                  >
                    <ActionIcon icon={item.icon} />
                  </span>
                  <span className="wordbook-session-chip__label">
                    {item.label}
                  </span>
                </span>
                <span className="wordbook-session-chip__count">
                  {item.countLabel}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section
        id={wordbookStagePanelId}
        className="wordbook-study-card"
        role="tabpanel"
        aria-labelledby={activeWordbookTabId}
        aria-label={`${currentStageMeta.label} 학습 영역`}
      >
        {currentWord !== null ? (
          <article
            className={`wordbook-word-card wordbook-word-card--${wordbookStage}`}
          >
            <div className="wordbook-word-card__copy">
              <h2>{currentWord.word}</h2>
              {currentWord.phonetic.length > 0 ? (
                <p className="wordbook-word-card__phonetic">
                  {currentWord.phonetic}
                </p>
              ) : null}

              {showMeaning && currentMeaning.length > 0 ? (
                <div className="wordbook-word-card__meaning">
                  <strong>{currentMeaning}</strong>
                  {currentDefinition.length > 0 &&
                  currentDefinition !== currentMeaning ? (
                    <p>{currentDefinition}</p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="wordbook-card-actions">
              <button
                className={`wordbook-card-action ${showMeaning ? "active" : ""}`}
                type="button"
                aria-label={meaningActionLabel}
                onClick={onToggleMeaning}
              >
                <ActionIcon icon="eye" />
                <span className="sr-only">{meaningActionLabel}</span>
              </button>
              <button
                className={`wordbook-card-action wordbook-card-action--sound ${isPronouncingWord ? "active" : ""}`}
                type="button"
                aria-label={isPronouncingWord ? "발음 재생 중" : "발음 듣기"}
                onClick={() =>
                  onSpeakWord(currentWord.word, currentWord.audioUrl)
                }
              >
                <ActionIcon icon="sound" />
                <span className="sr-only">
                  {isPronouncingWord ? "발음 재생 중" : "발음 듣기"}
                </span>
              </button>
              <button
                className="wordbook-card-action"
                type="button"
                aria-label={nextActionLabel}
                onClick={() => onNextWord(currentWord.id)}
              >
                <ActionIcon icon="next" />
                <span className="sr-only">{nextActionLabel}</span>
              </button>
              <button
                className={`wordbook-card-action wordbook-card-action--${currentStageAction.tone}`}
                type="button"
                aria-label={currentStageAction.label}
                onClick={handleStageAction}
              >
                <ActionIcon icon={currentStageAction.icon} />
                <span className="sr-only">{currentStageAction.label}</span>
              </button>
            </div>
          </article>
        ) : (
          <div className="empty-state wordbook-empty-state">
            <div className="wordbook-empty-state__copy">
              <h3>{emptyStateTitle}</h3>
            </div>
            <Button
              className="wordbook-empty-state__button"
              color="primary"
              variant="fill"
              size="large"
              display="full"
              style={wordbookSearchButtonStyle}
              type="button"
              onClick={onGoToSearch}
            >
              <span className="wordbook-empty-state__button-content">
                <span className="wordbook-empty-state__button-lead">
                  <span
                    className="wordbook-empty-state__button-icon"
                    aria-hidden="true"
                  >
                    <ActionIcon icon="search" />
                  </span>
                  <span className="wordbook-empty-state__button-label">
                    단어 검색하기
                  </span>
                </span>
                <span
                  className="wordbook-empty-state__button-arrow"
                  aria-hidden="true"
                >
                  <ActionIcon icon="next" />
                </span>
              </span>
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
