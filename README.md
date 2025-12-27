# vite-plugin-simple-tsconfig-alias

[![NPM version](https://img.shields.io/npm/v/vite-plugin-simple-tsconfig-alias?color=a1b858&label=)](https://www.npmjs.com/package/vite-plugin-simple-tsconfig-alias)

A simple Vite plugin to resolve tsconfig paths as aliases.

## 💎 Features

- Reads `compilerOptions.paths` from one or more tsconfig files.
- Supports exact mappings (no `*`), e.g. `"@": ["./src"]`.
- Supports single-star wildcard mappings, e.g. `"@/*": ["./src/*"]`.
  - The `*` is converted to a RegExp capture group on `find` and `$1` replacements.
- Merges aliases into `config.resolve.alias` early (`enforce: "pre"`).
  - Aliases from tsconfig are prepended so they take precedence over existing ones.
- `baseUrl` behavior:
  - If `baseUrl` is set in a tsconfig, targets are resolved relative to it.
  - If not set, targets are resolved relative to that tsconfig's directory.

## 📦 Installation

```bash
$ npm install vite-plugin-simple-tsconfig-alias
$ yarn add vite-plugin-simple-tsconfig-alias
$ pnpm add vite-plugin-simple-tsconfig-alias
```

## 🚀 Usage

### Vite Plugin

```ts
// vite.config.ts
import { defineConfig } from "vite";
import TsconfigAlias from "vite-plugin-simple-tsconfig-alias";

export default defineConfig({
  plugins: [
    TsconfigAlias({
      // Optional: root directory of the project (default: process.cwd())
      root: process.cwd(),
      // Optional: tsconfig file names to read (default: ["tsconfig.json"])
      configNames: ["tsconfig.json", "tsconfig.paths.json"],
    }),
  ],
});
```

### Programmatic API

You can also use the underlying functions to parse and merge aliases manually. This makes it possible to be used in other contexts beyond Vite plugins, like other bundlers that doesn't have a `config` hook.

```ts
import {
  mergeAliases,
  parseTsconfigAliases,
} from "vite-plugin-simple-tsconfig-alias";

// Parse aliases from tsconfig files
const aliases = parseTsconfigAliases(process.cwd(), ["tsconfig.json"]);

// Merge with existing Vite aliases
const finalAliases = mergeAliases(
  [{ find: "@custom", replacement: "./src/custom" }],
  aliases,
);
```

## ⚠️ Limitations

- Only the first target in a `paths` entry is used. If you rely on fallbacks like `"@/*": ["./src/*", "./generated/*"]`, only `./src/*` will be applied.
- Path mapping transforms are only injected into Vite's resolver.
  - TypeScript / vue-tsc still use tsconfig directly; keep tsconfig correct.
- Does not support Vite's `\0` virtual module prefix use cases.
- Wildcard handling is generic regex-based and may be looser than TypeScript's own matching in edge cases (multiple `*` segments, unusual patterns).
- If the tsconfig file can't be read/parsed, it is silently skipped.
- Windows paths: Replacements are absolute filesystem paths produced by Node's `path.resolve`.

## 📝 License

[MIT](./LICENSE). Made with ❤️ by [Ray](https://github.com/so1ve)
