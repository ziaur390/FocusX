# FocusX engineering harness

## Start in Pi

Follow the [GitHub setup](GITHUB-WORKFLOW.md) to publish the baseline and use a task branch. Run this from the project root on Windows:

```powershell
.\scripts\check-plan.ps1 -Task FX-001
pi
```

At the Pi prompt, type `/focusx-build FX-001`. Use your configured OpenCode Go model. If the custom command is not visible, paste the following task prompt:

> Read AGENTS.md and harness/tasks/FX-001.md. Implement the two-person accountability room using the existing web scaffold and a dedicated dev database. Each person posts a goal, reports a result, and acknowledges the other. Verify using two independently authenticated browsers and one outsider. Report actual results and pending checks.

Use `/focusx-review FX-001` in a fresh Pi session after the first slice. Ask the reviewer to check membership, ownership, shared deadline, duplicate submissions, and any gaps in multi-account evidence.

## Work one small slice at a time

| Step | Output |
| --- | --- |
| Load | Check the task's dependencies and read its module docs. |
| Build | Inspect current files and make the smallest complete change through the normal entry point. |
| Verify | Run available commands and task scenarios, then record creation, check-in and peer response from separate browser sessions. |
| Review | Inspect the diff, then hand Zia the PR, preview and evidence. Use the [FX-001 review checklist](REVIEW-FX-001.md) for the first demo. |
| Resume | Save a concise handoff if a dependency or browser test remains. |

Use `git status --short` before work. Keep task edits isolated if the developer is changing related files. Use deterministic fixtures for clock and scoring tests when they help. Always distinguish independently observed behavior from expectations. Use the [evidence template](../harness/EVIDENCE-TEMPLATE.md) and [test matrix](TEST-MATRIX.md).

| Slice | Task | Minimum evidence |
| --- | --- | --- |
| First shared room | FX-001 | Two signed-in users each post a goal, submit an outcome, and acknowledge the other. An outsider read fails. |
| Accounts and circles | FX-003, FX-004 | Login/profile privacy, explicit invitation acceptance and scoped room membership. |
| Mutual review across circles | FX-006 | Stable and rotating assignments, check-in and response completion, and authorized fallback. |
| Learning and resources | FX-007, FX-009, FX-010 | Reviewed content, practice history isolation, mocks and deterministic recommendation ranking. |
| Game and private updates | FX-005, FX-008 | Duplicate-resistant points, rank visibility and authorized recipient playback. |

Update task status in [the manifest](../harness/tasks.json) only to reflect actual work. `verified` means the relevant task checks have run and have evidence.
