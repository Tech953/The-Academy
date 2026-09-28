import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

const localTerminalLineDeclaration = /\b(?:interface|type)\s+TerminalLine\b/;
const sharedTerminalLineImport =
  /import\s+type\s*\{\s*TerminalLine\s*\}\s*from\s*["'][^"']*terminalLine["']/;

const terminalComponents = [
  ["AcademyGameLayout", "../components/AcademyGameLayout.tsx"],
  ["TerminalInterface", "../components/TerminalInterface.tsx"],
  ["TextCharacterCreation", "../components/TextCharacterCreation.tsx"],
] as const;

describe("shared TerminalLine contract", () => {
  it("re-exports the canonical type from game state", () => {
    const source = readSource("./gameState.ts");

    expect(source).toMatch(
      /export\s+type\s*\{\s*TerminalLine\s*\}\s*from\s*["']\.\/terminalLine["']/,
    );
    expect(source).not.toMatch(localTerminalLineDeclaration);
  });

  it.each(terminalComponents)(
    "%s imports the shared type instead of declaring a local copy",
    (_name, relativePath) => {
      const source = readSource(relativePath);

      expect(source).toMatch(sharedTerminalLineImport);
      expect(source).not.toMatch(localTerminalLineDeclaration);
    },
  );
});