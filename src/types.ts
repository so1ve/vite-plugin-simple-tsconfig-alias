// Inline these vite types to avoid dts to have a vite dependency

export interface Alias {
  find: string | RegExp;
  replacement: string;
}

export type AliasOptions = readonly Alias[] | Record<string, string>;
