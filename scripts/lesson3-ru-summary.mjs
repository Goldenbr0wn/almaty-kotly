import { spawnSync } from "node:child_process";
import { writeOwnerOnlyFile } from "./write-owner-file.mjs";
import { argValue } from "./env-file.mjs";

const args = process.argv.slice(2);
const outPath = argValue("--out");
const preparedEnvPath = argValue("--prepared-env");
const standaloneSmokePath = argValue("--standalone-smoke");
const guardedDryRunsPath = argValue("--guarded-dry-runs");
const acceptWebAuditFallback = args.includes("--accept-web-audit-fallback");

function runStatus() {
  const statusArgs = ["run", "lesson3:status"];
  const statusScriptArgs = [];
  if (preparedEnvPath) statusScriptArgs.push("--prepared-env", preparedEnvPath);
  if (standaloneSmokePath) statusScriptArgs.push("--standalone-smoke", standaloneSmokePath);
  if (guardedDryRunsPath) statusScriptArgs.push("--guarded-dry-runs", guardedDryRunsPath);
  if (acceptWebAuditFallback) statusScriptArgs.push("--accept-web-audit-fallback");
  if (statusScriptArgs.length > 0) statusArgs.push("--", ...statusScriptArgs);
  const result = spawnSync("npm", statusArgs, { encoding: "utf8" });
  const match = result.stdout.match(/\{[\s\S]*\}\s*$/);
  if (!match) throw new Error("lesson3:status did not return parseable JSON");
  return JSON.parse(match[0]);
}

function titleRu(story) {
  const names = {
    "US-01": "Навыки из урока",
    "US-02": "Сервер",
    "US-03": "Безопасность Mac mini",
    "US-04": "Домен",
    "US-05": "Backend SuperGoal",
    "US-06": "User stories и проверки",
    "US-07": "Финальная готовность"
  };
  return names[story.id] || story.title;
}

function statusRu(status) {
  if (status === "done") return "готово";
  if (status === "blocked") return "заблокировано";
  return "частично";
}

function list(items) {
  if (!Array.isArray(items) || items.length === 0) return "- нет";
  return items.map((item) => `- ${translate(item)}`).join("\n");
}

function translate(value) {
  const exact = {
    "install or confirm the exact seo-aeo-geo-principal skill, or explicitly accept web-audit as the replacement": "установить точный навык seo-aeo-geo-principal или явно принять web-audit как замену",
    "complete approval steps until mac-mini:cutover-gate is ready": "пройти approval-шаги, пока mac-mini:cutover-gate не станет зеленым",
    "Enable approved macOS firewall hardening": "включить одобренное усиление macOS firewall",
    "Install rendered launchd service": "установить срендеренный launchd service",
    "Install and validate Caddy reverse proxy": "установить и проверить Caddy reverse proxy",
    "Install Caddyfile and restart Caddy service": "установить Caddyfile и перезапустить Caddy",
    "Forward router ports 80 and 443 to 192.168.8.12": "пробросить на роутере порты 80 и 443 на 192.168.8.12",
    "Move DNS A record from Vercel to Mac mini public endpoint": "перевести DNS A record с Vercel на публичный endpoint Mac mini",
    "run live acceptance after Supabase env, launchd, proxy, router, and DNS cutover": "запустить live acceptance после Supabase env, launchd, proxy, router и DNS cutover"
  };
  const notes = {
    "VPS is intentionally not required because the Mac mini M4 is the selected always-on server.": "VPS специально не нужен: выбран постоянный сервер Mac mini M4.",
    "VPS-specific hardening is translated to Mac mini controls: macOS firewall, stealth mode, launchd, Caddy, and no public SSH unless explicitly approved.": "VPS-специфичная защита переведена в Mac mini-контроль: macOS firewall, stealth mode, launchd, Caddy и без публичного SSH без отдельного approval."
  };
  if (exact[value]) return exact[value];
  if (notes[value]) return notes[value];
  if (value.startsWith("placeholder-looking values remain for keys:")) {
    return value.replace("placeholder-looking values remain for keys:", "в подготовленном env-файле остались placeholder-значения для ключей:");
  }

  return value
    .replace("env-audit: env file not found at", "env-audit: env-файл не найден по пути")
    .replace("env-audit: missing required keys:", "env-audit: не заполнены обязательные ключи:")
    .replace("host-readiness: runtime env file is missing at", "host-readiness: runtime env-файл отсутствует по пути")
    .replace("host-readiness: Caddy is not installed or not in PATH", "host-readiness: Caddy не установлен или не найден в PATH")
    .replace("host-readiness: launchd service com.alatau-service.web is not loaded", "host-readiness: launchd service com.alatau-service.web не загружен")
    .replace("host-readiness: port 80 is not listening locally", "host-readiness: локальный порт 80 не слушает")
    .replace("host-readiness: port 443 is not listening locally", "host-readiness: локальный порт 443 не слушает")
    .replace("network-probe: local port 80 is not listening", "network-probe: локальный порт 80 не слушает")
    .replace("network-probe: local port 443 is not listening", "network-probe: локальный порт 443 не слушает")
    .replace("security-audit: macOS application firewall is not enabled", "security-audit: macOS application firewall не включен")
    .replace("templates: Caddy is not installed or not in PATH", "templates: Caddy не установлен или не найден в PATH");
}

const status = runStatus();
const done = status.userStories.filter((story) => story.status === "done");
const partial = status.userStories.filter((story) => story.status === "partial");
const blocked = status.userStories.filter((story) => story.status === "blocked");
const immediate = status.immediateNextAction || status.nextAction || {};

const lines = [
  "# Урок 3: что сделано и что осталось",
  "",
  `Сгенерировано: ${status.generatedAt}`,
  `Домен: ${status.domain}`,
  `Решение по cutover: ${status.decision}`,
  `Prepared env: ${status.preparedEnv || "unknown"}`,
  `Итог: ${status.ok ? "готово" : "не готово"}`,
  "",
  "## Коротко",
  "",
  `- Готово: ${done.length}`,
  `- Частично: ${partial.length}`,
  `- Заблокировано: ${blocked.length}`,
  status.standaloneSmoke ? `- Standalone smoke: ${status.standaloneSmoke.ok ? "ok" : "not ok"} (${status.standaloneSmoke.backend || "unknown backend"}, ${status.standaloneSmoke.artifact})` : "- Standalone smoke: не включен",
  status.guardedDryRuns ? `- Guarded dry-runs: ${status.guardedDryRuns.ok ? "ok" : "not ok"} (${status.guardedDryRuns.checkCount} checks, ${status.guardedDryRuns.expectedBlockCount} expected blocks, ${status.guardedDryRuns.artifact})` : "- Guarded dry-runs: не включены",
  "",
  "## Что уже сделано",
  "",
  "- VPS больше не нужен: целевой сервер зафиксирован как Mac mini M4 self-host.",
  "- VPS-пункты из урока перенесены на Mac mini: без root/VPS-доступа, launchd вместо Docker, Caddy для HTTPS/reverse proxy, macOS firewall/stealth вместо базового VPS hardening.",
  "- Backend SuperGoal и контракт для Supabase/CRM/admin/profile уже есть.",
  "- Подготовлены безопасные скрипты для env, readiness, handoff, cutover gate, Caddy, launchd, DNS и post-cutover acceptance.",
  "- Standalone release server проверен отдельно через `mac-mini:standalone-smoke` на memory backend.",
  "- Все отчеты и bundle-артефакты пишутся без секретных значений.",
  "",
  "## Следующий шаг",
  "",
`- ID: ${immediate.id || "unknown"}`,
  `- Причина: ${translate(immediate.reason || "unknown")}`,
  Array.isArray(immediate.unblocksRequirementIds) && immediate.unblocksRequirementIds.length > 0 ? `- Разблокирует: ${immediate.unblocksRequirementIds.join(", ")}` : "- Разблокирует: неизвестно",
  immediate.evidenceSource ? `- Источник: ${immediate.evidenceSource}` : "- Источник: lesson3:status",
  immediate.guide ? `- Guide: \`${immediate.guide}\`` : "- Guide: нет",
  immediate.fillCommand ? `- Fill command: \`${immediate.fillCommand}\`` : "- Fill command: нет",
  immediate.postfillGate ? `- Post-fill gate: \`${immediate.postfillGate}\`` : "- Post-fill gate: нет",
  `- Проверка: \`${immediate.dryRun || "npm run lesson3:status"}\``,
  immediate.approvalStep?.command ? `- Команда после явного approval: \`${immediate.approvalStep.command}\`` : "- Approval-команда: пока нет, это ручной шаг",
  "",
  "## Completion Audit",
  "",
  "- Артефакт: `/tmp/alatau-lesson3-completion-audit.json`",
  `- Обновить: \`npm run lesson3:completion-audit -- --prepared-env ${status.preparedEnv || "/tmp/alatau-supabase.env.todo"}${standaloneSmokePath ? ` --standalone-smoke ${standaloneSmokePath}` : ""}${guardedDryRunsPath ? ` --guarded-dry-runs ${guardedDryRunsPath}` : ""}${acceptWebAuditFallback ? " --accept-web-audit-fallback" : ""} --out /tmp/alatau-lesson3-completion-audit.json\``,
  "- Зачем: машинная проверка каждого пункта перед любым финальным “готово”.",
  "",
  "## По пунктам домашки",
  ""
];

for (const story of status.userStories) {
  lines.push(`### ${story.id} ${titleRu(story)} — ${statusRu(story.status)}`);
  lines.push("");
  if (Array.isArray(story.notes) && story.notes.length > 0) {
    lines.push("Примечание:");
    lines.push(list(story.notes));
    lines.push("");
  }
  lines.push("Осталось:");
  lines.push(list(story.remaining));
  lines.push("");
}

lines.push("## Безопасность отчета");
lines.push("");
lines.push(`- Read-only: ${status.safety?.readOnly ? "yes" : "no"}`);
lines.push(`- Secrets printed: ${status.safety?.secretsPrinted ? "yes" : "no"}`);
lines.push("");

const report = `${lines.join("\n")}\n`;
if (outPath) writeOwnerOnlyFile(outPath, report);
console.log(report);
