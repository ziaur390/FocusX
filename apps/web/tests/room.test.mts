import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  assignedPeer,
  canStartRound,
  formatRemaining,
  normalizeJoinCode,
  parseDuration,
  parseGoal,
  parseOutcome,
  phaseFor,
  parseSubject,
} from "../src/lib/room.ts";

test("remaining time is formatted from a server deadline", () => {
  assert.equal(formatRemaining(25 * 60 * 1000), "25:00");
  assert.equal(formatRemaining(65 * 1000), "01:05");
  assert.equal(formatRemaining(3 * 3600 * 1000 + 125 * 1000), "3:02:05");
  assert.equal(formatRemaining(-5000), "00:00");
  assert.equal(formatRemaining(1), "00:01");
});

test("round phase follows the shared deadline, not local start time", () => {
  const deadline = "2026-11-21T10:00:00.000Z";
  const checkinDeadline = "2026-11-22T10:00:00.000Z";
  const at = (iso) => Date.parse(iso);

  assert.equal(phaseFor(deadline, checkinDeadline, at("2026-11-21T09:59:59.000Z")), "studying");
  assert.equal(phaseFor(deadline, checkinDeadline, at(deadline)), "checkin");
  assert.equal(phaseFor(deadline, checkinDeadline, at("2026-11-22T09:59:59.000Z")), "checkin");
  assert.equal(phaseFor(deadline, checkinDeadline, at(checkinDeadline)), "closed");
});

test("only the host starts a round with two ready members and no live round", () => {
  const ready = { isHost: true, readyCount: 2, liveRound: false };
  assert.equal(canStartRound(ready), null);
  assert.match(canStartRound({ ...ready, readyCount: 1 }), /Two members/);
  assert.match(canStartRound({ ...ready, isHost: false }), /host/);
  assert.match(canStartRound({ ...ready, liveRound: true }), /still running/);
});

test("room input rejects invalid subjects and durations", () => {
  assert.deepEqual(parseSubject("  Physics  "), { subject: "Physics" });
  assert.equal(typeof parseSubject(" "), "string");
  assert.deepEqual(parseDuration("25"), { duration: 25 });
  assert.equal(typeof parseDuration("0"), "string");
  assert.equal(typeof parseDuration("181"), "string");
  assert.equal(typeof parseDuration("12.5"), "string");
});

test("goal and outcome input stay within the room contract", () => {
  assert.equal(typeof parseGoal("ok"), "string");
  assert.equal(typeof parseGoal("a".repeat(201)), "string");
  assert.deepEqual(parseGoal("  Solve 15 MCQs  "), { goal: "Solve 15 MCQs" });

  const outcome = new FormData();
  outcome.set("status", "partly");
  outcome.set("note", "  Finished 9 of 15  ");
  assert.deepEqual(parseOutcome(outcome), {
    status: "partly",
    note: "Finished 9 of 15",
  });

  const invalid = new FormData();
  invalid.set("status", "done");
  assert.equal(typeof parseOutcome(invalid), "string");

  const longNote = new FormData();
  longNote.set("status", "completed");
  longNote.set("note", "a".repeat(281));
  assert.equal(typeof parseOutcome(longNote), "string");
});

test("join codes are normalized and validated", () => {
  assert.deepEqual(normalizeJoinCode(" A1B2C3D4E5 "), { code: "a1b2c3d4e5" });
  assert.equal(typeof normalizeJoinCode("nope"), "string");
  assert.equal(typeof normalizeJoinCode("a1b2c3d4e5g"), "string");
});

test("two-person rounds pair members with each other", () => {
  const a = "0b0e1a2c-0000-4000-8000-000000000001";
  const b = "0b0e1a2c-0000-4000-8000-000000000002";
  assert.equal(assignedPeer([a, b], a), b);
  assert.equal(assignedPeer([a, b], b), a);
  assert.equal(assignedPeer([a], a), null);
  assert.equal(assignedPeer([a, b], "missing"), null);
});
