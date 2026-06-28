import { spawnSync } from "node:child_process";

const args = process.argv.slice(2).filter((arg) => arg !== "--runInBand");
const result = spawnSync("npx", ["vitest", "run", ...args], {
  stdio: "inherit",
  shell: false
});

process.exit(result.status ?? 1);
