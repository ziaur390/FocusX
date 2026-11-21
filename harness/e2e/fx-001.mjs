// FX-001 browser and API verification.
//
// Prerequisites:
//   npx supabase start
//   node scripts/seed-dev-users.mjs
//   npm run dev
//   npm install --no-save --package-lock=false playwright
//   npx playwright install chromium
//
// Run: node harness/e2e/fx-001.mjs
// The script uses three seeded development accounts and the local Supabase stack.
// It shortens one round deadline through SQL so the check-in window is testable
// without waiting for a full 10-minute round.

import { execSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PASSWORD = process.env.SEED_PASSWORD ?? "focusx-dev-password";
const DB_CONTAINER = process.env.SUPABASE_DB_CONTAINER ?? "supabase_db_focusx";

const root = new URL("../../", import.meta.url);
const envFile = readFileSync(new URL("apps/web/.env.local", root), "utf8");
const env = Object.fromEntries(
  envFile
    .split(/\r?\n/)
    .filter((line) => line.includes("="))
    .map((line) => [
      line.slice(0, line.indexOf("=")),
      line.slice(line.indexOf("=") + 1),
    ]),
);
const SUPABASE_URL = process.env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const evidenceDir = new URL("harness/evidence/", root);
mkdirSync(evidenceDir, { recursive: true });

let checks = 0;
let failures = 0;

function check(label, condition, detail = "") {
  checks += 1;
  if (condition) {
    console.log(`PASS ${label}${detail ? ` · ${detail}` : ""}`);
  } else {
    failures += 1;
    console.log(`FAIL ${label}${detail ? ` · ${detail}` : ""}`);
  }
}

function sql(query) {
  return execSync(
    `docker exec -i ${DB_CONTAINER} psql -U postgres -d postgres -t -A`,
    { input: query, encoding: "utf8" },
  ).trim();
}

async function signIn(page, email) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/rooms", { timeout: 20000 });
}

async function waitText(page, text, timeout = 20000) {
  await page.getByText(text, { exact: false }).first().waitFor({
    state: "visible",
    timeout,
  });
}

async function countdownSeconds(page) {
  const text = await page.locator("p.tabular").first().innerText();
  const parts = text.trim().split(":").map(Number);
  return parts.length === 3
    ? parts[0] * 3600 + parts[1] * 60 + parts[2]
    : parts[0] * 60 + parts[1];
}

async function setGoal(page, goal) {
  await page
    .getByLabel(/Measurable goal for round/)
    .fill(goal);
  await page
    .getByRole("button", { name: /Save goal and mark ready|Update goal and stay ready/ })
    .click();
  await page.getByText("Ready", { exact: true }).first().waitFor({
    state: "visible",
    timeout: 20000,
  });
}

async function saveScreenshot(page, name) {
  await page.screenshot({
    path: fileURLToPath(new URL(name, evidenceDir)),
    fullPage: true,
  });
}

async function accessToken(email) {
  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: { "content-type": "application/json", apikey: ANON_KEY },
      body: JSON.stringify({ email, password: PASSWORD }),
    },
  );
  const body = await response.json();
  if (!body.access_token) {
    throw new Error(`No access token for ${email}: ${JSON.stringify(body)}`);
  }
  return body.access_token;
}

const browser = await chromium.launch({
  channel: "chrome",
  args: [
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
  ],
});

try {
  const aliceContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const bobContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const outsiderContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const alice = await aliceContext.newPage();
  const bob = await bobContext.newPage();
  const outsider = await outsiderContext.newPage();

  console.log("\n# Sign in to separate sessions");
  await signIn(alice, "alice@focusx.test");
  await signIn(bob, "bob@focusx.test");
  await signIn(outsider, "outsider@focusx.test");
  check("three independent accounts sign in", true);

  console.log("\n# Room creation and invite");
  await alice.getByLabel("Subject").fill("Physics MCQs");
  await alice.getByLabel("Round length").selectOption("10");
  await alice.getByRole("button", { name: "Create room" }).click();
  await alice.waitForURL(/\/rooms\/[0-9a-f-]{36}$/, { timeout: 20000 });
  const roomPath = new URL(alice.url()).pathname;
  const roomId = roomPath.split("/").pop();
  const inviteHref = await alice
    .getByRole("link", { name: "Open invite link" })
    .getAttribute("href");
  const joinCode = inviteHref.split("/").pop();
  check("host creates a private room", Boolean(roomId), roomPath);

  await outsider.goto(`${BASE}${roomPath}`);
  await waitText(outsider, "This room is private");
  const outsiderBody = await outsider.locator("body").innerText();
  check(
    "outsider cannot read room goals or results",
    outsiderBody.includes("This room is private") &&
      !outsiderBody.includes("Set your goal"),
  );

  await outsider.goto(`${BASE}/join/${joinCode}`);
  await waitText(outsider, "Physics MCQs");
  const previewBody = await outsider.locator("body").innerText();
  check(
    "invite preview shows only room basics",
    previewBody.includes("Alice Khan") &&
      previewBody.includes("10-minute") &&
      !previewBody.includes("Measurable goal"),
  );
  await outsider.goto(`${BASE}/join/0000000000`);
  await waitText(outsider, "Invite unavailable");
  check("invalid invite fails", true);

  await bob.goto(`${BASE}/join/${joinCode}`);
  await bob.getByRole("button", { name: "Accept invite" }).click();
  await bob.waitForURL(new RegExp(`${roomPath}$`), { timeout: 20000 });
  check("invited account joins the room", bob.url().endsWith(roomPath));

  console.log("\n# Goals, ready-up, shared round");
  await setGoal(alice, "Solve 15 Physics MCQs and review three mistakes");
  await setGoal(bob, "Revise 20 biology flashcards and two past-paper items");
  // No manual reload: the waiting room has to poll ready state on its own.
  await waitText(alice, "2 of 2 ready", 35000);
  check("both members have a goal and ready state", true);

  const startButton = alice.getByRole("button", { name: "Start round 1" });
  check("host start is enabled", await startButton.isEnabled());
  await startButton.click();
  await waitText(alice, "Studying together", 20000);
  await waitText(bob, "Studying together", 30000);
  check("both members see the started round without a manual reload", true);
  await alice.reload();
  await bob.reload();

  const aliceRemaining = await countdownSeconds(alice);
  const bobRemaining = await countdownSeconds(bob);
  check(
    "both browsers read one shared server deadline",
    Math.abs(aliceRemaining - bobRemaining) <= 3 && aliceRemaining > 0,
    `alice ${aliceRemaining}s, bob ${bobRemaining}s`,
  );

  await bob.reload();
  await waitText(bob, "Studying together");
  check("reload returns the same round", true);
  await saveScreenshot(alice, "fx-001-desktop-live.png");

  console.log("\n# Early departure and timer continuity");
  await bob.getByRole("button", { name: "Leave this session" }).click();
  await bob.reload();
  await waitText(bob, "You left this session.");
  await alice.reload();
  const remainingAfterLeave = await countdownSeconds(alice);
  const aliceBody = await alice.locator("body").innerText();
  check(
    "leaving does not end the other member's timer",
    remainingAfterLeave > 0 &&
      aliceBody.includes("Left this session"),
    `${remainingAfterLeave}s left`,
  );

  console.log("\n# Timer expiry fixture (local SQL, 20 seconds)");
  sql(
    `update public.rounds set deadline = now() + interval '20 seconds', checkin_deadline = now() + interval '24 hours' where room_id = '${roomId}' and number = 1;`,
  );
  await alice.reload();
  await bob.reload();
  await waitText(alice, "Studying together");
  await waitText(alice, "Round over · check in", 40000);
  check("the countdown reaches the shared deadline", true);
  // No manual reload: the room polls and swaps in the check-in form itself.
  await waitText(alice, "Your check-in", 30000);
  check("check-in opens without a manual reload", true);
  await alice.reload();
  await bob.reload();
  await waitText(alice, "Your check-in");
  await waitText(bob, "Your check-in");
  check("check-in opens after the server deadline", true);

  console.log("\n# Self-owned outcomes");
  await alice.getByRole("radio", { name: "Completed", exact: true }).check();
  await alice.getByLabel("Short note (optional)").fill("Finished all 15 and reviewed three.");
  await alice.getByRole("button", { name: "Share check-in" }).click();
  await alice.getByRole("button", { name: "Update check-in" }).waitFor({
    timeout: 20000,
  });

  await bob.reload();
  await waitText(bob, "Finished all 15 and reviewed three.");
  await bob.getByRole("radio", { name: "Partly completed", exact: true }).check();
  await bob.getByLabel("Short note (optional)").fill("Finished 9 of 20 flashcards.");
  await bob.getByRole("button", { name: "Share check-in" }).click();
  await bob.getByRole("button", { name: "Update check-in" }).waitFor({
    timeout: 20000,
  });

  await alice.reload();
  await bob.reload();
  const aliceCheckinBody = await alice.locator("body").innerText();
  const bobCheckinBody = await bob.locator("body").innerText();
  check(
    "both members see both outcomes and notes",
    aliceCheckinBody.includes("Partly completed") &&
      aliceCheckinBody.includes("Finished 9 of 20 flashcards.") &&
      bobCheckinBody.includes("Completed") &&
      bobCheckinBody.includes("Finished all 15 and reviewed three."),
  );

  console.log("\n# Mutual peer response");
  await bob.getByRole("button", { name: "Acknowledge Alice Khan" }).click();
  await waitText(bob, "You acknowledged their result");
  await alice.reload();
  await alice.getByRole("button", { name: "Acknowledge Bob Ahmed" }).click();
  await waitText(alice, "You acknowledged their result");
  await bob.reload();
  const bobAfterResponse = await bob.locator("body").innerText();
  check(
    "each member's acknowledgement is visible to the room",
    bobAfterResponse.includes("Peer acknowledged this result"),
  );
  await saveScreenshot(bob, "fx-001-desktop-checkin.png");

  console.log("\n# Duplicate and ownership checks");
  await alice.getByRole("radio", { name: "Missed", exact: true }).check();
  await alice.getByRole("button", { name: "Update check-in" }).click();
  await alice.getByRole("button", { name: "Update check-in" }).waitFor({
    timeout: 20000,
  });
  await alice.reload();
  await bob.reload();
  const roundOneId = sql(
    `select id from public.rounds where room_id = '${roomId}' and number = 1;`,
  );
  const outcomeRows = sql(
    `select count(*) from public.round_outcomes where round_id = '${roundOneId}';`,
  );
  check("re-submitting an outcome keeps one row", outcomeRows === "2", `${outcomeRows} outcome rows`);
  check(
    "updated outcome replaces the earlier choice",
    (await bob.locator("body").innerText()).includes("Missed"),
  );

  const bobToken = await accessToken("bob@focusx.test");
  const aliceId = sql(
    "select id from public.profiles where username = 'alice';",
  );

  const patchResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/round_outcomes?round_id=eq.${roundOneId}&user_id=eq.${aliceId}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        apikey: ANON_KEY,
        authorization: `Bearer ${bobToken}`,
        prefer: "return=representation",
      },
      body: JSON.stringify({ status: "completed" }),
    },
  );
  const aliceStatus = sql(
    `select status from public.round_outcomes where round_id = '${roundOneId}' and user_id = '${aliceId}';`,
  );
  check(
    "a peer cannot change another member's outcome",
    !patchResponse.ok && aliceStatus === "missed",
    `PATCH ${patchResponse.status}, alice status ${aliceStatus}`,
  );

  const duplicateResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/respond_to_peer`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: ANON_KEY,
        authorization: `Bearer ${bobToken}`,
      },
      body: JSON.stringify({
        p_round_id: roundOneId,
        p_target_id: aliceId,
        p_kind: "acknowledged",
        p_note: "second attempt",
      }),
    },
  );
  const responseRows = sql(
    `select count(*) from public.round_responses where round_id = '${roundOneId}';`,
  );
  check(
    "retrying a peer response keeps one official response",
    responseRows === "2",
    `${responseRows} response rows, retry status ${duplicateResponse.status}`,
  );

  const selfResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/respond_to_peer`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: ANON_KEY,
      authorization: `Bearer ${bobToken}`,
    },
    body: JSON.stringify({
      p_round_id: roundOneId,
      p_target_id: sql("select id from public.profiles where username = 'bob';"),
      p_kind: "acknowledged",
      p_note: "self",
    }),
  });
  check("self response is rejected", !selfResponse.ok, `status ${selfResponse.status}`);

  console.log("\n# Second round and returning leaver");
  await alice.reload();
  await waitText(alice, "Next round");
  await setGoal(alice, "Rewrite the two weakest Physics formulas");
  await setGoal(bob, "Review the missed biology flashcards");
  await waitText(alice, "2 of 2 ready", 35000);
  await alice.getByRole("button", { name: "Start round 2" }).click();
  await waitText(alice, "Studying together", 20000);
  await waitText(bob, "Studying together", 30000);
  await bob.getByRole("button", { name: "Leave this session" }).click();
  await bob.reload();
  await waitText(bob, "You left this session.");
  await alice.reload();
  const roundTwoRemaining = await countdownSeconds(alice);
  check(
    "round two continues for the remaining member",
    roundTwoRemaining > 0 &&
      (await alice.locator("body").innerText()).includes("Left this session"),
    `${roundTwoRemaining}s left`,
  );
  const bobReturnBody = await bob.locator("body").innerText();
  check(
    "the early leaver can return to the room",
    bobReturnBody.includes("Round 2") &&
      bobReturnBody.includes("You left this session."),
  );

  console.log("");
  console.log("# Stale session recovery");
  const staleContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const stale = await staleContext.newPage();
  const stamp = Date.now();
  const staleEmail = `stale${stamp}@focusx.test`;
  const staleUsername = `stale${stamp}`;
  await stale.goto(`${BASE}/register`);
  await stale.getByLabel("Full name").fill("Stale Account");
  await stale.getByLabel("Username").fill(staleUsername);
  await stale.getByLabel("Email").fill(staleEmail);
  await stale.getByLabel("Password").fill(PASSWORD);
  await stale.getByRole("button", { name: "Create account" }).click();
  await stale.waitForURL("**/rooms", { timeout: 20000 });
  sql(`delete from auth.users where email = '${staleEmail}';`);
  await stale.goto(`${BASE}/rooms`);
  await waitText(stale, "no longer matches an account");
  check(
    "a session whose account was removed is asked to sign in again",
    stale.url().includes("/login?stale=1"),
    stale.url(),
  );
  await staleContext.close();
  console.log("\n# Mobile layout");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const mobile = await mobileContext.newPage();
  await signIn(mobile, "bob@focusx.test");
  await mobile.goto(`${BASE}${roomPath}`);
  await waitText(mobile, "Physics MCQs");
  const overflow = await mobile.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  check("mobile room has no sideways scrolling", !overflow);
  await saveScreenshot(mobile, "fx-001-mobile-room.png");
} catch (error) {
  failures += 1;
  console.error("\nERROR", error);
} finally {
  await browser.close();
}

console.log(`\n${checks - failures}/${checks} checks passed.`);
process.exit(failures === 0 ? 0 : 1);
