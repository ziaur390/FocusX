import { strict as assert } from "node:assert";
import { test } from "node:test";
import { parseProfile } from "../src/lib/profile.ts";

function profileForm(dailyTarget = "90") {
  const fields = new FormData();
  fields.set("full_name", "  Study Partner  ");
  fields.set("username", "  MDCAT_Student  ");
  fields.set("exam_track", "MDCAT");
  fields.set("daily_target_minutes", dailyTarget);
  return fields;
}

test("profile input normalizes the name and username", () => {
  assert.deepEqual(parseProfile(profileForm()), {
    full_name: "Study Partner",
    username: "mdcat_student",
    exam_track: "MDCAT",
    daily_target_minutes: 90,
  });
});

test("profile input rejects unsupported study targets", () => {
  for (const target of ["14", "721", "60.5", ""]) {
    assert.equal(
      parseProfile(profileForm(target)),
      "Enter a daily goal between 15 and 720 minutes.",
    );
  }
});

test("profile input rejects usernames with path characters", () => {
  const fields = profileForm();
  fields.set("username", "student/other");
  assert.equal(
    parseProfile(fields),
    "Use 3–24 letters, numbers or underscores in your username.",
  );
});
