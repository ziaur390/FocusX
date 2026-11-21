# MDCAT learning design

FocusX helps aspirants choose what to study, practice a concept, remember it later, and see where they lose exam marks. The learning path works in solo mode and alongside a squad. Performance, guessed answers, and individual mistake history stay private by default.

## Learning loop

1. **Plan.** Set an exam year and choose how much time is available today. A short, balanced diagnostic can populate an initial plan. If the student skips it or samples are sparse, show a syllabus-based starter task.
2. **Learn and recall.** Open a short teacher-reviewed concept card. For calculations, pair a worked example with a similar question the student solves. Use a short quiz before revealing the explanation.
3. **Practice and reflect.** Check the answer and record a simple confidence label such as **Sure** or **Guessed**. For a miss, optional tags include concept gap, formula, calculation, wording, or pacing. A guessed correct answer can still be due for review.
4. **Review later.** Bring back a fresh question for the same objective, prioritizing due and repeatedly missed topics. Show why each task is suggested and let the student reschedule it.
5. **Measure.** Report accuracy, recent distinct items attempted, and pace by subject or topic. Turn the largest actionable gap into a specific practice set. Use **Needs more practice** when evidence is sparse.

[What Works Clearinghouse study guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/1) · [PM&DC example curriculum](https://www.pmdc.pk/Documents/Syllabus/Uniform%20Curriculum%20MDCAT-2025%20%20Final%20%2826-05-2025%29.pdf)

## Features to build

| Feature | Interaction | Why it belongs |
| --- | --- | --- |
| **Today's Study** | Show one priority topic, a short practice set, and reviews due. Use the student's time budget, with an editable short-day option and reschedule controls. | Gives the student a concrete place to start after school or academy. |
| **Most recommended resources** | See one top lecture or notes link plus up to two alternatives for the active topic. Count recommendations from FocusX learners who marked the resource used. | Gives aspirants a clear first choice when many creators cover the same topic. [M13 resource recommendations](modules/M13-RECOMMENDED-RESOURCES.md) |
| **Mistake-to-revision queue** | Link a missed or guessed MCQ to its learning objective and surface a fresh related question on a later day. | Converts practice feedback into follow-up work. |
| **Concept cards and worked examples** | Show a brief explanation, diagram or formula when useful, one worked example, and an attempt before revealing the answer. | Helps a student understand why an answer works before practicing alone. |
| **Exam simulator and pacing feedback** | Load the selected exam year's published format when verified, with section controls, marked questions, and results after submission. Break results into missed questions, omitted items, and pacing. | Helps a student practice the exam workflow and act on their results. |
| **Buddy quiz and teach-back** | In a room, two students attempt the same concept independently. Reveal the answer after both submit or the round ends. Show a prompt such as “Why does this formula apply?” and invite a brief explanation. | Makes a shared room an active learning activity. Keep individual answers and weakness labels private unless shared deliberately. |
| **Low-data study packs** | Download versioned text notes, diagrams, and authorized MCQs before leaving Wi-Fi. Save attempts on that installation and sync on reconnect with the same attempt ID. | Lets practice continue on limited connectivity. |
| **Optional Urdu explanations** | Keep the reviewed English item and make a teacher-reviewed Urdu or Roman Urdu explanation available where useful. | Gives students a second way to understand a difficult term while keeping the practice question consistent. |
| **Admissions checklist, later** | Save colleges of interest, tick off needed documents, and follow official notices for registration and applications. Show applicable year, authority, and date checked before offering reminders. | Keeps preparation and application steps accessible in the same workspace. |

### A concrete study day

A student has 45 minutes and has missed two Physics questions involving resistor combinations. Today's Study offers a five-minute worked example, a 25-minute study session for a related practice set, and a short review of yesterday's guessed answers. Tomorrow the student sees a different circuit question. If they answer correctly and confidently across distinct items, the objective moves to a later review date. In a squad room, both students can solve a similar item before seeing the explanation.

## Content rules

- Organize topics by the official curriculum associated with the selected exam year. Record the authority, source, curriculum version, checked date, and objective. Use a published mock configuration only after its format is verified against the notice for that year.
- Use original or licensed questions and worked explanations. Require a reviewer, an answer rationale, and a content version before release. Provide **Report a question** and correct the item without rewriting old attempts. Retire faulty items from new practice and resolve grading changes by version if needed.
- Make early evidence readable. Show topic coverage and recent accuracy with a sample count. Use results as planning signals. Avoid a readiness percentage when the student has too little evidence.
- Keep practice points tied to completion and reviewed feedback, independent of correct-answer count. Learners can retry mistakes privately without losing points.

## Delivery

**R4 / FX-007** ships one end-to-end English topic, reviewed MCQs, mistake feedback, and a due review. **R5 / FX-010** adds the ranked resource picker for that topic. **R6** uses checked practice completion for points and lays the groundwork for buddy quiz rounds. **R8 / FX-009** adds the exam simulator, distinct question sets, pacing feedback, and recommended practice. Low-data packs, broader topic coverage, and reviewed translation ship incrementally once their content and sync checks pass. Track admissions as a later companion with manually reviewed official notices and optional reminders. [Complete feature list](FEATURES.md) · [M12 learning module](modules/M12-MDCAT-LEARNING.md)
