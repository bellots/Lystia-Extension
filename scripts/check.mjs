import { execFileSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

async function javascriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return javascriptFiles(path);
    return extname(entry.name) === ".js" || extname(entry.name) === ".mjs" ? [path] : [];
  }));
  return nested.flat();
}

for (const file of await javascriptFiles(resolve(projectRoot, "src"))) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}

JSON.parse(await (await import("node:fs/promises")).readFile(resolve(projectRoot, "src", "manifest.template.json"), "utf8"));
console.log("Sintassi JavaScript e manifest validi.");
