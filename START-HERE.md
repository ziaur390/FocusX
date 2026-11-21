# FocusX engineering plan

FocusX helps friends study together and hold each other accountable. For each session, every member posts a goal, shares what they did, and responds to a peer's check-in. The first audience is MDCAT aspirants in Pakistan.

Start with a **private web room for two students**. Each student enters a measurable goal and marks ready. They share a timer, submit separate outcomes, and acknowledge each other's result. Both students can leave whenever they need to, and unfinished check-ins or reviews remain visible to the room.

| Read | What it covers |
| --- | --- |
| [First coding task](harness/tasks/FX-001.md) | Build the two-person accountability room |
| [FX-001 guide](docs/FX-001-GUIDE.md) | What the room does, how to run it, test it and review it |
| [PLAN.md](docs/PLAN.md) | Release order and first-week build |
| [FEATURES.md](docs/FEATURES.md) | Complete feature list |
| [REQUIRED-FEATURES.md](docs/REQUIRED-FEATURES.md) | Acceptance checks for committed features |
| [PRODUCT-DESIGN.md](docs/PRODUCT-DESIGN.md) | Screens and study session flow |
| [BRAND-IDENTITY.md](docs/BRAND-IDENTITY.md) | Dot-first logo, color palette, typography and room styling |
| [SOCIAL-GAME-DESIGN.md](docs/SOCIAL-GAME-DESIGN.md) | Private circles, check-ins, mutual review, points and rankings |
| [MDCAT-LEARNING-DESIGN.md](docs/MDCAT-LEARNING-DESIGN.md) | Daily planning, MCQs, revision, recommended resources and mocks |
| [SYSTEM-DESIGN.md](docs/SYSTEM-DESIGN.md) | Membership, room state, private data and recovery |
| [Module index](docs/modules/README.md) | Responsibilities and implementation slices |
| [HARNESS.md](docs/HARNESS.md) | Pi, OpenCode Go and verification |
| [GITHUB-WORKFLOW.md](docs/GITHUB-WORKFLOW.md) | SSH remote, branches, GitHub Actions, preview setup and review |
| [REVIEW-FX-001.md](docs/REVIEW-FX-001.md) | Visual and functional review for Zia |
| [TEST-MATRIX.md](docs/TEST-MATRIX.md) | Two-person, group, privacy and learning tests |

From the project folder in PowerShell 7:

```powershell
.\scripts\check-plan.ps1 -Task FX-001
pi
```

At the Pi prompt, use `/focusx-build FX-001`. The current repository contains a small web and Supabase scaffold. The two-person accountability room is implemented on `feat/fx-001-accountability-room` and awaits review.

For setup, local accounts, the review walkthrough, checks and troubleshooting, read the [FX-001 guide](docs/FX-001-GUIDE.md).
