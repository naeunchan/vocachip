export interface DictionarySearchExample {
  text: string;
  source: string | null;
}

export interface DictionarySearchNestedMeaning {
  meaning: string;
  examples: DictionarySearchExample[];
  notes: string[];
}

export interface DictionarySearchSubMeaning {
  meaning: string;
  examples: DictionarySearchExample[];
  notes: string[];
  nestedMeanings?: DictionarySearchNestedMeaning[];
}

export interface DictionarySearchDefinition {
  meaning: string;
  translatedMeaning: string | null;
  translatedSubMeanings?: Array<string | null>;
  subMeanings?: string[];
  subMeaningDetails?: DictionarySearchSubMeaning[];
}

export interface DictionarySearchSection {
  label: string;
  items: DictionarySearchDefinition[];
}

export interface DictionarySearchResult {
  word: string;
  phonetic: string | null;
  audioUrl: string | null;
  sections: DictionarySearchSection[];
  relatedWords: string[];
  hasMoreDefinitions: boolean;
}

export type SearchStatus = "idle" | "loading" | "success" | "empty" | "error";

export type AiExampleStatus = "idle" | "loading" | "success" | "error";

export type DefinitionTranslationStatus = "loading" | "success" | "error";

export interface AiGeneratedExample {
  sentence: string;
  partOfSpeech: string;
  meaning: string;
  sectionIndex: number;
  itemIndex: number;
}

export interface DefinitionTranslationDialog {
  word: string;
  partOfSpeech: string;
  definition: string;
  translatedMeaning: string | null;
  sectionIndex: number;
  itemIndex: number;
  subMeaningIndex?: number | null;
  status: DefinitionTranslationStatus;
}
