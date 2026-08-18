import { execFileSync } from "node:child_process";
import { access, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = resolve(projectRoot, "dist", "chrome");
const outputPath = resolve(projectRoot, "dist", "lystia-chrome.zip");

await access(resolve(sourceDir, "manifest.json"));
await rm(outputPath, { force: true });
execFileSync("zip", ["-q", "-r", outputPath, "."], { cwd: sourceDir, stdio: "inherit" });

console.log(`Pacchetto Chrome creato: ${outputPath}`);
