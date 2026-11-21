# M01 · Session timer

**Owns** the shared timer and personal participation lifecycle. The browser shows remaining time derived from a server start time and deadline. A refresh or reconnect reads the current room state and recomputes remaining time.

For R0, use a host-selected duration. The host starts the round once two members have posted a goal and are ready. Freeze the ready participant list and use one deadline for the round. A participant can leave their own session without ending the room. Show the member's departure, keep the room timer for the other member, and leave the former member's result open for the agreed check-in window.

Timer completion and goal outcome are separate. At expiry show the check-in action. A student can report completed, partly completed, or missed. Track pending status when no result arrives. Honor terminal state when receiving delayed requests.

**Acceptance.** Two browser profiles see the same deadline. Refresh, reload, or delayed reconnect never starts a second round. An early departure or missed check-in does not cut short the other member's countdown. [Test matrix](../TEST-MATRIX.md)
