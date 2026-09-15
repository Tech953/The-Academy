import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetsDirectory = path.join(projectRoot, 'dist', 'public', 'assets');
const maxChunkBytes = Number(process.env.MAX_CHUNK_BYTES ?? 700_000);

function javascriptFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...javascriptFiles(entryPath));
    else if (/\.m?js$/i.test(entry.name)) files.push(entryPath);
  }
  return files;
}

function main(): void {
  if (!statSync(assetsDirectory, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`Built assets directory is missing: ${assetsDirectory}`);
  }

  const chunks = javascriptFiles(assetsDirectory).map((filePath) => ({
    filePath,
    bytes: statSync(filePath).size,
  }));
  if (chunks.length === 0) {
    throw new Error(`No JavaScript chunks found in ${assetsDirectory}`);
  }

  const oversized = chunks.filter((chunk) => chunk.bytes > maxChunkBytes);
  if (oversized.length > 0) {
    throw new Error(
      `JavaScript chunk budget exceeded (${maxChunkBytes} bytes): ${oversized
        .map((chunk) => `${path.basename(chunk.filePath)}=${chunk.bytes}`)
        .join(', ')}`,
    );
  }

  const largest = [...chunks].sort((left, right) => right.bytes - left.bytes)[0];
  console.log(
    `✓ JavaScript chunk budget passed (${chunks.length} chunks; largest ${path.basename(
      largest.filePath,
    )}=${largest.bytes} bytes)`,
  );
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Bundle validation failed: ${message}`);
  process.exitCode = 1;
}