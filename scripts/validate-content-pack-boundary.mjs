#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const sourceRoots = ["artifacts", "lib", "scripts"];
const canonicalFile = path.join("lib", "game-engine", "src", "contentPack.ts");
const sharedModule = "@workspace/game-engine";
const protectedNames = [
  "ContentPack",
  "ContentPackEvent",
  "PackWorldEvent",
  "PackNpcMood",
  "PackGEDFocus",
];

const declarationPatterns = [
  new RegExp(
    `^\\s*(?:export\\s+)?interface\\s+(${protectedNames.join("|")})\\b`,
    "gm",
  ),
  new RegExp(
    `^\\s*(?:export\\s+)?type\\s+(${protectedNames.join("|")})\\s*=`,
    "gm",
  ),
];

const requiredImports = [
  {
    file: path.join("artifacts", "api-server", "src", "routes", "routes.ts"),
    names: ["ContentPack", "PACK_TTL_MS"],
  },
  {
    file: path.join("artifacts", "academy-mobile", "lib", "api.ts"),
    names: ["ContentPack"],
  },
  {
    file: path.join("artifacts", "academy-mobile", "lib", "contentPackFallback.ts"),
    names: ["ContentPack", "ContentPackEvent", "PACK_ACTIVE_EVENT_LIMIT", "CONTENT_PACK_STORAGE_KEY"],
  },
];

const requiredTypeReexports = {
  file: path.join("artifacts", "academy-mobile", "lib", "api.ts"),
  names: ["ContentPackEvent", "PackGEDFocus", "PackNpcMood", "PackWorldEvent"],
};

async function sourceFilesIn(directory) {
  const entries = await readdir(path.join(rootDir, directory), { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") {
      continue;
    }
    const relativePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await sourceFilesIn(relativePath));
    } else if (/\.(?:ts|tsx|js|mjs)$/.test(entry.name)) {
      files.push(relativePath);
    }
  }

  return files;
}

function importedNames(source, moduleName) {
  const names = new Set();
  const importPattern = /import\s+(?:type\s+)?\{([\s\S]*?)\}\s+from\s+["']([^"']+)["']/g;

  for (const match of source.matchAll(importPattern)) {
    if (match[2] !== moduleName) continue;
    for (const specifier of match[1].split(",")) {
      const importedName = specifier.trim().split(/\s+as\s+/)[0];
      if (importedName) names.add(importedName);
    }
  }

  return names;
}

const files = (
  await Promise.all(sourceRoots.map(sourceRoot => sourceFilesIn(sourceRoot)))
).flat();
const violations = [];

for (const file of files) {
  const source = await readFile(path.join(rootDir, file), "utf8");
  if (file !== canonicalFile) {
    for (const declarationPattern of declarationPatterns) {
      for (const match of source.matchAll(declarationPattern)) {
        violations.push(`${file}: local ${match[1]} declaration`);
      }
    }
  }
}

for (const requirement of requiredImports) {
  const source = await readFile(path.join(rootDir, requirement.file), "utf8");
  const names = importedNames(source, sharedModule);
  for (const name of requirement.names) {
    if (!names.has(name)) {
      violations.push(`${requirement.file}: missing ${name} import from ${sharedModule}`);
    }
  }
}

const reexportSource = await readFile(
  path.join(rootDir, requiredTypeReexports.file),
  "utf8",
);
const exportedNames = new Set();
for (const match of reexportSource.matchAll(
  /export\s+type\s+\{([\s\S]*?)\}\s+from\s+["']([^"']+)["']/g,
)) {
  if (match[2] !== sharedModule) continue;
  for (const specifier of match[1].split(",")) {
    const exportedName = specifier.trim().split(/\s+as\s+/)[0];
    if (exportedName) exportedNames.add(exportedName);
  }
}
for (const name of requiredTypeReexports.names) {
  if (!exportedNames.has(name)) {
    violations.push(`${requiredTypeReexports.file}: missing ${name} re-export from ${sharedModule}`);
  }
}

const compatibilityEntry = path.join("artifacts", "api-server", "src", "shared", "contentPack.ts");
const compatibilitySource = await readFile(path.join(rootDir, compatibilityEntry), "utf8");
if (!/export\s+\*\s+from\s+['"]@workspace\/game-engine['"]/.test(compatibilitySource)) {
  violations.push(`${compatibilityEntry}: must re-export the shared content-pack module`);
}

if (violations.length > 0) {
  console.error("Content-pack boundary validation failed:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log("Content-pack boundary validation passed.");
}