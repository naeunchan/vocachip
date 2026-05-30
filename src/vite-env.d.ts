/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_EXAMPLE_ENDPOINT?: string;
  readonly VITE_AI_MEANING_ENDPOINT?: string;
  readonly VITE_DICTIONARY_ENDPOINT?: string;
  readonly VITE_FEEDBACK_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
