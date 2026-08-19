import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = resolve(projectRoot, "src");
const outputDir = resolve(projectRoot, "dist", "chrome");

function requestedOrigin() {
  const originFlag = process.argv.indexOf("--origin");
  const raw = originFlag >= 0 ? process.argv[originFlag + 1] : process.env.LYSTIA_WEB_ORIGIN;
  if (!raw) {
    throw new Error("Imposta LYSTIA_WEB_ORIGIN oppure usa --origin https://lystia.it");
  }
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol) || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("LYSTIA_WEB_ORIGIN deve contenere solo origine e porta, senza path o query");
  }
  return url.origin;
}

const origin = requestedOrigin();
await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await cp(sourceDir, outputDir, { recursive: true });

const manifestTemplatePath = resolve(outputDir, "manifest.template.json");
const manifestTemplate = await readFile(manifestTemplatePath, "utf8");
const manifest = manifestTemplate.replaceAll("__LYSTIA_WEB_MATCH__", `${origin}/*`);
JSON.parse(manifest);
await writeFile(resolve(outputDir, "manifest.json"), manifest);
await rm(manifestTemplatePath);

const configPath = resolve(outputDir, "config.js");
const config = (await readFile(configPath, "utf8")).replaceAll("__LYSTIA_WEB_ORIGIN__", origin);
await writeFile(configPath, config);

console.log(`Estensione creata in ${outputDir}`);
console.log(`Lystia Web: ${origin}`);
