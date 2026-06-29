import { spawnSync } from "node:child_process";

function command(commandName, args) {
  const result = spawnSync(commandName, args, { encoding: "utf8" });
  return {
    command: [commandName, ...args].join(" "),
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

const checks = [
  command("plutil", ["-lint", "ops/alatau-service.launchd.plist.example"])
];

const caddyVersion = command("sh", ["-lc", "command -v caddy >/dev/null"]);
if (caddyVersion.ok) {
  checks.push(command("caddy", ["validate", "--config", "ops/Caddyfile.example"]));
} else {
  checks.push({
    command: "caddy validate --config ops/Caddyfile.example",
    ok: false,
    status: 127,
    stdout: "",
    stderr: "Caddy is not installed or not in PATH"
  });
}

console.log(JSON.stringify({ ok: checks.every((check) => check.ok), checks }, null, 2));
process.exit(checks.every((check) => check.ok) ? 0 : 1);
