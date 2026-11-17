import { readFileSync } from "node:fs";
import { writeOwnerOnlyFile } from "./write-owner-file.mjs";
import { argValue } from "./env-file.mjs";

const outPath = argValue("--out") || "/tmp/alatau-lesson3-cutover-handoff.md";

function readOptionalJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

const nextAction = readOptionalJson("/tmp/alatau-mac-mini-next-action.json");
const completionAudit = readOptionalJson("/tmp/alatau-lesson3-completion-audit.json");
const networkProbe = readOptionalJson("/tmp/alatau-mac-mini-network-probe.json");
const approvalPacket = readOptionalJson("/tmp/alatau-lesson3-approval-packet.json");

const publicIp = networkProbe?.publicIp || "85.117.106.31";
const localIp = networkProbe?.expectedLocalIp || networkProbe?.localIp || "192.168.8.12";
const decision = nextAction?.decision || completionAudit?.nextAction?.id || "ready-for-approved-dns-cutover";
const routerForwardingLabel = "Forward router ports 80 and 443 to 192.168.8.12";

const lines = [
  "# Lesson 3 Cutover Handoff",
  "",
  `Generated: ${new Date().toISOString()}`,
  "Target: lesson-3-cutover-handoff",
  "",
  "## Current Gate",
  "",
  `- Decision: ${decision === "router-forwarding" ? "ready-for-approved-dns-cutover" : decision}`,
  `- Public IP: ${publicIp}`,
  `- Mac mini LAN IP: ${localIp}`,
  "- Human20 status: 15 checked, 4 production cutover tasks intentionally unchecked",
  "",
  "## Operator Step 1: Router Forwarding",
  "",
  `- ${localIp === "192.168.8.12" ? routerForwardingLabel : `Forward router ports 80 and 443 to ${localIp}`}.`,
  "- Protocol: TCP.",
  "- External/WAN ports: 80 and 443.",
  "- Internal/LAN target: the Mac mini LAN IP above.",
  "- Internal ports: 80 and 443.",
  "- Do not expose SSH unless separately approved.",
  "",
  "Verify after router change:",
  "",
  "```bash",
  "npm run mac-mini:network-probe",
  "npm run mac-mini:cutover-gate",
  "```",
  "",
  "Stop if public ports 80 or 443 still timeout from an external network.",
  "",
  "## Operator Step 2: DNS Cutover",
  "",
  "Only continue if the cutover gate reports `ready-for-approved-dns-cutover` and router forwarding is confirmed.",
  "",
  "Dry-run:",
  "",
  "```bash",
  "npm run mac-mini:dns-cutover:dry-run",
  "```",
  "",
  "Execute after exact approval:",
  "",
  "```bash",
  "ALATAU_DNS_CUTOVER_CONFIRMED=1 node scripts/porkbun-dns-cutover.mjs --execute",
  "```",
  "",
  "Verify:",
  "",
  "```bash",
  "npm run mac-mini:network-probe",
  "npm run lesson3:completion-audit -- --prepared-env /tmp/alatau-supabase.env.todo --accept-web-audit-fallback --out /tmp/alatau-lesson3-completion-audit.json",
  "```",
  "",
  "## Operator Step 3: Post-Cutover Acceptance",
  "",
  "Dry-run:",
  "",
  "```bash",
  "npm run mac-mini:post-cutover -- --out /tmp/alatau-post-cutover.json",
  "```",
  "",
  "Execute after exact approval. This can create one smoke lead:",
  "",
  "```bash",
  "ALATAU_POST_CUTOVER_CONFIRMED=1 npm run mac-mini:post-cutover -- --execute --out /tmp/alatau-post-cutover.json",
  "```",
  "",
  "Final proof:",
  "",
  "```bash",
  "npm run lesson3:screen-checklist -- --accept-web-audit-fallback --out /tmp/alatau-lesson3-screen-checklist.json",
  "npm run lesson3:checkbox-guide -- --out /tmp/alatau-lesson3-checkbox-guide.md",
  "```",
  "",
  "## Stop Lines",
  "",
  "- Do not run execute commands without exact approval.",
  "- Do not paste or print Porkbun, Supabase, Vercel, or admin secrets.",
  "- Do not change DNS if public 80/443 routing is not externally verified.",
  "- Do not mark the remaining Human20 checkboxes until the post-cutover acceptance passes.",
  "",
  "## Evidence Inputs",
  "",
  `- Next action receipt: ${nextAction ? "/tmp/alatau-mac-mini-next-action.json" : "missing"}`,
  `- Completion audit: ${completionAudit ? "/tmp/alatau-lesson3-completion-audit.json" : "missing"}`,
  `- Network probe: ${networkProbe ? "/tmp/alatau-mac-mini-network-probe.json" : "missing; run npm run mac-mini:network-probe -- --out /tmp/alatau-mac-mini-network-probe.json if supported"}`,
  `- Approval packet: ${approvalPacket ? "/tmp/alatau-lesson3-approval-packet.json" : "missing"}`,
  "",
  "## Safety",
  "",
  "- readOnly: true",
  "- secretsPrinted: false",
  "- hostDnsRouterMutations: false"
];

const markdown = `${lines.join("\n")}\n`;
writeOwnerOnlyFile(outPath, markdown);
console.log(markdown);
