/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_EXAMPLE_ENDPOINT?: string;
  readonly VITE_AI_MEANING_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
