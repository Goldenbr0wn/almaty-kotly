const domain = "alatau-service.com";
const localIp = "192.168.8.12";
const appPort = "5173";
const releaseRoot = "/Users/azat/Services/alatau-service/releases";
const currentLink = "/Users/azat/Services/alatau-service/current";
const envFile = "/Users/azat/.codex/secrets/alatau-supabase.env";
const launchdLabel = "com.alatau-service.web";

const steps = [
  {
    id: "MM-01",
    label: "Inspect current Mac mini host readiness",
    command: `npm run mac-mini:readiness -- --domain=${domain} --expected-local-ip=${localIp} --runtime-env-file=${envFile}`,
    safety: "read-only",
    requiresApproval: false
  },
  {
    id: "MM-02",
    label: "Audit Supabase env file safety without printing secrets",
    command: `npm run supabase:env-audit -- --file ${envFile}`,
    safety: "read-only",
    requiresApproval: false
  },
  {
    id: "MM-03",
    label: "Install filled Supabase env file into the Mac mini secret store",
    command: `ALATAU_ENV_INSTALL_CONFIRMED=1 bash ops/supabase-env-install.sh --execute --source /path/to/filled-alatau-supabase.env --target ${envFile}`,
    safety: "local-write",
    requiresApproval: true
  },
  {
    id: "MM-04",
    label: "Verify Supabase env status without printing secrets",
    command: `npm run supabase:readiness -- --base-url http://127.0.0.1:${appPort} --runtime-env-file ${envFile} --out /tmp/alatau-readiness.json`,
    safety: "read-only",
    requiresApproval: false
  },
  {
    id: "MM-05",
    label: "Verify Supabase schema and admin bootstrap",
    command: `npm run supabase:preflight -- --runtime-env-file ${envFile}`,
    safety: "read-only",
    requiresApproval: false
  },
  {
    id: "MM-06",
    label: "Audit Mac mini firewall and remote-login posture",
    command: "npm run mac-mini:security-audit",
    safety: "read-only",
    requiresApproval: false
  },
  {
    id: "MM-07",
    label: "Enable approved macOS firewall hardening",
    command: "ALATAU_SECURITY_HARDENING_CONFIRMED=1 bash ops/mac-mini-security-hardening.sh --execute",
    safety: "host-mutation",
    requiresApproval: true
  },
  {
    id: "MM-08",
    label: "Preview deploy paths and dirty-tree gate",
    command: `ALATAU_RELEASE_ROOT=${releaseRoot} ALATAU_CURRENT_LINK=${currentLink} ALATAU_SUPABASE_ENV_FILE=${envFile} bash ops/deploy.sh --dry-run`,
    safety: "read-only",
    requiresApproval: false
  },
  {
    id: "MM-09",
    label: "Create release and log directories",
    command: `mkdir -p ${releaseRoot} "$(dirname ${currentLink})/logs"`,
    safety: "local-write",
    requiresApproval: true
  },
  {
    id: "MM-10",
    label: "Build and publish standalone release to current symlink",
    command: `ALATAU_DEPLOY_CONFIRMED=1 ALATAU_RELEASE_ROOT=${releaseRoot} ALATAU_CURRENT_LINK=${currentLink} ALATAU_SUPABASE_ENV_FILE=${envFile} bash ops/deploy.sh`,
    safety: "local-write",
    requiresApproval: true
  },
  {
    id: "MM-11",
    label: "Install rendered launchd service",
    command: `ALATAU_RELEASE_ROOT=${releaseRoot} ALATAU_CURRENT_LINK=${currentLink} ALATAU_SUPABASE_ENV_FILE=${envFile} bash ops/mac-mini-install.sh --execute`,
    safety: "host-mutation",
    requiresApproval: true,
    note: "The install script renders the plist from ALATAU_CURRENT_LINK and ALATAU_SUPABASE_ENV_FILE before bootstrapping launchd."
  },
  {
    id: "MM-12",
    label: "Install and validate Caddy reverse proxy",
    command: "bash ops/caddy-install.sh --execute",
    safety: "host-mutation",
    requiresApproval: true
  },
  {
    id: "MM-13",
    label: "Install Caddyfile and restart Caddy service",
    command: "ALATAU_CADDY_SERVICE_CONFIRMED=1 bash ops/caddy-service.sh --execute",
    safety: "host-mutation",
    requiresApproval: true
  },
  {
    id: "MM-14",
    label: `Forward router ports 80 and 443 to ${localIp}`,
    safety: "network-mutation",
    requiresApproval: true
  },
  {
    id: "MM-15",
    label: "Run pre-DNS cutover gate",
    command: "npm run mac-mini:cutover-gate",
    safety: "read-only",
    requiresApproval: false
  },
  {
    id: "MM-16",
    label: "Move DNS A record from Vercel to Mac mini public endpoint",
    command: "ALATAU_DNS_CUTOVER_CONFIRMED=1 node scripts/porkbun-dns-cutover.mjs --execute",
    safety: "dns-mutation",
    requiresApproval: true
  },
  {
    id: "MM-17",
    label: "Run live acceptance with persistent database required",
    command: "ALATAU_POST_CUTOVER_CONFIRMED=1 npm run mac-mini:post-cutover -- --execute --out /tmp/alatau-post-cutover.json",
    safety: "production-smoke-write",
    requiresApproval: true
  }
];

console.log(JSON.stringify({ domain, target: "mac-mini-self-host", steps }, null, 2));
