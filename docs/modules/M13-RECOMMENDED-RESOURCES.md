# M13 · Recommended study resources

**Owns** short, topic-specific lists of lectures and notes that FocusX students say helped them. Today's Study and mistake review link to the list for the current MDCAT learning objective.

## Student experience

1. Tap **What should I watch or read?** from a topic or a missed question.
2. See **Most recommended** and up to two alternatives. Each card shows creator, language, format, duration or reading length, confirmed uses, and recommendations.
3. Filter by language, lecture or notes, duration, or concept explanation vs. MCQ walkthrough. Sort inside the filtered topic.
4. Open the resource at its original source. On return, choose **I used this**, then optionally tap **Recommend** and choose a reason such as **Clear explanation**, **Good diagrams**, or **Helpful for numericals**.
5. Try the topic's checked MCQs, save the resource for later, or pick another format.

**Illustrative ranking for series and parallel circuits**

| Resource | Format | Students who marked it used | Recommendations |
| --- | --- | ---: | ---: |
| Circuits concept lecture | Urdu, 24 min | 120 | 92 |
| Resistor calculations walkthrough | English, 12 min | 142 | 71 |
| Circuit rules and worked examples | Notes | 39 | 28 |

The first item wins with 92 recommendations. A short-lecture filter can surface the 12-minute option. Show the real count when a resource has only early recommendations. With zero votes, show an approved **Editor's pick** with its actual zero count. If the topic has no approved candidates, show a clear empty state and a link to practice. Allow the student to clear filters when nothing matches.

## Ranking and vote integrity

- Count recommendations only after a signed-in learner marks the resource as used. An open does not confirm use. Display use as self-reported. FocusX does not need access to YouTube watch history or public view statistics.
- Allow one current recommendation per account and resource for each learning objective. An account may remove its own vote. Marking the resource no longer used also clears the recommendation. Normalize alternate URLs for the same YouTube video to the same identity before publication. If moderated duplicates are merged, deduplicate votes from the same account.
- Order approved resources by recommendation count descending within the same versioned curriculum objective and active filters. Break ties by distinct learner use, then a stable resource ID. Revalidate topic alignment when the curriculum changes. Keep overall YouTube popularity out of FocusX ranking.
- Show aggregate data only. Keep individual votes and use histories private. Use authenticated writes, a unique account/topic/resource constraint, rate limits, and a way to review or remove abusive votes. Do not award game points for votes.

## Resource review and playback

Seed a small reviewed list per topic. Learners may submit a new link with its objective and proposed format. An editor checks the working link, topic match, language, attribution, and source before publishing. Use links from original creators or authorized publishers. Keep a **Report broken or off-topic** option. Unpublished or withdrawn entries disappear from results.

Normalize supported YouTube watch and short-link formats and strip unrelated query parameters. Require a valid HTTPS link to the original source. Accept other approved content such as notes, diagrams, or worked examples. The first release opens the original resource and uses manually reviewed metadata. Avoid arbitrary server-side fetching of submitted URLs. No download of YouTube media is needed.

Open the resource directly or let the student save it for later. A student can consult a lecture in a study session and return to the same room timer and goal. If a later release embeds YouTube, keep the standard player controls and related links. [YouTube developer policies](https://developers.google.com/youtube/terms/developer-policies-guide)

## Records

| Record | Contents |
| --- | --- |
| Resource | Canonical external key, approved URL, creator, type, title, language, duration and review state |
| Objective mapping | Resource ID, versioned objective, scope and publication state |
| Learner action | Account, mapping, use confirmation, recommendation, optional reason tag |
| Display aggregate | Mapping, distinct confirmed uses, distinct recommendations |

Prevent public reads of raw actions. Editors can publish or withdraw mappings. A learner can change only their own action. Use idempotent writes and generate accurate aggregates from current valid rows.

**Acceptance.** Confirm that the resource with the most recommendations wins even if another has more confirmed uses. Test duplicates, removal, filters, unpublishing, no votes, and broken links. Verify that opening an approved resource leaves the timer and current progress intact. [Learning design](../MDCAT-LEARNING-DESIGN.md) · [Test matrix](../TEST-MATRIX.md)
