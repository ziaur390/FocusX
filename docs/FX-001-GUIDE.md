# FX-001 guide · the two-person accountability room

This guide explains what the first FocusX slice does, how it is put together, how to run and test it locally, and what is deliberately left for later tasks. Use it with the [task brief](../harness/tasks/FX-001.md), the [review checklist](REVIEW-FX-001.md) and the [evidence record](../harness/evidence/FX-001.md).

## 1. What a student can do

| Step | Student A (host) | Student B (invited) |
| --- | --- | --- |
| 1 | Creates a room with a subject and a round length (10/15/25/45/60 minutes). | — |
| 2 | Shares the invite link `/join/<code>` or the 10-character room code. | Opens the link, sees subject, host, duration and member count, then accepts. |
| 3 | Writes one measurable goal and marks ready. | Writes a different goal and marks ready. |
| 4 | Starts the round when two members are ready. | Sees the same server deadline. |
| 5 | Studies, can leave the session without ending the room. | Studies, can leave and return. |
| 6 | After the deadline: **Completed**, **Partly completed** or **Missed**, plus an optional note. | Same, self-owned check-in. |
| 7 | Acknowledges B's result, or records **No check-in received** after the window. | Acknowledges A's result under the same rules. |
| 8 | Host can start a new round after the current round's deadline; earlier check-ins stay visible. | Can join the next round, or check in later for an earlier round. |

The pair is mutual in a two-person round: each member is the other's assigned peer. A member never reviews themselves, and a peer response never changes someone else's goal or outcome.

## 2. Room state

```text
waiting ──(host starts, 2 ready)──▶ studying ──(deadline)──▶ check-in open ──(24 h)──▶ closed
   ▲                                   │                            │
   └────────── next round ─────────────┴────────────────────────────┘
```

- `waiting`: goals and ready state are editable. A round can only start with two members who have a goal and are ready.
- `studying`: the ready roster and goals are frozen into `round_members`. The browser shows remaining time from `rounds.deadline`.
- `check-in open`: from the deadline until `checkin_deadline` (deadline + 24 hours). Members can submit or update their own outcome and post one peer response.
- `closed`: read-only history. A missing outcome stays visible as **No check-in**.
- Leaving sets `round_members.left_at`. It never shortens the other member's deadline and never closes the leaver's check-in.
- Starting a new round is allowed after the previous deadline, even while earlier check-ins are still open. Old rounds stay on the page until their window closes, then remain in the list as history.

## 3. Who can read and change what

| Record | Read | Write |
| --- | --- | --- |
| Room, member list, rounds | Accepted room members | `create_room` / `join_room_by_code` / `start_round` RPCs (= server-validated) |
| Invite preview | Anyone holding the code | Never; only subject, host name, duration and member count |
| Goal and ready state | Room members | The member themself, and only before a live round starts (`room_members` update policy) |
| Outcome | Round members | The member themself through `submit_outcome`; the function always writes `auth.uid()` |
| Peer response | Round members | The assigned peer only, once, through `respond_to_peer`; retries are idempotent |
| Account profile | The owner | The owner (existing `profiles` policies). Room members only see names through `room_member_directory` |

Implementation notes:

- All room tables have RLS enabled. `authenticated` gets `select` only; direct inserts and updates are revoked except for a member's own `goal` / `is_ready`.
- Membership checks (`fx_is_room_member`, `fx_is_round_member`) and timing checks run in `security definer` functions with `set search_path = ''` so policies cannot recurse and search paths cannot be hijacked.
- Room creation, joining, starting, leaving, check-in and peer response are RPCs, so the client cannot forge a room id, an author id or a timestamp.
- The invite code is 10 hex characters (about 40 bits), unique. Expiry and revocation are FX-004.

## 4. Data model

| Table | Purpose | Key rules |
| --- | --- | --- |
| `rooms` | Subject, duration, host, join code, current round number | `duration_minutes` 1–180 |
| `room_members` | One row per accepted member: current goal and ready flag | At least one member per room is the host; ready requires a goal |
| `rounds` | One started round: number, `started_at`, `deadline`, `checkin_deadline` | `unique (room_id, number)`, deadline after start, check-in deadline after deadline |
| `round_members` | Frozen ready roster and goal snapshot, `left_at` | One row per ready member per round |
| `round_outcomes` | Self-reported outcome and note | One row per member per round; status is `completed` / `partly` / `missed` |
| `round_responses` | Peer acknowledgement | One outgoing response per member and one incoming response per outcome |

Two new functions support the UI: `fx_peer_for` (stable cyclic peer: with two members they point at each other) and `fx_create_profile_for_new_user` (sign-up metadata creates the profile in the same transaction, so a taken username does not leave an account without a profile).

## 5. Code map

| Path | Responsibility |
| --- | --- |
| `apps/web/src/app/page.tsx` | Landing page and sign-in redirect |
| `apps/web/src/app/login`, `register` | Supabase email/password auth with server actions |
| `apps/web/src/app/auth/actions.ts` | `signInAction`, `signUpAction`, `signOutAction` |
| `apps/web/src/app/rooms/page.tsx` | Room list, create form, join-by-code form |
| `apps/web/src/app/rooms/[id]/page.tsx` | Room header, live timer, ready-up panel, round history |
| `apps/web/src/app/rooms/[id]/round-card.tsx` | Goals, outcomes, check-in form, peer response form |
| `apps/web/src/app/rooms/actions.ts` | Server actions for create/join/goal/start/leave/check-in/response |
| `apps/web/src/app/join/[code]/page.tsx` | Invite preview and accept |
| `apps/web/src/components/countdown.tsx` | Client countdown derived from the server deadline |
| `apps/web/src/components/action-form.tsx` | Shared form state, pending and error display |
| `apps/web/src/lib/room.ts` | Pure rules: phases, formatting, validation, pairing (unit tested) |
| `apps/web/src/lib/rooms.ts` | Server-side room snapshot loader |
| `supabase/migrations/202611210002_fx001_accountability_room.sql` | Tables, policies, RPCs and trigger |
| `scripts/seed-dev-users.mjs` | Creates the three synthetic development accounts |
| `harness/e2e/fx-001.mjs` | Playwright browser + API verification |

## 6. Local setup

Prerequisites: Node.js 22+, npm, Git, Docker Desktop, PowerShell 7 (for the plan checker), and two browser profiles or one normal plus one private window.

```powershell
Set-Location 'C:\Users\ziaur\OneDrive\Desktop\focusx'
npm ci
npx supabase start
node scripts/seed-dev-users.mjs
```

Create `apps/web/.env.local` (it is git-ignored and never committed):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key from npx supabase status>
```

The publishable key is safe for the browser; never commit the service/secret role key.

Start the app:

```powershell
npm run dev
```

Open `http://localhost:3000`. Use `localhost`, not `127.0.0.1`: Next 16 blocks some development resources across those origins, which can freeze client components such as the countdown. The repo allows `127.0.0.1` as a dev origin, but `localhost` is the tested path.

Optional speed-up: the first `supabase start` pulls images. If you only need Auth, REST and Postgres, exclude the unused services:

```powershell
npx --yes supabase@3.2.0 start -x studio,imgproxy,storage-api,realtime,edge-runtime,logflare,vector,postgres-meta,mailpit
```

Synthetic accounts created by the seed script (passwords come from `SEED_PASSWORD`, with a development default printed by the script):

| Account | Role in the walkthrough |
| --- | --- |
| `alice@focusx.test` | Host |
| `bob@focusx.test` | Invited peer |
| `outsider@focusx.test` | Third account for access checks |

## 7. Next round or clean slate

- Applied migrations: `202611210001_focus_foundation.sql` (profiles/study sessions) and `202611210002_fx001_accountability_room.sql`.
- Recreate the database and apply both migrations: `npx supabase db reset` (this deletes rooms and accounts; run the seed script again).
- The seed script is idempotent: it skips existing emails.
- Stop the stack: `npx supabase stop`. Use `npx supabase stop --no-backup` if you want to discard local data.

## 8. Walkthrough for review

1. Sign in as Alice in browser profile A, Bob in profile B, and the outsider in profile C.
2. As Alice, create a room and copy `/join/<code>`. As the outsider, open the room URL: it must show “This room is private”. Open the invite link: it must show only subject, host, duration and member count.
3. As Bob, accept the invite. Both members write goals and mark ready. Alice starts round 1.
4. Compare the countdowns; reload Bob: same round, same deadline. Bob leaves; Alice's timer continues. Bob's departure is visible in the room.
5. For a fast check-in, shorten the round locally (development only):

```sql
update public.rounds
set deadline = now() + interval '20 seconds',
    checkin_deadline = now() + interval '24 hours'
where room_id = '<room id>' and number = 1;
```

Reload both pages. At `00:00`, the check-in forms appear.
6. Submit Alice **Completed** and Bob **Partly completed** with notes. Each acknowledges the other. Reload: both results and both responses are visible once.
7. Resubmit Alice's check-in and confirm the outcome row updates instead of duplicating. Try to PATCH the other member's outcome from the REST API with Bob's token: it must fail.
8. After the deadline, start round 2 as Alice. Bob leaves immediately; Alice's timer continues and Bob can return to the room.
9. Resize to about 390 px: no horizontal scrolling; timer, goals, check-in and response stay reachable.

## 9. Checks

Run from the repository root:

```powershell
.\scripts\check-plan.ps1
npm run lint
npm run typecheck
npm test
npm run build
```

Browser and API verification (local stack and dev server must be running):

```powershell
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node harness/e2e/fx-001.mjs
```

The script uses installed Google Chrome (`channel: "chrome"`); if you use the downloaded Chromium instead, remove the `channel` option. It rewrites the latest room deadline to 20 seconds once, so the check-in window is testable without waiting 10 minutes. It prints `PASS`/`FAIL` per check and saves screenshots to `harness/evidence/`. Last run: 23/23 checks passed; see [the evidence record](../harness/evidence/FX-001.md) for the full table.

## 10. Known limits and next tasks

| Limit | Handled by |
| --- | --- |
| Invite codes do not expire and cannot be revoked; no rate limiting on joins | FX-004 (persistent circles and outside invitations) |
| Pairing is a fixed cyclic offset; no rotation across rounds, no absent-reviewer fallback | FX-006 (larger-circle accountability) |
| No personal profile page, dashboard or private history yet | FX-003 |
| No realtime push; the room refreshes every 15 seconds and on actions | Acceptable for R0; revisit when rooms grow |
| The 24-hour check-in window was verified by moving the deadline in the local database, not by waiting a day | Repeat on the preview if needed |
| Local email confirmations are disabled; hosted environments must confirm accounts before signing in | Environment setup |
| No Vercel preview from this environment; CI runs on the pull request | Zia connects Vercel and the development Supabase project |

## 11. Publishing and review

The work is on `feat/fx-001-accountability-room`:

```text
ee4e3d5  FX-001: build the private two-person accountability room
091325f  FX-001: record browser, ownership and build evidence
```

Open the draft pull request from
`https://github.com/ziaur390/FocusX/compare/main...feat/fx-001-accountability-room?expand=1`
and paste the summary, commit, check results and preview link. Follow [Zia's review checklist](REVIEW-FX-001.md), then wait for CI (`FocusX CI`). Zia owns review and merge. After merge, update `harness/tasks.json` to `verified` if the preview checks pass.

## 12. Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Countdown never ticks, forms need a full reload | App opened on `127.0.0.1` in dev; use `http://localhost:3000` |
| `Supabase CLI command is still starting` | Another `supabase start` is running; wait or stop the stray process |
| `failed to connect to the docker API` | Start Docker Desktop and wait for the engine |
| Pages show the Supabase setup note | `apps/web/.env.local` is missing or has empty values; restart `npm run dev` after creating it |
| `Invite unavailable` for a valid code | The database was reset after the room was created, or the code is mistyped |
| No check-in form after the timer hits zero | The server deadline has not passed; reload, or check `rounds.deadline` |
| `new row violates row-level security policy` | A goal edit during a live round, or a write attempted outside the RPC |
| `violates foreign key constraint "rooms_host_id_fkey"` | The browser still holds a session for an account removed by `supabase db reset`. Refresh, then sign in again; the app now sends mismatched sessions to `/login?stale=1` |
| Playwright cannot find the browser | Run `npx playwright install chromium`, or use `channel: "chrome"` |
| e2e cannot sign in | Run the seed script against the same Supabase stack and confirm `.env.local` points to it |
| Test rooms clutter the room list | `npx supabase db reset` then run the seed script again |

## 13. Handoff notes

- The feature branch was published after the local baseline merge; `origin/main` holds the baseline and license.
- The development database currently contains rooms created by the e2e runs. They are synthetic and safe to delete with `npx supabase db reset`.
- No secrets, `.env.local`, private keys or browser profiles are committed.
- The [evidence record](../harness/evidence/FX-001.md) separates observed checks from pending ones and records the ownership/recovery behavior.
