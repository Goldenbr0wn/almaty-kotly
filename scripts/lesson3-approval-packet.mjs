import { writeOwnerOnlyFile } from "./write-owner-file.mjs";
import { argValue } from "./env-file.mjs";

const outPath = argValue("--out") || "/tmp/alatau-lesson3-approval-packet.json";

const approvals = [
  {
    id: "hardening",
    checkbox: "Настроить безопасный базовый контур",
    purpose: "Enable approved macOS firewall hardening and optionally disable Remote Login after confirming SSH is not needed.",
    dryRun: "npm run mac-mini:security-hardening:dry-run",
    execute: "ALATAU_SECURITY_HARDENING_CONFIRMED=1 bash ops/mac-mini-security-hardening.sh --execute",
    guard: "ALATAU_SECURITY_HARDENING_CONFIRMED=1",
    verification: "npm run mac-mini:security-audit"
  },
  {
    id: "launchd-deploy",
    checkbox: "Задеплоить сайт из урока 2 на VPS",
    purpose: "Install the Next.js standalone release and launchd service on the Mac mini replacement host.",
    dryRun: "npm run mac-mini:install:dry-run",
    execute: "bash ops/mac-mini-install.sh --execute",
    guard: "execute mode blocks if env audit, templates, standalone smoke, or deploy dry-run fail",
    verification: "npm run mac-mini:status -- --out /tmp/alatau-mac-mini-status.json"
  },
  {
    id: "caddy-install",
    checkbox: "Настроить безопасный базовый контур",
    purpose: "Install and validate Caddy as the reverse proxy and HTTPS endpoint.",
    dryRun: "npm run mac-mini:caddy:dry-run",
    execute: "bash ops/caddy-install.sh --execute",
    guard: "requires approved package-manager mutation",
    verification: "npm run mac-mini:templates"
  },
  {
    id: "caddy-service",
    checkbox: "Настроить безопасный базовый контур",
    purpose: "Install the Caddyfile and restart the approved Caddy service.",
    dryRun: "npm run mac-mini:caddy-service:dry-run",
    execute: "ALATAU_CADDY_SERVICE_CONFIRMED=1 bash ops/caddy-service.sh --execute",
    guard: "ALATAU_CADDY_SERVICE_CONFIRMED=1",
    verification: "npm run mac-mini:network-probe"
  },
  {
    id: "dns-cutover",
    checkbox: "Подключить домен через DNS API",
    purpose: "Move Porkbun DNS to the Mac mini public endpoint only after the cutover gate is green.",
    dryRun: "npm run mac-mini:dns-cutover:dry-run",
    execute: "ALATAU_DNS_CUTOVER_CONFIRMED=1 node scripts/porkbun-dns-cutover.mjs --execute",
    guard: "ALATAU_DNS_CUTOVER_CONFIRMED=1 and npm run mac-mini:cutover-gate returns ready-for-approved-dns-cutover",
    verification: "npm run mac-mini:network-probe"
  },
  {
    id: "post-cutover-acceptance",
    checkbox: "Прогнать user stories и повторить failed после исправлений",
    purpose: "Run public production healthcheck and live acceptance after DNS cutover; this can post one smoke lead.",
    dryRun: "npm run mac-mini:post-cutover -- --out /tmp/alatau-post-cutover.json",
    execute: "ALATAU_POST_CUTOVER_CONFIRMED=1 npm run mac-mini:post-cutover -- --execute --out /tmp/alatau-post-cutover.json",
    guard: "ALATAU_POST_CUTOVER_CONFIRMED=1",
    verification: "npm run lesson3:screen-checklist -- --accept-web-audit-fallback --out /tmp/alatau-lesson3-screen-checklist.json"
  }
];

const packet = {
  generatedAt: new Date().toISOString(),
  target: "lesson-3-approval-packet",
  summary: "Approval-gated commands for the remaining Human20 Lesson 3 checklist work.",
  approvals,
  safety: {
    readOnly: true,
    secretsPrinted: false,
    hostDnsRouterMutations: false,
    executeModeCommandsAreApprovalGated: true
  }
};

writeOwnerOnlyFile(outPath, `${JSON.stringify(packet, null, 2)}\n`);
console.log(JSON.stringify(packet, null, 2));
