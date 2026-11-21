# FocusX verification matrix

Record actual results and the relevant browser, account, or environment in the [evidence template](../harness/EVIDENCE-TEMPLATE.md).

| ID | Scenario | Pass evidence |
| --- | --- | --- |
| S1 | Two ready users start a shared timer and refresh one browser | Both see the same server deadline and remaining time. |
| S2 | One student leaves while the other remains; a browser reconnects | The second timer continues. The first user can submit a result through the allowed window. |
| W1 | Sign up or use test accounts, log in and out, open profile and history | Authenticated routes and personal information are scoped to the correct user. |
| W2 | Two account profiles and an anonymous or outsider read attempt | Private goals, history and mutations are accessible only to the intended owner or permitted room. |
| W3 | Retry a personal study-history write | One stable study event, with intact result and account isolation. |
| G1 | Two students set goals, ready up, check in, and acknowledge each other | Both goals, outcomes and mutual review states appear in the member-only summary. |
| G2 | Outside-circle invite, preview, accept, expire, and revoke | Preview shares only allowed details. Live room data appears only after valid acceptance. |
| G3 | Friend relationship and circle membership joined through different consent actions | A room invite does not add friendship or broad circle access. |
| P1 | Three or four ready participants across two rounds | Every member gets one peer and one reviewer. Pairings rotate where possible and are stable during the round. |
| P2 | Partial result, early departure, missed check-in, absent reviewer and fallback | Outcomes stay distinct. Outstanding work remains visible. A reviewer can close an absent peer's review as **No check-in received**, and another eligible member can pick up an expired review once. |
| P3 | A peer attempts to edit another user's outcome or post an unassigned response | Ownership is enforced and the recipient's result stays intact. |
| P4 | Send, skip, delete, expire and report a private video | Only selected recipients can play it. Standard accountability works when recording is skipped or unavailable. |
| Q1 | Retry awards, overlap focus sessions, reach daily cap and cross weekly reset | Only eligible completions score once. Caps and periods are applied consistently. |
| Q2 | Rank ties, a small regional cohort and ranking opt-out | Ties share a rank. Ineligible rows stay hidden. Opt-out removes public ranking visibility. |
| L1 | Complete today's topic using a chosen time budget | A practical task is shown and can be rescheduled. |
| L2 | Submit wrong and guessed answers, then advance the review date | Both get explanations and return as review. Use a fresh variant where available. |
| L3 | Retry an attempt, retire or correct an item, and view another user's result | Attempts and awards do not duplicate. Old history retains the version. Other users' records stay private. |
| L4 | Resume, mark, expire, and submit a timed set | One score appears after submission, with pacing feedback and a next task. |
| C1 | Same-topic resources with different use and recommendation counts plus language filters | Highest recommendation count wins within valid results. |
| C2 | Open without confirming use, retry and remove a vote, submit duplicate video URL | Opens alone do not count. Only one vote survives, removal is reflected, and duplicate URLs do not split votes. |
| C3 | Zero-vote topic, unpublished link, and a filter with no matches | A labeled fallback or empty state appears and unpublished entries are absent. |
| C4 | Attempt to read another user's resource action and open a link from a timed room | Learner actions are private except for aggregates. Opening study material leaves the timer and progress intact. |
