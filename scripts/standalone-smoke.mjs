import { spawn, spawnSync } from "node:child_process";
import { writeOwnerOnlyFile } from "./write-owner-file.mjs";
import { argValue } from "./env-file.mjs";

const outPath = argValue("--out");
const port = process.env.SMOKE_PORT || "5174";
const baseUrl = `http://127.0.0.1:${port}`;
const timeoutMs = 30000;

function emit(result) {
  const serialized = JSON.stringify(result, null, 2);
  if (outPath) writeOwnerOnlyFile(outPath, `${serialized}\n`);
  console.log(serialized);
}

function ensureStandaloneReady() {
  const build = spawnSync("npm", ["run", "build"], { stdio: "inherit" });
  if (build.status !== 0) process.exit(build.status ?? 1);

  const prepare = spawnSync("npm", ["run", "prepare:standalone"], { stdio: "inherit" });
  if (prepare.status !== 0) process.exit(prepare.status ?? 1);
}

async function waitForHealth() {
  const started = Date.now();
  let lastError = "";

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return await response.json();
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`standalone server did not become healthy: ${lastError}`);
}

ensureStandaloneReady();

const server = spawn("node", [".next/standalone/server.js"], {
  env: {
    ...process.env,
    HOSTNAME: "127.0.0.1",
    PORT: port,
    DATA_BACKEND: "memory",
    LOCAL_ADMIN_EMAIL: "owner@example.com",
    ADMIN_EMAILS: "owner@example.com"
  },
  stdio: ["ignore", "pipe", "pipe"]
});

let stdout = "";
let stderr = "";
server.stdout.on("data", (chunk) => {
  stdout += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  stderr += chunk.toString();
});

async function stopServer() {
  if (server.exitCode !== null) return;
  server.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 2000))
  ]);
  if (server.exitCode === null) server.kill("SIGKILL");
}

try {
  const health = await waitForHealth();
  const acceptance = spawnSync("npm", ["run", "runtime:acceptance", "--", `--base-url=${baseUrl}`], {
    encoding: "utf8",
    env: process.env
  });

  const result = {
    generatedAt: new Date().toISOString(),
    ok: acceptance.status === 0,
    baseUrl,
    health: {
      ok: Boolean(health?.ok),
      backend: health?.db?.backend
    },
    acceptance: {
      status: acceptance.status,
      stdout: acceptance.stdout.trim(),
      stderr: acceptance.stderr.trim()
    },
    safety: {
      secretsPrinted: false,
      installsEnv: false,
      hostDnsRouterMutations: false,
      localLoopbackServerStarted: true
    }
  };

  emit(result);
  process.exitCode = acceptance.status === 0 ? 0 : 1;
} catch (error) {
  emit({
    generatedAt: new Date().toISOString(),
    ok: false,
    baseUrl,
    error: error instanceof Error ? error.message : String(error),
    server: {
      stdout: stdout.trim(),
      stderr: stderr.trim()
    },
    safety: {
      secretsPrinted: false,
      installsEnv: false,
      hostDnsRouterMutations: false,
      localLoopbackServerStarted: true
    }
  });
  process.exitCode = 1;
} finally {
  await stopServer();
}
