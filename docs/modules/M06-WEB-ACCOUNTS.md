# M06 · Web and accounts

**Owns** Next.js and Supabase Auth integration, account sign-in and sign-up, profile, and personal history. The first room needs authenticated test accounts and server checks. Onboarding, profile editing, and the personal dashboard follow in FX-003.

- Verify identity and authorization on the server. Use protected routes and user-scoped actions. Test signup, confirmation, login and logout with the development environment.
- A profile holds display name, unique username when used, exam track/year, study goal and reporting timezone. Use readable field labels and privacy-safe defaults.
- Personal history shows the student's own rounds, goals/results, and open or completed peer tasks. Record stable session and outcome keys to avoid duplicate events on retries.
- Friends, rooms, and their permitted shared summaries use their own membership checks. Private practice history stays personal.

**Acceptance.** One account can edit its profile and see its own history. Another account and an anonymous visitor cannot read it. A retry leaves one history entry. [First room](../../harness/tasks/FX-001.md) · [Personal workspace task](../../harness/tasks/FX-003.md)
