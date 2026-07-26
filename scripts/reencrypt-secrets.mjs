/**
 * Re-encrypt cloud_accounts + provider_config after rotating SAMAR_SECRET_KEY.
 *
 * Usage:
 *   OLD_SAMAR_SECRET_KEY='old-key' NEW_SAMAR_SECRET_KEY='new-key' npm run secrets:reencrypt
 *   OLD_SAMAR_SECRET_KEY='old-key' NEW_SAMAR_SECRET_KEY='new-key' npm run secrets:reencrypt -- --dry-run
 *
 * Loads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local if unset.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT = "turnix-salt";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(resolve(root, ".env.local"));
loadEnvFile(resolve(root, ".env"));

function deriveKey(secret) {
  if (!secret) throw new Error("Secret key is required");
  return scryptSync(secret, SALT, 32);
}

function decryptWith(secret, encrypted) {
  const key = deriveKey(secret);
  const buffer = Buffer.from(encrypted, "base64");
  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8"));
}

function encryptWith(secret, data) {
  const key = deriveKey(secret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const plaintext = JSON.stringify(data);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

function tryDecrypt(secret, encrypted) {
  try {
    return { ok: true, data: decryptWith(secret, encrypted) };
  } catch {
    return { ok: false, data: null };
  }
}

async function reencryptField({
  label,
  encrypted,
  oldKey,
  newKey,
  update,
}) {
  if (!encrypted) {
    return "skip_empty";
  }

  const withNew = tryDecrypt(newKey, encrypted);
  if (withNew.ok) {
    return "already_new";
  }

  const withOld = tryDecrypt(oldKey, encrypted);
  if (!withOld.ok) {
    console.error(`  ✗ ${label}: cannot decrypt with OLD or NEW key`);
    return "failed";
  }

  const next = encryptWith(newKey, withOld.data);
  if (dryRun) {
    console.log(`  · ${label}: would re-encrypt`);
    return "dry_run";
  }

  await update(next);
  console.log(`  ✓ ${label}: re-encrypted`);
  return "updated";
}

async function main() {
  const oldKey = process.env.OLD_SAMAR_SECRET_KEY;
  const newKey =
    process.env.NEW_SAMAR_SECRET_KEY || process.env.SAMAR_SECRET_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!oldKey) {
    throw new Error(
      "Set OLD_SAMAR_SECRET_KEY to the previous secret.\n\n" +
        "Example:\n" +
        "  OLD_SAMAR_SECRET_KEY='key-lama' NEW_SAMAR_SECRET_KEY='key-baru' npm run secrets:reencrypt -- --dry-run\n" +
        "  OLD_SAMAR_SECRET_KEY='key-lama' NEW_SAMAR_SECRET_KEY='key-baru' npm run secrets:reencrypt"
    );
  }
  if (!newKey) {
    throw new Error("Set NEW_SAMAR_SECRET_KEY (or SAMAR_SECRET_KEY) to the new secret");
  }
  if (oldKey === newKey) {
    throw new Error("OLD and NEW secrets are identical — nothing to migrate");
  }
  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
    );
  }

  console.log(
    dryRun
      ? "Dry run — no DB writes\n"
      : "Re-encrypting secrets in Supabase...\n"
  );

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const stats = {
    updated: 0,
    already_new: 0,
    skip_empty: 0,
    dry_run: 0,
    failed: 0,
  };

  const { data: accounts, error: accountsError } = await supabase
    .from("cloud_accounts")
    .select("id, provider, email, credentials_encrypted");

  if (accountsError) throw accountsError;

  console.log(`cloud_accounts: ${accounts?.length ?? 0} row(s)`);
  for (const row of accounts ?? []) {
    const result = await reencryptField({
      label: `${row.provider} ${row.email ?? row.id}`,
      encrypted: row.credentials_encrypted,
      oldKey,
      newKey,
      update: async (credentials_encrypted) => {
        const { error } = await supabase
          .from("cloud_accounts")
          .update({ credentials_encrypted })
          .eq("id", row.id);
        if (error) throw error;
      },
    });
    stats[result] += 1;
  }

  const { data: providers, error: providersError } = await supabase
    .from("provider_config")
    .select("provider, client_secret_encrypted");

  if (providersError) throw providersError;

  console.log(`\nprovider_config: ${providers?.length ?? 0} row(s)`);
  for (const row of providers ?? []) {
    const result = await reencryptField({
      label: row.provider,
      encrypted: row.client_secret_encrypted,
      oldKey,
      newKey,
      update: async (client_secret_encrypted) => {
        const { error } = await supabase
          .from("provider_config")
          .update({
            client_secret_encrypted,
            updated_at: new Date().toISOString(),
          })
          .eq("provider", row.provider);
        if (error) throw error;
      },
    });
    stats[result] += 1;
  }

  console.log("\nDone:", stats);
  if (stats.failed > 0) {
    console.error(
      "\nSome rows failed. Those accounts need Reconnect / re-save Client Secret."
    );
    process.exitCode = 1;
  } else if (!dryRun) {
    console.log(
      "\nNext: set SAMAR_SECRET_KEY to the NEW value in .env.local AND Vercel, then redeploy."
    );
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
