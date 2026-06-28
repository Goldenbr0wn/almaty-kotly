import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const standalone = join(root, ".next", "standalone");
const standaloneNext = join(standalone, ".next");

if (!existsSync(join(root, ".next", "static"))) {
  throw new Error("Missing .next/static. Run npm run build first.");
}

mkdirSync(standaloneNext, { recursive: true });

const staticTarget = join(standaloneNext, "static");
rmSync(staticTarget, { recursive: true, force: true });
cpSync(join(root, ".next", "static"), staticTarget, { recursive: true });

const publicTarget = join(standalone, "public");
rmSync(publicTarget, { recursive: true, force: true });
cpSync(join(root, "public"), publicTarget, { recursive: true });

console.log("standalone static assets prepared");
