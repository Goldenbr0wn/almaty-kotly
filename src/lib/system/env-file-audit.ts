type EnvAuditKey = {
  name: string;
  configured: boolean;
  placeholder: boolean;
};

export type EnvFileAuditInput = {
  path: string;
  exists: boolean;
  mode?: number;
  keys: Record<string, string | undefined>;
  requiredKeys: string[];
};

export type EnvFileAudit = {
  ok: boolean;
  path: string;
  exists: boolean;
  permissions: {
    mode?: string;
    ownerOnly: boolean;
  };
  keys: EnvAuditKey[];
  blockers: string[];
  nextActions: string[];
};

function modeString(mode?: number): string | undefined {
  if (mode === undefined) return undefined;
  return `0${(mode & 0o777).toString(8)}`;
}

function isOwnerOnly(mode?: number): boolean {
  if (mode === undefined) return false;
  return (mode & 0o077) === 0;
}

export function auditEnvFile(input: EnvFileAuditInput): EnvFileAudit {
  const blockers: string[] = [];
  const nextActions: string[] = [];
  const ownerOnly = isOwnerOnly(input.mode);
  const keys = input.requiredKeys.map((name) => {
    const value = input.keys[name];
    return {
      name,
      configured: Boolean(value?.trim()),
      placeholder: isPlaceholderValue(value)
    };
  });

  if (!input.exists) {
    blockers.push(`env file not found at ${input.path}`);
    nextActions.push(`install a filled copy of ops/alatau-supabase.env.template at ${input.path} with mode 0600`);
  }
  if (input.exists && !ownerOnly) {
    blockers.push("env file permissions are too broad; expected owner-only permissions such as 0600");
    nextActions.push(`chmod 600 ${input.path}`);
  }

  const missing = keys.filter((key) => !key.configured).map((key) => key.name);
  if (missing.length > 0) {
    blockers.push(`missing required keys: ${missing.join(", ")}`);
    nextActions.push(`fill missing keys from the secret manager: ${missing.join(", ")}`);
  }

  const placeholders = keys.filter((key) => key.placeholder).map((key) => key.name);
  if (placeholders.length > 0) {
    blockers.push(`placeholder-looking values remain for keys: ${placeholders.join(", ")}`);
    nextActions.push(`replace placeholder-looking values for keys: ${placeholders.join(", ")}`);
  }

  return {
    ok: blockers.length === 0,
    path: input.path,
    exists: input.exists,
    permissions: {
      mode: modeString(input.mode),
      ownerOnly
    },
    keys,
    blockers,
    nextActions
  };
}
import { isPlaceholderValue } from "@/lib/system/env-placeholder";
