import { Badge, Button, Loader, SegmentedControl } from "@toss/tds-mobile";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

import type { DictionaryMode } from "../../core/state/types";
import type { AiExampleStatus, AiGeneratedExample, DictionarySearchDefinition, DictionarySearchResult, SearchStatus } from "./types";

const AI_EXAMPLE_LOADER_STYLE = {
	"--label-color": "var(--search-ai-example-loader-label)",
} as CSSProperties;

interface SearchScreenProps {
	searchQuery: string;
	onChangeSearchQuery: (value: string) => void;
	onSubmitSearch: (query: string) => void;
	searchStatus: SearchStatus;
	searchResult: DictionarySearchResult | null;
	searchHistory: string[];
	emptySuggestions: string[];
	dictionaryMode: DictionaryMode;
	onSelectDictionaryMode: (mode: DictionaryMode) => void;
	isSaved: boolean;
	isPronouncingResult: boolean;
	aiExampleStatus: AiExampleStatus;
	isAiMeaningLoading: boolean;
	aiGeneratedExamples: AiGeneratedExample[];
	onSaveResult: () => void;
	onSpeakResult: (word: string, audioUrl?: string | null) => void;
	onGenerateAiExample: () => void;
	onSelectHistory: (query: string) => void;
	onClearHistory: () => void;
}

function SearchIcon({ icon }: { icon: "clear" | "submit" | "sound" | "ai" | "bookmark" | "clock" | "warning" | "trash" }) {
	if (icon === "clear") {
		return (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
				<path d="M9.2 9.2L14.8 14.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
				<path d="M14.8 9.2L9.2 14.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
			</svg>
		);
	}

	if (icon === "sound") {
		return (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M5 14.5H8L12.5 18V6L8 9.5H5V14.5Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
				<path d="M15.5 9C16.4 9.7 17 10.8 17 12C17 13.2 16.4 14.3 15.5 15" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
			</svg>
		);
	}

	if (icon === "bookmark") {
		return (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M8 5.5H16C17.1 5.5 18 6.4 18 7.5V18.2L12 14.4L6 18.2V7.5C6 6.4 6.9 5.5 8 5.5Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
			</svg>
		);
	}

	if (icon === "clock") {
		return (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
				<path d="M12 8V12L14.8 13.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
			</svg>
		);
	}

	if (icon === "warning") {
		return (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M12 6.5L18.5 17.5H5.5L12 6.5Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
				<path d="M12 10.2V13.3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
				<circle cx="12" cy="16" r="1" fill="currentColor" />
			</svg>
		);
	}

	if (icon === "trash") {
		return (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M8.5 7.5H15.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
				<path d="M9.5 7.5V6.5C9.5 5.95 9.95 5.5 10.5 5.5H13.5C14.05 5.5 14.5 5.95 14.5 6.5V7.5" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
				<path d="M7.5 9L8.2 17.1C8.28 18.03 9.06 18.75 10 18.75H14C14.94 18.75 15.72 18.03 15.8 17.1L16.5 9" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
			</svg>
		);
	}

	if (icon === "submit") {
		return (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<circle cx="10.5" cy="10.5" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
				<path d="M14.2 14.2L18 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
			</svg>
		);
	}

	return (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path d="M12 4.8L13.8 9.3L18.4 11.1L13.8 12.9L12 17.4L10.2 12.9L5.6 11.1L10.2 9.3L12 4.8Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
		</svg>
	);
}

export function SearchScreen({
	searchQuery,
	onChangeSearchQuery,
	onSubmitSearch,
	searchStatus,
	searchResult,
	searchHistory,
	emptySuggestions,
	dictionaryMode,
	onSelectDictionaryMode,
	isSaved,
	isPronouncingResult,
	aiExampleStatus,
	isAiMeaningLoading,
	aiGeneratedExamples,
	onSaveResult,
	onSpeakResult,
	onGenerateAiExample,
	onSelectHistory,
	onClearHistory,
}: SearchScreenProps) {
	const [isClearHistoryDialogOpen, setIsClearHistoryDialogOpen] = useState(false);
	const historyItems = searchHistory;
	const searchDisplaySections = searchResult === null ? [] : searchResult.sections;
	const hasSearchActivity = searchStatus !== "idle";
	const searchModeLabel = dictionaryMode === "ko-en" ? "한영" : "영영";
	const isGeneratingAiExample = aiExampleStatus === "loading";
	const isSearchLoading = searchStatus === "loading";
	const areAiExamplesVisible = aiExampleStatus === "success" && aiGeneratedExamples.length > 0;
	const aiExampleButtonLabel = isGeneratingAiExample ? "AI 예문 생성 중" : areAiExamplesVisible ? "AI 예문 숨기기" : "AI 예문 보기";

	useEffect(() => {
		if (searchStatus !== "loading") {
			return;
		}

		const frameId = window.requestAnimationFrame(() => {
			window.scrollTo({ top: 0, behavior: "auto" });
		});

		return () => {
			window.cancelAnimationFrame(frameId);
		};
	}, [searchQuery, searchStatus]);

	function handleConfirmClearHistory() {
		onClearHistory();
		setIsClearHistoryDialogOpen(false);
	}

	function getDefinitionMeaning(item: DictionarySearchDefinition) {
		if (dictionaryMode === "en-en") {
			return item.meaning;
		}

		const translatedMeaning = item.translatedMeaning?.trim() ?? "";

		if (translatedMeaning.length > 0) {
			return translatedMeaning;
		}

		return item.meaning;
	}

	function getAiExample(sectionIndex: number, itemIndex: number) {
		return aiGeneratedExamples.find((example) => example.sectionIndex === sectionIndex && example.itemIndex === itemIndex) ?? null;
	}

	return (
		<>
			<section className={`content-card search-compose-card ${hasSearchActivity ? "search-compose-card--active" : ""}`}>
				<form
					className={`search-compose-form ${hasSearchActivity ? "search-compose-form--active" : ""}`}
					onSubmit={(event) => {
						event.preventDefault();
						event.currentTarget.querySelector<HTMLInputElement>("#search-word-input")?.blur();
						onSubmitSearch(searchQuery);
					}}
				>
					<SegmentedControl
						size="large"
						value={dictionaryMode}
						className="dictionary-mode-segmented toss-blue-segmented"
						aria-label="사전 모드 선택"
						onChange={(value) => onSelectDictionaryMode(value as DictionaryMode)}
					>
						<SegmentedControl.Item value="ko-en">한영</SegmentedControl.Item>
						<SegmentedControl.Item value="en-en">영영</SegmentedControl.Item>
					</SegmentedControl>
					<div className={`search-compose-query-row ${hasSearchActivity ? "search-compose-query-row--active" : ""}`}>
						<div className={`search-compose-field ${hasSearchActivity ? "search-compose-field--active" : ""}`}>
							<input
								id="search-word-input"
								className={`search-compose-input ${hasSearchActivity ? "search-compose-input--active" : ""} ${searchQuery.length > 0 ? "search-compose-input--has-clear" : ""}`}
								value={searchQuery}
								onChange={(event) => onChangeSearchQuery(event.target.value)}
								placeholder="검색할 단어를 입력하세요"
								aria-label={`${searchModeLabel} 단어 검색`}
								required
								autoCapitalize="none"
								autoCorrect="off"
								autoComplete="off"
								spellCheck={false}
								inputMode="search"
							/>
							<span className="search-compose-field-actions">
								{searchQuery.length > 0 ? (
									<button className="search-clear-button" type="button" aria-label="검색어 지우기" onClick={() => onChangeSearchQuery("")}>
										<SearchIcon icon="clear" />
									</button>
								) : null}
								<button className="search-compose-inline-submit" aria-label="검색" type="submit">
									<SearchIcon icon="submit" />
								</button>
							</span>
						</div>
					</div>
				</form>

				{searchStatus === "idle" ? (
					<div className="search-quick-panel">
						{historyItems.length > 0 ? (
							<div className="search-quick-section">
								<div className="search-history-panel-header">
									<p className="section-eyebrow search-inline-title">
										<SearchIcon icon="clock" />
										<span>최근 검색</span>
									</p>
									<button className="search-history-clear-button" type="button" aria-label="검색 내역 모두 지우기" onClick={() => setIsClearHistoryDialogOpen(true)}>
										<SearchIcon icon="trash" />
									</button>
								</div>
								<div className="search-history-row search-history-row--compact">
									{historyItems.map((term) => (
										<button key={term} className="search-suggestion-chip" type="button" onClick={() => onSelectHistory(term)}>
											{term}
										</button>
									))}
								</div>
							</div>
						) : null}
					</div>
				) : null}
			</section>

			{isSearchLoading ? (
				<section className="content-card search-empty-card search-loading-card" aria-live="polite">
					<div className="search-state-header" aria-hidden="true">
						<SearchIcon icon="submit" />
					</div>
					<h3>검색 중</h3>
					<div className="search-loading-bar" role="progressbar" aria-label="검색 중">
						<span className="search-loading-bar__fill" />
					</div>
					<p className="search-loading-copy">사전에서 단어를 찾고 있어요.</p>
				</section>
			) : null}

			{searchStatus === "error" ? (
				<section className="content-card search-empty-card">
					<div className="search-state-header search-state-header--warning" aria-hidden="true">
						<SearchIcon icon="warning" />
					</div>
					<h3>검색 실패</h3>
					<Button className="search-feedback-shortcut" onClick={() => onSubmitSearch(searchQuery)} size="medium" variant="weak" color="dark" type="button">
						<span className="tds-button-content">
							<SearchIcon icon="submit" />
							<span>다시 검색</span>
						</span>
					</Button>
				</section>
			) : null}

			{searchStatus === "empty" ? (
				<section className="content-card search-empty-card">
					<div className="search-state-header search-state-header--warning" aria-hidden="true">
						<SearchIcon icon="warning" />
					</div>
					<h3>결과 없음</h3>
					{emptySuggestions.length > 0 ? (
						<div className="search-recovery-block">
							<div className="search-history-row">
								{emptySuggestions.map((term) => (
									<button key={term} className="search-suggestion-chip" type="button" onClick={() => onSelectHistory(term)}>
										{term}
									</button>
								))}
							</div>
						</div>
					) : null}
					<div className="search-empty-actions">
						<Button className="search-feedback-shortcut" aria-label="새 단어 입력" onClick={() => onChangeSearchQuery("")} size="medium" variant="weak" color="dark" type="button">
							<span className="tds-button-content">
								<SearchIcon icon="clear" />
								<span>다시 입력</span>
							</span>
						</Button>
					</div>
				</section>
			) : null}

			{searchStatus === "success" && searchResult !== null ? (
				<article className="search-detail-card search-dictionary-card search-dictionary-card--compact-search">
					<div className="search-result-hero">
						<div className="search-result-lockup">
							<div className="search-result-title-row">
								<div className="search-result-title-main">
									<h2>{searchResult.word}</h2>
									{isSaved ? (
										<Badge size="small" color="blue" variant="weak" className="search-result-status-badge">
											저장됨
										</Badge>
									) : null}
								</div>
								<div className="search-result-actions search-result-title-actions">
									<button
										className={`subtle-button search-result-button search-result-icon-button search-result-ai-button ${areAiExamplesVisible ? "active" : ""} ${isSaved ? "search-result-ai-button--saved-result" : ""}`}
										type="button"
										aria-label={aiExampleButtonLabel}
										aria-busy={isGeneratingAiExample}
										aria-pressed={areAiExamplesVisible}
										onClick={onGenerateAiExample}
										disabled={isGeneratingAiExample}
									>
										<SearchIcon icon="ai" />
									</button>
									<button
										className={`subtle-button search-result-button search-result-icon-button ${isSaved ? "active" : ""}`}
										type="button"
										aria-label={isSaved ? "단어장 저장됨" : "단어장에 저장"}
										onClick={onSaveResult}
										disabled={isSaved}
									>
										<SearchIcon icon="bookmark" />
									</button>
								</div>
							</div>
							<div className="search-result-meta-line">
								{searchResult.phonetic ? <p className="search-result-phonetic">{searchResult.phonetic}</p> : null}
								<button
									className={`subtle-button search-result-button search-result-pronunciation-button ${isPronouncingResult ? "active" : ""}`}
									type="button"
									aria-label="발음 재생"
									aria-pressed={isPronouncingResult}
									onClick={() => onSpeakResult(searchResult.word, searchResult.audioUrl)}
								>
									<SearchIcon icon="sound" />
								</button>
							</div>
						</div>
					</div>

					{aiExampleStatus === "error" ? (
						<p className="search-ai-example-feedback" role="status">
							AI 예문을 만들 수 없어요. 잠시 후 다시 시도해 주세요.
						</p>
					) : null}

					{isAiMeaningLoading ? (
						<p className="search-ai-meaning-feedback" role="status">
							AI가 뜻을 정리하고 있어요.
						</p>
					) : null}

					<div className={`search-definition-region ${isGeneratingAiExample ? "search-definition-region--loading" : ""}`}>
						<div
							className="search-ai-example-loading-popover"
							role={isGeneratingAiExample ? "status" : undefined}
							aria-live={isGeneratingAiExample ? "polite" : undefined}
							aria-hidden={!isGeneratingAiExample}
						>
							<Loader size="medium" type="primary" label="AI 예문을 만들고 있어요" style={AI_EXAMPLE_LOADER_STYLE} />
						</div>

						<div className="search-definition-stack">
							{searchDisplaySections.map((section, sectionIndex) => (
								<section key={section.label} className="search-definition-section">
									<div className="search-definition-heading">
										<div className="search-definition-heading__meta">
											<span className="search-definition-heading__part">{section.label}</span>
										</div>
										<div className="search-definition-rule" />
									</div>
									<div className="search-definition-item-list">
										{section.items.map((item, index) => {
											const displayMeaning = getDefinitionMeaning(item);
											const aiExample = getAiExample(sectionIndex, index);

											return (
												<div key={`${section.label}-${index + 1}`} className="search-definition-item">
													<div className="search-definition-index">{index + 1}</div>
													<div className="search-definition-copy">
														<strong>{displayMeaning}</strong>
														{areAiExamplesVisible && aiExample !== null ? <p className="search-definition-ai-example">{aiExample.sentence}</p> : null}
													</div>
												</div>
											);
										})}
									</div>
								</section>
							))}
						</div>
					</div>
				</article>
			) : null}

			{isClearHistoryDialogOpen ? (
				<div
					className="modal-backdrop"
					role="presentation"
					onClick={(event) => {
						if (event.target === event.currentTarget) {
							setIsClearHistoryDialogOpen(false);
						}
					}}
				>
					<div className="modal-card confirm-modal-card" role="dialog" aria-modal="true" aria-labelledby="search-history-clear-title">
						<h3 id="search-history-clear-title">검색 내역 삭제</h3>
						<div className="modal-actions confirm-modal-actions">
							<Button className="modal-action-button" onClick={() => setIsClearHistoryDialogOpen(false)} size="large" variant="weak" color="dark" type="button">
								취소
							</Button>
							<Button className="modal-action-button" onClick={handleConfirmClearHistory} size="large" color="danger" type="button">
								삭제
							</Button>
						</div>
					</div>
				</div>
			) : null}
		</>
	);
}
