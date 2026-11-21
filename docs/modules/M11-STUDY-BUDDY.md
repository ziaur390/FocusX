# M11 · Peer accountability and private updates

**Owns** commitments, self-reported check-ins, peer review assignments, and optional follow-up sharing. Each ready member owes a result and a response to another ready member of the same room.

| Record | Rule |
| --- | --- |
| Goal | Student owns their measurable goal before ready-up. Snapshot it when the round starts. |
| Outcome | Student alone reports completed, partly completed, or missed. A pending response is a separate state. |
| Review assignment | Two members review each other. Larger rounds assign a cyclic peer with no self-assignment. |
| Peer response | Assigned participant acknowledges a reported result and can suggest a next step. |
| Optional update | Only the sender and selected accepted friends can access optional private text or video. |

Freeze the ready roster when the round starts. For three or more ready members, order the roster by a stable member key and rotate a nonzero offset across rounds. Persist one outgoing and one incoming assignment per member. Rosters can change in later rounds. Completion of accountability requires one's own check-in and one's own peer response. It is independent of task success or a peer validating someone's work. If the assigned peer still has no result after their check-in window, the reviewer can record **No check-in received**. That closes the reviewer's own task and leaves the other member's outcome missing.

Use a working default of 24 hours after round end for a check-in. Once a result is posted, the assigned peer normally has 24 hours to respond. Surface pending work. If the assigned reviewer leaves the circle or misses the response deadline, let a different eligible participant pick up the still-open review. Exclude self-review and preserve the original assignment and actual responder. Make claim and response operations idempotent and allow only one official response per outcome. A replacement response closes the recipient's pending review while preserving the original reviewer's missed status.

Text or video is optional after a round. Prompt gently only after the standard result action. Use explicit recipients, preview/send, 30-second video cap and seven-day expiry. Keep private media and personal reasons out of the main room summary.

**Acceptance.** For two accounts each gets the other's result. For three or four accounts there is one peer and one reviewer per participant. Test pending check-ins, partial progress, early departure, an absent peer's check-in, review reassignment, unassigned response attempts, and recipient scoping.

[Social game design](../SOCIAL-GAME-DESIGN.md) · [Peer accountability task](../../harness/tasks/FX-006.md) · [Video task](../../harness/tasks/FX-008.md)
