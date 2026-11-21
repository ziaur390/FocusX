# FocusX feature list

FocusX is a study accountability app for friends and MDCAT aspirants. **Every ready member posts a goal, reports their own progress, and responds to a peer.** [Roadmap](PLAN.md) · [Required feature checks](REQUIRED-FEATURES.md)

| Area | Planned features |
| --- | --- |
| **Accountability room** | Private room with subject, duration, measurable goal per student, ready-up, shared countdown, and a result for each participant. |
| **Mutual check-ins** | Completed, partly completed, or missed, with optional progress note. Two people acknowledge each other. Larger groups rotate who reviews whom so every ready participant is both a contributor and reviewer. |
| **Follow-through** | Circle summary shows goals, results, pending check-ins and pending reviews. If a person leaves, the group continues. An absent reviewer can be picked up by another member after a defined timeout. |
| **Friends and circles** | Friends list, private circles, room scheduling, invitations inside or outside a circle, explicit acceptance, ready status, and simple reactions. Report and mute tools, invite revocation and moderation. |
| **Profiles, goals, and history** | Email login, display name, exam year, daily goals, personal history, upcoming rooms and open accountability actions. |
| **MDCAT study plan** | Today's Study, versioned syllabus objectives, an optional diagnostic, time budget, one priority topic, and due revision. |
| **MCQs and revision** | Concept cards, worked examples, reviewed questions, answer explanations, confidence labels, and a private mistake notebook. A missed or guessed concept returns as a review with a fresh question when available. |
| **Recommended lectures and notes** | Up to three reviewed resources per topic with the highest recommendation count first. Students mark a resource used before voting. Include language/duration filters, editor picks, submissions and broken-link reporting. |
| **Quests and rankings** | Focus, checked practice, and squad quests, points breakdown, personal scores, friends board and opt-in regional rankings. Use caps and idempotent point awards. |
| **Private updates** | Optional text or video for chosen accepted friends, with preview, explicit send, recipient authorization, expiry, delete and report. |
| **Mock exams and pacing** | Timed mixed sets, verified exam-format mocks, flagged questions, scores, topic gaps and follow-up practice. |
| **Learning follow-ups** | Buddy quizzes and teach-back, broader reviewed content, low-data practice packs, Urdu explanations, and an admissions checklist with official source links. |

## First build

Two friends complete one accountability round in the web app. Each sees the other's goal, publishes their own outcome, and acknowledges the other. Accountability and task completion have separate status. A student who reports partial progress and reviews their peer can still finish the accountability loop.

[First task](../harness/tasks/FX-001.md) · [Social game design](SOCIAL-GAME-DESIGN.md) · [Peer accountability module](modules/M11-STUDY-BUDDY.md) · [MDCAT learning design](MDCAT-LEARNING-DESIGN.md)
