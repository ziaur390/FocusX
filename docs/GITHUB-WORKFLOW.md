# FocusX GitHub setup and review workflow

**Repository** [ziaur390/FocusX](https://github.com/ziaur390/FocusX)
**SSH remote** `git@github.com:ziaur390/FocusX.git`
**Reviewer and merge owner** Zia

Pi implements a task on a feature branch, runs checks, pushes it, and opens a draft pull request when able. The pull request links a preview and shows actual test evidence. Zia reviews the running feature and decides when to merge into `main`.

## 1. Connect the repository

From your regular PowerShell window:

```powershell
Set-Location 'C:\Users\ziaur\OneDrive\Desktop\focusx'
git status --short --branch
git remote -v
ssh -T git@github.com
git ls-remote --symref origin HEAD
```

An SSH greeting that says you authenticated successfully is expected. GitHub may exit nonzero because it does not provide an interactive shell. If the key is new, add its **public** half to your GitHub account and compare a first-time host prompt with GitHub's published fingerprints. [Test GitHub SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/testing-your-ssh-connection) · [Add an SSH key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account) · [GitHub SSH fingerprints](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints)

If the GitHub repository does not exist, create a private repository named **FocusX** in your `ziaur390` account. Keep it empty when creating it so it can accept the existing local history. [Import an existing local repository](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)

If the repository is empty and the local `main` baseline is committed, publish the baseline once:

```powershell
git push -u origin main
```

If GitHub already has commits, fetch and inspect both histories first. If they have different origins, use a fresh clone and port the intended changes onto a branch based on the remote default branch. This keeps the existing GitHub history intact.

## 2. Start Task 1 on its own branch

When the local branch is already prepared, switch to it directly:

```powershell
git switch feat/fx-001-accountability-room
git status --short --branch
.\scripts\check-plan.ps1 -Task FX-001
pi
```

If starting a new task branch, update local `main` first with `git switch main` and `git pull --ff-only origin main`. Then create the branch with `git switch -c feat/fx-001-accountability-room`. Use `/focusx-build FX-001` inside Pi.

Pi installs dependencies at the repo root and commits the resulting `package-lock.json` with the first app change. Use `npm.cmd ci` on subsequent clean installs. Use a dedicated Supabase development project for the room database and synthetic test users. Copy `apps/web/.env.example` to `apps/web/.env.local` and set the project URL and publishable key. Keep the local env file, credentials, and private keys out of Git. Apply new migrations to the named development project for preview testing.

After testing locally, the agent stages only files for that task, commits, and pushes the branch:

```powershell
git status --short
git diff --check
git push -u origin feat/fx-001-accountability-room
```

The agent opens a draft PR with base `main` and compare `feat/fx-001-accountability-room` if authenticated GitHub tooling is available. If it can push but cannot create a PR, open it from the branch page using **Compare & pull request**. The pull request template captures the behavior, commit, checks, preview, and review steps.

## 3. Set up CI and review previews

| Service | Who sets it up | Setting |
| --- | --- | --- |
| GitHub Actions | Agent adds workflow. Zia checks repository settings. | `FocusX CI` runs on pull requests into `main`. **Plan checks** validates the harness. **Web checks** installs the locked dependencies, runs lint, typecheck and tests, then builds the app. |
| GitHub branch rules | Zia | When supported for this repository, require a PR and the two CI checks on `main`. Select the check names after their first runs. Keep merges manual. |
| Vercel | Zia connects the account and repository. | Import the GitHub repository, set Root Directory to `apps/web`, allow workspace files outside that directory, and use Node 22 for parity with CI. Confirm the root npm lockfile is used. |
| Supabase | Zia selects the projects. Agent prepares migrations and test evidence. | For local and Vercel Preview, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the development project. Apply room migrations there and seed synthetic accounts. |

Vercel's Git integration can build previews for feature branches. Review the PR preview with the development database. For public production, configure a separate Supabase project and Production environment variables when you are ready to release. If `main` is the production branch, a merge can start a production deployment. The GitHub Actions workflow in this repository runs checks and has read-only permissions. [Vercel Git deployments](https://vercel.com/docs/git) · [Vercel environment variables](https://vercel.com/docs/environment-variables) · [Vercel monorepo setup](https://vercel.com/docs/monorepos)

If Pi pushes under your GitHub account and the PR is authored by that same account, GitHub does not let the author submit an **Approve** review. As the solo owner, review the preview and files yourself, leave your decision on the PR and merge it manually once checks pass. Avoid requiring a separate approving review until a distinct reviewer account is available. Branch protection in a private repository depends on your GitHub plan. [GitHub PR reviews](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/reviewing-proposed-changes-in-a-pull-request) · [Protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

## 4. Review and repeat

1. Open the PR, confirm its commit and check statuses, and open the matching preview.
2. Follow the [FX-001 review checklist](REVIEW-FX-001.md). Test the actual app, then check the evidence against the PR's latest commit.
3. If a change is needed, leave a short concrete comment with the page, action, expected behavior, and what actually happened. Pi makes a follow-up commit on the same branch and pushes it. Reopen the new preview.
4. When you're satisfied, merge the PR manually and verify the deployment state. Before the next feature, switch to `main` and run `git pull --ff-only origin main`.

To recover from a bad merged change, use a revert PR and verify the recovered build. Treat database migrations separately: keep them versioned, apply them deliberately to the intended environment, and plan forward-compatible fixes.
