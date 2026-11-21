# M12 · MDCAT learning, practice, and revision

**Owns** curriculum versions, learning objectives, published items, Today's Study, practice attempts, a due-review queue, and mock feedback. Start in the web app. Offer the completed-practice event to M10 through a stable attempt ID and a reviewed quest ID.

| Record | Responsibility |
| --- | --- |
| Curriculum and objective | Exam year, official source, reviewed topic and objective text or reference |
| Versioned item | Objective, answer, rationale, format, language, review status, and version |
| Practice attempt | User, stable attempt/item version IDs, response, confidence, derived result, and recorded time |
| Review state | User and objective, next due date, last distinct evidence, and review stage |
| Mock configuration and attempt | Year, verified source, format rules, submitted answers, score, and pacing by question or section |

For the first web practice slice, score submitted items against approved answer versions on the server. Show feedback after an attempt is submitted. Use deterministic scheduling. A wrong answer or a guess is due the next day; a correct, confident review on a fresh item advances through starting intervals of 1, 3, 7, and 14 days. These intervals are configurable starting defaults. Use local study dates with a timezone setting. Count repeated identical questions as practice and reserve stronger progress labels for distinct evidence. Daily plans prioritize due reviews and one syllabus objective within available time. Allow rescheduling and explain why each task was recommended.

Show separate practice and mock modes. Mock timing follows the verified year configuration. Hold answers until submission and derive feedback from recorded attempts. For offline practice packs, use versioned downloadable content and idempotent later sync. The server rechecks submissions on reconnect. Keep offline self-practice history usable even if an item has since retired, and use only eligible checked completions for ranked quests. Keep examination simulations and rewarded integrity claims separate from immediate offline answer previews.

**Acceptance.** A student misses or guesses an item, receives an explanation, and gets a fresh question for the same objective on the next study day. A duplicate submission does not create a duplicate score or reward. A correction preserves the old attempt and removes retired content from new assignments. Timed mocks show outcomes and a suggested follow-up. Other users cannot read individual attempts.

[Learning design](../MDCAT-LEARNING-DESIGN.md) · [Test matrix](../TEST-MATRIX.md)
