import path from "node:path";

import { describe, expect, it } from "vitest";

import TsconfigAlias, { mergeAliases, parseTsconfigAliases } from "../src";

const fixturesDir = path.resolve(__dirname, "fixtures");

describe("parseTsconfigAliases", () => {
  it("should parse exact and wildcard mappings", () => {
    const aliases = parseTsconfigAliases(fixturesDir, ["tsconfig.json"]);

    // Sort order: longer matches first
    // "@/*" (4) and "~/*" (4) are same length, then "@" (1)
    expect(aliases).toHaveLength(3);

    const atWildcard = aliases.find(
      (a) => a.find instanceof RegExp && a.find.source.includes("@"),
    );

    expect(atWildcard?.find).toBeInstanceOf(RegExp);
    expect(atWildcard?.replacement).toContain(path.join("src", "$1"));

    const atExact = aliases.find((a) => a.find === "@");

    expect(atExact?.replacement).toContain(path.join("src", "index.ts"));
  });

  it("should handle baseUrl correctly", () => {
    const aliases = parseTsconfigAliases(fixturesDir, ["tsconfig.sub.json"]);

    expect(aliases).toHaveLength(1);
    expect(aliases[0].replacement).toContain(path.join("src", "utils", "$1"));
  });

  it("should merge multiple config files", () => {
    const aliases = parseTsconfigAliases(fixturesDir, [
      "tsconfig.json",
      "tsconfig.sub.json",
    ]);

    expect(aliases.length).toBeGreaterThan(3);
    expect(aliases.some((a) => a.replacement.includes("utils"))).toBeTruthy();
  });

  it("should sort aliases by length descending", () => {
    const aliases = parseTsconfigAliases(fixturesDir, ["tsconfig.json"]);
    const sources = aliases.map((a) =>
      typeof a.find === "string" ? a.find.length : a.find.source.length,
    );
    const sortedSources = [...sources].sort((a, b) => b - a);

    expect(sources).toEqual(sortedSources);
  });
});

describe("mergeAliases", () => {
  it("should merge with existing array aliases", () => {
    const existing = [{ find: "old", replacement: "path" }];
    const incoming = [{ find: "new", replacement: "path2" }];
    const merged = mergeAliases(existing, incoming);

    expect(merged).toEqual([...incoming, ...existing]);
  });

  it("should merge with existing object aliases", () => {
    const existing = { old: "path" };
    const incoming = [{ find: "new", replacement: "path2" }];
    const merged = mergeAliases(existing, incoming);

    expect(merged).toEqual([
      { find: "new", replacement: "path2" },
      { find: "old", replacement: "path" },
    ]);
  });

  it("should handle undefined existing aliases", () => {
    const incoming = [{ find: "new", replacement: "path2" }];
    const merged = mergeAliases(undefined, incoming);

    expect(merged).toEqual(incoming);
  });
});

describe("TsconfigAlias plugin", () => {
  it("should have correct name and enforce", () => {
    const plugin = TsconfigAlias();

    expect(plugin.name).toBe("vite-plugin-simple-tsconfig-alias");
    expect(plugin.enforce).toBe("pre");
  });

  it("should update config.resolve.alias", () => {
    const plugin = TsconfigAlias({
      root: fixturesDir,
      configNames: ["tsconfig.json"],
    });
    const config = {
      resolve: { alias: [{ find: "existing", replacement: "path" }] },
    };

    (plugin as any).config(config, { command: "serve", mode: "development" });

    expect(config.resolve.alias.length).toBeGreaterThan(1);
    expect(config.resolve.alias[0].find.toString()).toContain("@");
    expect(config.resolve.alias[config.resolve.alias.length - 1].find).toBe(
      "existing",
    );
  });
});
