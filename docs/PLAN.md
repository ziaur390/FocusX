# FocusX development plan

## First release

Build one private web room where two people can set separate study goals, ready up, follow a shared timer, report what they got done, and acknowledge each other's check-in. One participant can end their own participation while the other continues. Each participant's result and response are visible to the other. This is **FX-001**.

The smallest end-to-end test uses two authenticated accounts in separate browser profiles and a third outsider account for access checks. Use the current Next.js and Supabase scaffold. Implement on a feature branch, hand off the pull request and preview, and let Zia review the actual behavior before merge. [First coding task](../harness/tasks/FX-001.md) · [GitHub workflow](GITHUB-WORKFLOW.md)

## Release milestones

| Milestone | Build | Exit check |
| --- | --- | --- |
| R0 · Two-person accountability room | Shared timer, member goals, ready-up, honest outcomes, and mutual response | Two accounts each commit, report a result, and acknowledge the other. A third account cannot read the private room. |
| R1 · Personal workspace | Account onboarding, profile, daily goals, and study history | A student sees personal session results and open circle check-ins in their dashboard. |
| R2 · Circles and invitations | Friends, persistent private circles, outside-circle one-room invites, scheduling, and reactions | An invited person previews and accepts one room. Friendship and circle membership have separate consent. |
| R3 · Accountability across a circle | Rotating peer assignments, missed check-ins, reassignment, and accountability summaries | Every ready participant is accountable both as a contributor and reviewer in a room of three or more. An absent reviewer leaves a visible pending item that can be picked up. |
| R4 · First MDCAT learning flow | Syllabus objective, Today's Study, reviewed MCQs, feedback, and scheduled revision | One complete topic leads from practice to an actionable review. |
| R5 · Recommended resources | Top lectures and notes for each topic, used-and-recommended votes, filters, and review queue | Highest approved recommendation count wins within the topic. A zero-vote topic has a clear fallback. |
| R6 · Quests and rankings | Focus and practice quests, squad challenges, points, friends and opt-in regional boards | Server assigns eligible points once with caps. Rankings use approved visibility and aliases. |
| R7 · Optional private updates | Text and short video to selected accepted friends | A student can complete the room check-in with a simple status. Optional media has recipient controls, deletion, expiry, and report. |
| R8 · Exam preparation | Timed mixed sets, year-specific mock setup, score and pace feedback | A completed set reveals explanations and recommends concrete follow-up practice. |

Keep private circles and the accountability loop usable from the start. Build the first learning topic and recommended-resource picker as soon as the personal workspace can store private attempts. Low-data practice packs, reviewed Urdu explanations, buddy quizzes, and an admissions checklist are learning follow-ups. [Complete feature list](FEATURES.md) · [Required feature checks](REQUIRED-FEATURES.md)

## First week on Windows

| Day | Work | Proof |
| --- | --- | --- |
| 1 | Inspect the existing scaffold. Start FX-001. Bring up a development database with two test accounts and basic session access. | Two browser profiles can sign in as different members. |
| 2 | Add private room creation, invite acceptance, and goal entry. | A peer joins by invite and a third account cannot read the room before acceptance. |
| 3 | Add ready-up and a shared deadline. | Both browsers show the same round and recover the countdown after refresh. |
| 4 | Add result check-ins and mutual acknowledgment. | Both students publish independent outcomes and can see their accountability state. |
| 5 | Test leave, pending check-ins, repeated submit, membership isolation, and reconnect. | One person leaves while the other continues. Retries create one record. |
| 6 | Review FX-001 and fix failures. | Recorded two-person walkthrough, third-account access check, and relevant build/test results. |
| 7 | Run a small pilot with friends and prioritize personal history or circle features using their feedback. | Observe whether students understand the goal, report partial progress honestly, and respond to a peer. |

Treat these as work sessions. Continue the first slice until it can be demonstrated with real users in separate browser sessions.

## Development setup

| Tool | Use |
| --- | --- |
| PowerShell 7, Git and Pi | Open the workspace, load the task, run checks and review the change. |
| Node.js and npm | Install the existing Next.js dependencies and run local scripts. |
| Supabase | Use a local stack or an isolated hosted development project for Auth and Postgres. |
| Two browser profiles plus an outsider | Test independent login sessions, shared room state, and access boundaries. |

Start the pilot by asking whether participants knew what each person planned, saw a result, and knew whom to respond to. Record that feedback before expanding game mechanics.
