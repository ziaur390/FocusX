import { strict as assert } from "node:assert";
import { test } from "node:test";
import { nextRoomAction } from "../src/lib/room.ts";

const room = { id: "room-1", subject: "Physics" };
const alice = { user_id: "me", full_name: "Alice", outcome: null };
const bob = { user_id: "peer", full_name: "Bob", outcome: null };

function round(overrides = {}) {
  return {
    number: 1,
    phase: "checkin",
    me: { user_id: "me" },
    myOutcome: null,
    myResponse: null,
    peerId: "peer",
    participants: [alice, bob],
    ...overrides,
  };
}

function action(overrides = {}) {
  return nextRoomAction({
    room,
    myMembership: { is_ready: true },
    latest: null,
    isHost: false,
    readyCount: 1,
    ...overrides,
  });
}

test("no round asks for a goal until the member is ready", () => {
  assert.equal(
    action({ myMembership: { is_ready: false } })?.label,
    "Set your goal and mark ready",
  );
});

test("host starts only when two members are ready", () => {
  assert.equal(action({ isHost: true, readyCount: 2 })?.label, "Start the round");
  assert.equal(
    action({ isHost: true, readyCount: 1 })?.label,
    "Waiting for two ready members",
  );
  assert.equal(action({ isHost: false })?.label, "Waiting for the host to start");
});

test("a live round points back to the room", () => {
  assert.equal(action({ latest: round({ phase: "studying" }) })?.kind, "live");
});

test("check-in comes before the peer response", () => {
  const checkin = action({ latest: round() });
  assert.equal(checkin?.kind, "checkin");
  assert.equal(checkin?.priority, 0);

  const response = action({
    latest: round({
      myOutcome: { status: "completed" },
      participants: [alice, { ...bob, outcome: { status: "partly" } }],
    }),
  });
  assert.equal(response?.label, "Respond to Bob");
  assert.equal(response?.priority, 1);
});

test("waiting for a peer without a result", () => {
  const result = action({ latest: round({ myOutcome: { status: "completed" } }) });
  assert.equal(result?.kind, "waiting");
  assert.match(result?.label ?? "", /Bob/);
});

test("nothing is due once the check-in and response are done", () => {
  assert.equal(
    action({
      latest: round({
        myOutcome: { status: "completed" },
        myResponse: { kind: "acknowledged" },
      }),
    }),
    null,
  );
});

test("a closed round keeps missing work visible", () => {
  assert.equal(
    action({ latest: round({ phase: "closed" }) })?.kind,
    "closed",
  );
  assert.equal(
    action({ latest: round({ phase: "closed", myOutcome: { status: "missed" } }) })
      ?.label,
    "Record no check-in for Bob",
  );
});

test("members outside the round roster get no action", () => {
  assert.equal(action({ latest: round({ me: null }) }), null);
  assert.equal(action({ myMembership: null }), null);
});
