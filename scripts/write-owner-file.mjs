import { chmodSync, writeFileSync } from "node:fs";

export function writeOwnerOnlyFile(path, content) {
  writeFileSync(path, content, { mode: 0o600 });
  chmodSync(path, 0o600);
}
