import { copyFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, "src", "questionnaires");
const targetDir = path.join(rootDir, "public", "questionnaires");

const entries = await readdir(sourceDir, { withFileTypes: true });
const files = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));

await mkdir(targetDir, { recursive: true });

await Promise.all(
  files.map((file) =>
    copyFile(path.join(sourceDir, file), path.join(targetDir, file)),
  ),
);

console.log(
  `[copy-questionnaires] Copied ${files.length} JSON files to public/questionnaires`,
);
