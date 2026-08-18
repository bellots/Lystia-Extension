import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = resolve(projectRoot, "dist", "chrome");
const resourcesDir = resolve(projectRoot, "Safari", "Lystia", "Shared (Extension)", "Resources");

await rm(resourcesDir, { recursive: true, force: true });
await mkdir(resourcesDir, { recursive: true });
await cp(sourceDir, resourcesDir, { recursive: true });

console.log(`Risorse Safari aggiornate da ${sourceDir}`);
