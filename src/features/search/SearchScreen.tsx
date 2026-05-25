import { Badge, Button, Loader } from "@toss/tds-mobile";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import { DEFINITION_RENDER_BATCH_SIZE, INITIAL_VISIBLE_DEFINITION_COUNT } from "./displayConfig";
import type { AiExampleStatus, AiGeneratedExample, DefinitionTranslationDialog, DictionarySearchDefinition, DictionarySearchResult, SearchStatus } from "./types";

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
	isSaved: boolean;
	isPronouncingResult: boolean;
	aiExampleStatus: AiExampleStatus;
	definitionTranslationDialog: DefinitionTranslationDialog | null;
	aiGeneratedExamples: AiGeneratedExample[];
	onSaveResult: () => void;
	onSpeakResult: (word: string, audioUrl?: string | null) => void;
	onGenerateAiExample: () => void;
	onRequestDefinitionTranslation: (sectionIndex: number, itemIndex: number) => void;
	onCloseDefinitionTranslation: () => void;
	onSelectHistory: (query: string) => void;
	onClearHistory: () => void;
}

interface VisibleSearchDefinition extends DictionarySearchDefinition {
	sourceItemIndex: number;
}

interface VisibleSearchSection {
	label: string;
	items: VisibleSearchDefinition[];
	sourceSectionIndex: number;
}

interface DefinitionTranslationTarget {
	sectionIndex: number;
	itemIndex: number;
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

function countDefinitions(sections: DictionarySearchResult["sections"]) {
	return sections.reduce((totalCount, section) => totalCount + section.items.length, 0);
}

function createDefinitionRenderKey(result: DictionarySearchResult | null) {
	if (result === null) {
		return "empty";
	}

	return [
		result.word.toLowerCase(),
		...result.sections.flatMap((section) => [
			section.label.toLowerCase(),
			...section.items.map((item) => item.meaning),
		]),
	].join("\u001f");
}

function getVisibleSearchSections(sections: DictionarySearchResult["sections"], visibleDefinitionCount: number): VisibleSearchSection[] {
	let remainingDefinitionCount = visibleDefinitionCount;

	return sections.flatMap((section, sectionIndex) => {
		if (remainingDefinitionCount <= 0) {
			return [];
		}

		const items = section.items.slice(0, remainingDefinitionCount).map((item, itemIndex) => ({
			...item,
			sourceItemIndex: itemIndex,
		}));

		remainingDefinitionCount -= items.length;

		return items.length > 0
			? [
					{
						label: section.label,
						items,
						sourceSectionIndex: sectionIndex,
					},
				]
			: [];
	});
}

function SearchDictionarySkeleton() {
	return (
		<div className="search-ai-meaning-skeleton" aria-hidden="true">
			<div className="search-ai-meaning-skeleton__hero">
				<div className="search-ai-meaning-skeleton__title-row">
					<span className="search-ai-meaning-skeleton__line search-ai-meaning-skeleton__line--title" />
					<div className="search-ai-meaning-skeleton__actions">
						<span className="search-ai-meaning-skeleton__icon" />
						<span className="search-ai-meaning-skeleton__icon" />
					</div>
				</div>
				<span className="search-ai-meaning-skeleton__line search-ai-meaning-skeleton__line--phonetic" />
			</div>
			<div className="search-ai-meaning-skeleton__definition-stack">
				{[0, 1].map((item) => (
					<div className="search-ai-meaning-skeleton__definition" key={item}>
						<span className="search-ai-meaning-skeleton__index" />
						<div className="search-ai-meaning-skeleton__copy">
							<span className="search-ai-meaning-skeleton__line search-ai-meaning-skeleton__line--meaning" />
							<span className="search-ai-meaning-skeleton__line search-ai-meaning-skeleton__line--sub" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function SearchDictionarySpinnerOverlay({ isVisible, label }: { isVisible: boolean; label: string }) {
	return (
		<div
			className="search-ai-meaning-overlay"
			role={isVisible ? "status" : undefined}
			aria-label={isVisible ? label : undefined}
			aria-live={isVisible ? "polite" : undefined}
			aria-hidden={!isVisible}
		>
			<div className="search-ai-meaning-popover">
				<span className="search-toss-spinner" aria-hidden="true" />
			</div>
		</div>
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
	isSaved,
	isPronouncingResult,
	aiExampleStatus,
	definitionTranslationDialog,
	aiGeneratedExamples,
	onSaveResult,
	onSpeakResult,
	onGenerateAiExample,
	onRequestDefinitionTranslation,
	onCloseDefinitionTranslation,
	onSelectHistory,
	onClearHistory,
}: SearchScreenProps) {
	const [isClearHistoryDialogOpen, setIsClearHistoryDialogOpen] = useState(false);
	const [visibleDefinitionCount, setVisibleDefinitionCount] = useState(INITIAL_VISIBLE_DEFINITION_COUNT);
	const [pendingDefinitionTranslationTarget, setPendingDefinitionTranslationTarget] =
		useState<DefinitionTranslationTarget | null>(null);
	const queuedDefinitionTranslationFrameRef = useRef<number | null>(null);
	const queuedDefinitionTranslationTimeoutRef = useRef<number | null>(null);
	const historyItems = searchHistory;
	const searchDisplaySections = searchResult === null ? [] : searchResult.sections;
	const totalDefinitionCount = countDefinitions(searchDisplaySections);
	const visibleSearchDisplaySections = getVisibleSearchSections(searchDisplaySections, visibleDefinitionCount);
	const hasHiddenDefinitions = visibleDefinitionCount < totalDefinitionCount;
	const visibleDefinitionDisplayCount = Math.min(visibleDefinitionCount, totalDefinitionCount);
	const definitionRenderKey = createDefinitionRenderKey(searchResult);
	const hasSearchActivity = searchStatus !== "idle";
	const isGeneratingAiExample = aiExampleStatus === "loading";
	const isSearchLoading = searchStatus === "loading";
	const areAiExamplesVisible = aiExampleStatus === "success" && aiGeneratedExamples.length > 0;
	const aiExampleButtonLabel = isGeneratingAiExample ? "AI 예문 생성 중" : areAiExamplesVisible ? "AI 예문 숨기기" : "AI 예문 보기";
	const pendingDefinitionTranslationDialog =
		pendingDefinitionTranslationTarget === null || searchResult === null
			? null
			: (() => {
					const section = searchResult.sections[pendingDefinitionTranslationTarget.sectionIndex];
					const item = section?.items[pendingDefinitionTranslationTarget.itemIndex];

					if (section === undefined || item === undefined) {
						return null;
					}

					return {
						word: searchResult.word,
						partOfSpeech: section.label,
						definition: item.meaning,
						translatedMeaning: null,
						sectionIndex: pendingDefinitionTranslationTarget.sectionIndex,
						itemIndex: pendingDefinitionTranslationTarget.itemIndex,
						status: "loading" as const,
					};
				})();
	const activeDefinitionTranslationDialog =
		definitionTranslationDialog ?? pendingDefinitionTranslationDialog;

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

	useEffect(() => {
		setVisibleDefinitionCount(INITIAL_VISIBLE_DEFINITION_COUNT);
		setPendingDefinitionTranslationTarget(null);
		clearQueuedDefinitionTranslation();
	}, [definitionRenderKey]);

	useEffect(() => {
		if (definitionTranslationDialog !== null) {
			setPendingDefinitionTranslationTarget(null);
		}
	}, [definitionTranslationDialog]);

	useEffect(() => {
		return () => {
			clearQueuedDefinitionTranslation();
		};
	}, []);

	function handleConfirmClearHistory() {
		onClearHistory();
		setIsClearHistoryDialogOpen(false);
	}

	function handleShowMoreDefinitions() {
		const nextVisibleDefinitionCount = Math.min(visibleDefinitionCount + DEFINITION_RENDER_BATCH_SIZE, totalDefinitionCount);

		setVisibleDefinitionCount(nextVisibleDefinitionCount);
	}

	function getAiExample(sectionIndex: number, itemIndex: number) {
		return aiGeneratedExamples.find((example) => example.sectionIndex === sectionIndex && example.itemIndex === itemIndex) ?? null;
	}

	function clearQueuedDefinitionTranslation() {
		if (queuedDefinitionTranslationFrameRef.current !== null) {
			window.cancelAnimationFrame(queuedDefinitionTranslationFrameRef.current);
			queuedDefinitionTranslationFrameRef.current = null;
		}

		if (queuedDefinitionTranslationTimeoutRef.current !== null) {
			window.clearTimeout(queuedDefinitionTranslationTimeoutRef.current);
			queuedDefinitionTranslationTimeoutRef.current = null;
		}
	}

	function isSameDefinitionTranslationTarget(
		target: DefinitionTranslationTarget | null,
		sectionIndex: number,
		itemIndex: number,
	) {
		return target?.sectionIndex === sectionIndex && target.itemIndex === itemIndex;
	}

	function handleRequestDefinitionTranslation(
		sectionIndex: number,
		itemIndex: number,
	) {
		clearQueuedDefinitionTranslation();
		setPendingDefinitionTranslationTarget({ sectionIndex, itemIndex });

		queuedDefinitionTranslationFrameRef.current = window.requestAnimationFrame(() => {
			queuedDefinitionTranslationFrameRef.current = null;
			queuedDefinitionTranslationTimeoutRef.current = window.setTimeout(() => {
				queuedDefinitionTranslationTimeoutRef.current = null;
				onRequestDefinitionTranslation(sectionIndex, itemIndex);
			}, 0);
		});
	}

	function handleCloseDefinitionTranslation() {
		clearQueuedDefinitionTranslation();
		setPendingDefinitionTranslationTarget(null);
		onCloseDefinitionTranslation();
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
					<div className={`search-compose-query-row ${hasSearchActivity ? "search-compose-query-row--active" : ""}`}>
						<div className={`search-compose-field ${hasSearchActivity ? "search-compose-field--active" : ""}`}>
							<input
								id="search-word-input"
								className={`search-compose-input ${hasSearchActivity ? "search-compose-input--active" : ""} ${searchQuery.length > 0 ? "search-compose-input--has-clear" : ""}`}
								value={searchQuery}
								onChange={(event) => onChangeSearchQuery(event.target.value)}
								placeholder="검색할 단어를 입력하세요"
								aria-label="영어 단어 검색"
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
				<article className="search-detail-card search-dictionary-card search-dictionary-card--compact-search search-dictionary-card--ai-meaning-loading" aria-busy="true">
					<SearchDictionarySkeleton />
					<SearchDictionarySpinnerOverlay isVisible={true} label="검색 중" />
				</article>
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
				<article
					className="search-detail-card search-dictionary-card search-dictionary-card--compact-search"
				>
					<div className="search-dictionary-card__content">
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
								{visibleSearchDisplaySections.map((section) => (
									<section key={`${section.label}-${section.sourceSectionIndex}`} className="search-definition-section">
										<div className="search-definition-heading">
											<div className="search-definition-heading__meta">
												<span className="search-definition-heading__part">{section.label}</span>
											</div>
											<div className="search-definition-rule" />
										</div>
										<div className="search-definition-item-list">
											{section.items.map((item, index) => {
												const aiExample = getAiExample(section.sourceSectionIndex, item.sourceItemIndex);
												const isPendingTranslation = isSameDefinitionTranslationTarget(
													pendingDefinitionTranslationTarget,
													section.sourceSectionIndex,
													item.sourceItemIndex,
												);
												const isTranslationLoading =
													isPendingTranslation ||
													(definitionTranslationDialog?.status === "loading" &&
														definitionTranslationDialog.sectionIndex === section.sourceSectionIndex &&
														definitionTranslationDialog.itemIndex === item.sourceItemIndex);
												const hasTranslatedMeaning = (item.translatedMeaning?.trim().length ?? 0) > 0;

												return (
													<div key={`${section.label}-${index + 1}`} className="search-definition-item">
														<div className="search-definition-index">{index + 1}</div>
														<div className="search-definition-copy">
															<div className="search-definition-copy__header">
																<strong>{item.meaning}</strong>
																<button
																	className="search-definition-translate-button"
																	type="button"
																	aria-label={`${section.label} ${index + 1}번 뜻 한글 번역 보기`}
																	aria-busy={isTranslationLoading}
																	onClick={() => handleRequestDefinitionTranslation(section.sourceSectionIndex, item.sourceItemIndex)}
																	disabled={isTranslationLoading}
																>
																	{isTranslationLoading ? <span className="search-definition-more-spinner" aria-hidden="true" /> : null}
																	<span>{isTranslationLoading ? "번역 중" : hasTranslatedMeaning ? "번역 보기" : "번역"}</span>
																</button>
															</div>
															{areAiExamplesVisible && aiExample !== null ? <p className="search-definition-ai-example">{aiExample.sentence}</p> : null}
														</div>
													</div>
												);
											})}
										</div>
									</section>
								))}
								{hasHiddenDefinitions ? (
									<button className="search-definition-more-button" type="button" onClick={handleShowMoreDefinitions}>
										<span>뜻 더 보기</span>
										<span>{visibleDefinitionDisplayCount} / {totalDefinitionCount}</span>
									</button>
								) : null}
							</div>
						</div>
					</div>
				</article>
			) : null}

			{activeDefinitionTranslationDialog !== null ? (
				<div
					className="modal-backdrop"
					role="presentation"
					onClick={(event) => {
						if (event.target === event.currentTarget) {
							handleCloseDefinitionTranslation();
						}
					}}
				>
					<div className="modal-card search-translation-modal-card" role="dialog" aria-modal="true" aria-labelledby="search-translation-title">
						<div className="search-translation-modal__header">
							<div>
								<h3 id="search-translation-title">한글 번역</h3>
								<p>{activeDefinitionTranslationDialog.word} · {activeDefinitionTranslationDialog.partOfSpeech}</p>
							</div>
							<button className="search-translation-modal__close" type="button" aria-label="번역 닫기" onClick={handleCloseDefinitionTranslation}>
								<SearchIcon icon="clear" />
							</button>
						</div>
						<div className="search-translation-modal__body">
							<p className="search-translation-modal__definition">{activeDefinitionTranslationDialog.definition}</p>
							{activeDefinitionTranslationDialog.status === "loading" ? (
								<div className="search-translation-modal__loader" role="status" aria-live="polite">
									<span className="search-toss-spinner search-translation-modal__spinner" aria-hidden="true" />
									<span className="search-translation-modal__loader-label">번역하고 있어요</span>
								</div>
							) : null}
							{activeDefinitionTranslationDialog.status === "success" ? (
								<strong className="search-translation-modal__meaning">{activeDefinitionTranslationDialog.translatedMeaning}</strong>
							) : null}
							{activeDefinitionTranslationDialog.status === "error" ? (
								<p className="search-translation-modal__error">번역을 만들 수 없어요. 잠시 후 다시 시도해 주세요.</p>
							) : null}
						</div>
						<div className="modal-actions search-translation-modal__actions">
							{activeDefinitionTranslationDialog.status === "error" ? (
								<Button
									className="modal-action-button"
									onClick={() => handleRequestDefinitionTranslation(activeDefinitionTranslationDialog.sectionIndex, activeDefinitionTranslationDialog.itemIndex)}
									size="large"
									variant="weak"
									color="dark"
									type="button"
								>
									다시 시도
								</Button>
							) : null}
							<Button className="modal-action-button" onClick={handleCloseDefinitionTranslation} size="large" color="dark" type="button">
								닫기
							</Button>
						</div>
					</div>
				</div>
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
