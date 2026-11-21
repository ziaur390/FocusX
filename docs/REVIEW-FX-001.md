# Zia's review checklist for FX-001

Use the pull request's newest preview and confirm it is tied to the latest commit under review. Use an isolated development database with two participant accounts and an outsider. Open separate browser profiles for each login. The local fallback is `npm.cmd ci` and `npm.cmd run dev` from the repository root after setting up the development database.

## Visual review

| Check | What to look for |
| --- | --- |
| Desktop and mobile | Open at laptop width and about 390 px wide. Check readable goals, visible controls, sensible alignment, and all key actions reachable without sideways scrolling. |
| FocusX identity | White canvas, Deep Ink text, the violet accent, a calm shared timer, and a clear next action. Member rows should be easy to scan. |
| Ready, active and finished | Open all three states. The active timer is easy to find and each person can tell whether their next step is to enter a goal, check in, or respond. |
| Feedback | Show loading, invalid invite, retry or submission feedback as readable messages if tested. Use words for completed and pending statuses. |

[Brand and room guidelines](BRAND-IDENTITY.md)

## Functional review

1. Account A creates a private room. Account B accepts its invitation. The outsider attempts to open the room and sees no goals or results.
2. A and B each post a different study goal and mark ready. A starts a short round. Compare the countdowns and refresh B. B returns to the same round.
3. A reports **Completed**. B reports **Partly completed** with a short note. Both accounts can see the two outcomes and the next peer action.
4. A acknowledges B and B acknowledges A. Re-submit once. Each outcome and official response appears once. A peer cannot alter the other person's outcome.
5. Run a second round and have B leave early. A's timer continues. B can return to submit an allowed result. Pending actions are shown clearly.

## What Pi hands you

- PR URL and tested commit. Preview URL if deployed.
- A short summary of the changes and any migrations or env changes.
- Pass, fail or pending status for each automated and browser check, with screenshots of desktop and mobile views when possible.
- Exact steps to reproduce any issue and the next action if a check is pending.

Use **Pass**, **Needs changes**, or **Pending** in your review notes. A clear comment can be as short as “On mobile, after I submit my check-in, the peer response button is below an unlabeled section. Move it directly after the result.” Zia decides whether to merge. [Detailed matrix](TEST-MATRIX.md) · [GitHub workflow](GITHUB-WORKFLOW.md)
