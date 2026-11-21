// Creates the synthetic development accounts used by the FX-001 browser checks.
// Requires the local Supabase stack (or a dedicated development project).
// Usage: node scripts/seed-dev-users.mjs

import { execSync } from "node:child_process";

const accounts = [
  {
    email: "alice@focusx.test",
    full_name: "Alice Khan",
    username: "alice",
  },
  {
    email: "bob@focusx.test",
    full_name: "Bob Ahmed",
    username: "bob",
  },
  {
    email: "outsider@focusx.test",
    full_name: "Outside Visitor",
    username: "outsider",
  },
];

function localStatus() {
  try {
    const output = execSync("npx --yes supabase@3.2.0 status -o env", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return Object.fromEntries(
      output
        .split(/\r?\n/)
        .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
        .filter(Boolean)
        .map((match) => [match[1], match[2]]),
    );
  } catch {
    return {};
  }
}

const status = localStatus();
const url =
  process.env.SUPABASE_URL ?? status.API_URL ?? "http://127.0.0.1:54321";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  status.SERVICE_ROLE_KEY ??
  status.SECRET_KEY;
const password = process.env.SEED_PASSWORD ?? "focusx-dev-password";

if (!serviceKey) {
  console.error(
    "Set SUPABASE_SERVICE_ROLE_KEY (or run the local stack with npx supabase start).",
  );
  process.exit(1);
}

const headers = {
  "content-type": "application/json",
  apikey: serviceKey,
  authorization: `Bearer ${serviceKey}`,
};

async function existingEmails() {
  const response = await fetch(`${url}/auth/v1/admin/users?per_page=200`, {
    headers,
  });
  if (!response.ok) {
    throw new Error(`Admin user list failed: ${response.status}`);
  }
  const body = await response.json();
  return new Set((body.users ?? []).map((user) => user.email));
}

const known = await existingEmails();

for (const account of accounts) {
  if (known.has(account.email)) {
    console.log(`exists  ${account.email}`);
    continue;
  }

  const response = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email: account.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: account.full_name,
        username: account.username,
        exam_track: "MDCAT",
        daily_target_minutes: 180,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Create ${account.email} failed: ${response.status} ${detail}`);
  }
  console.log(`created ${account.email}`);
}

console.log(
  `\nDev accounts ready at ${url} with the SEED_PASSWORD from your environment or the default.`,
);
