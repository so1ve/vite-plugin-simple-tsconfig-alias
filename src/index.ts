import path from "node:path";

import { getTsconfig } from "get-tsconfig";
import type { Plugin } from "vite";

import type { Alias, AliasOptions } from "./types";

export interface TsconfigAliasPluginOptions {
  root?: string;
  configNames?: string[];
}

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function buildStarRegex(pattern: string): { find: RegExp; starCount: number } {
  const parts = pattern.split("*");
  const starCount = parts.length - 1;
  const source = `^${parts.map(escapeRegExp).join("(.*)")}$`;

  return { find: new RegExp(source), starCount };
}

function buildReplacement(target: string, starCount: number): string {
  let replacement = target;
  for (let i = 1; i <= starCount; i += 1) {
    replacement = replacement.replace("*", `$${i}`);
  }

  return replacement;
}

export function parseTsconfigAliases(
  projectRoot: string,
  configNames: string[],
): Alias[] {
  const aliases: Alias[] = [];

  for (const configName of configNames) {
    const tsconfig = getTsconfig(projectRoot, configName);
    if (!tsconfig) {
      continue;
    }

    const { compilerOptions } = tsconfig.config;

    const baseUrl = compilerOptions?.baseUrl ?? projectRoot;
    const paths = compilerOptions?.paths ?? {};

    for (const [from, [firstTarget]] of Object.entries(paths)) {
      if (!firstTarget) {
        continue;
      }

      const absoluteTarget = path.resolve(baseUrl, firstTarget);

      if (!from.includes("*")) {
        aliases.push({
          find: from,
          replacement: absoluteTarget,
        });
        continue;
      }

      const { find, starCount } = buildStarRegex(from);
      aliases.push({
        find,
        replacement: buildReplacement(absoluteTarget, starCount),
      });
    }
  }

  aliases.sort((a, b) => {
    const aLen =
      typeof a.find === "string" ? a.find.length : a.find.source.length;
    const bLen =
      typeof b.find === "string" ? b.find.length : b.find.source.length;

    return bLen - aLen;
  });

  return aliases;
}

export function mergeAliases(
  existing: AliasOptions | undefined,
  incoming: Alias[],
): Alias[] {
  const normalizedExisting: Alias[] = existing
    ? Array.isArray(existing)
      ? [...existing]
      : Object.entries(existing).map(([find, replacement]) => ({
          find,
          replacement,
        }))
    : [];

  return [...incoming, ...normalizedExisting];
}

export default function TsconfigAlias(
  options: TsconfigAliasPluginOptions = {},
): Plugin {
  const root = options.root ?? process.cwd();
  const configNames = options.configNames ?? ["tsconfig.json"];

  return {
    name: "vite-plugin-simple-tsconfig-alias",
    enforce: "pre",
    config(config) {
      const aliases = parseTsconfigAliases(root, configNames);
      config.resolve ??= {};
      config.resolve.alias = mergeAliases(config.resolve.alias, aliases);
    },
  };
}
