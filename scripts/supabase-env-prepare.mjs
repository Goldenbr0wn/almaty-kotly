import { chmodSync, copyFileSync, existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { argValue } from "./env-file.mjs";

const args = process.argv.slice(2);
const outPath = argValue("--out") || "/tmp/alatau-supabase.env.todo";
const force = args.includes("--force");
const templatePath = resolve("ops/alatau-supabase.env.template");

if (!outPath) {
  console.error("blocked: --out requires a path");
  process.exit(2);
}

if (!existsSync(templatePath)) {
  console.error(`blocked: template missing at ${templatePath}`);
  process.exit(1);
}

if (existsSync(outPath) && !force) {
  console.error(`blocked: ${outPath} already exists; pass --force to replace the placeholder file`);
  process.exit(1);
}

mkdirSync(dirname(outPath), { recursive: true });
copyFileSync(templatePath, outPath);
writeFileSync(outPath, `${readFileSync(outPath, "utf8").replace(/\s*$/, "\n")}`, { mode: 0o600 });
chmodSync(outPath, 0o600);

const mode = statSync(outPath).mode & 0o777;
const report = {
  generatedAt: new Date().toISOString(),
  ok: true,
  target: "supabase-env-prepare",
  template: templatePath,
  out: outPath,
  mode: `0${mode.toString(8)}`,
  nextActions: [
    `fill ${outPath} from Supabase dashboard or secret manager`,
    `npm run supabase:env-audit -- --file ${outPath}`,
    `npm run supabase:env-install:dry-run -- --source ${outPath}`
  ],
  safety: {
    writesPlaceholderOnly: true,
    secretsPrinted: false,
    installsEnv: false
  }
};

console.log(JSON.stringify(report, null, 2));
