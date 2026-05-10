export interface DictionarySearchDefinition {
  meaning: string;
  translatedMeaning: string | null;
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
}

export type SearchStatus = "idle" | "loading" | "success" | "empty" | "error";

export type AiExampleStatus = "idle" | "loading" | "success" | "error";

export interface AiGeneratedExample {
  sentence: string;
  partOfSpeech: string;
  meaning: string;
  sectionIndex: number;
  itemIndex: number;
}
