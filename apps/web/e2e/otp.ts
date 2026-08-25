import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { Client } from "pg";

// The dev API's OTP is delivered only via a mock SMS provider (logged to
// whichever terminal is running the API -- not something this test process
// necessarily has access to, since the API may already be running in the
// developer's own terminal). Instead of depending on that log, read the
// hashed OTP row directly from the shared local dev database and brute-force
// the 6-digit code against the known HMAC secret from apps/api/.env. This
// works regardless of which process served the request, and is safe: a
// local dev-only database with a dev-only secret, never real user data.
function loadApiEnv(): Record<string, string> {
  const path = "../api/.env";
  const env: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line.trim());
    if (match) env[match[1]] = match[2];
  }
  return env;
}

function hashCode(code: string, secret: string): string {
  return createHmac("sha256", secret).update(code).digest("hex");
}

export async function getOtpForPhone(rawPhone: string): Promise<string> {
  const env = loadApiEnv();
  const phone = rawPhone.replace(/^0/, "+98");

  const client = new Client({
    host: env.DATABASE_HOST,
    port: Number(env.DATABASE_PORT),
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
  });
  await client.connect();
  try {
    const result = await client.query(
      `SELECT "codeHash" FROM otp_codes WHERE phone = $1 ORDER BY "createdAt" DESC LIMIT 1`,
      [phone],
    );
    if (result.rows.length === 0) {
      throw new Error(`No OTP row found for ${phone}`);
    }
    const targetHash = result.rows[0].codeHash as string;

    for (let candidate = 0; candidate < 1_000_000; candidate += 1) {
      const code = String(candidate).padStart(6, "0");
      if (hashCode(code, env.OTP_HASH_SECRET) === targetHash) {
        return code;
      }
    }
    throw new Error(`Could not recover OTP for ${phone}`);
  } finally {
    await client.end();
  }
}
