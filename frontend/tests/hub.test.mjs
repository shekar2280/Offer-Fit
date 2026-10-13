import assert from "node:assert/strict";
import { test } from "node:test";
import {
  normalizeJobUrl,
  isFollowUpDue,
  localDate,
  checkinStreak,
  classifyReply,
} from "../lib/hub/domain.ts";
import { sealSecret, openSecret } from "../lib/hub/vault.ts";
import { randomBytes } from "node:crypto";
import { isPublicIPv4 } from "../lib/hub/public-address.ts";

test("job identity removes tracking but preserves role IDs", () => {
  assert.equal(
    normalizeJobUrl(
      "https://jobs.example.com/role/?jobId=42&utm_source=email#apply",
    ),
    "https://jobs.example.com/role?jobId=42",
  );
  assert.notEqual(
    normalizeJobUrl("https://example.com/jobs?jobId=1"),
    normalizeJobUrl("https://example.com/jobs?jobId=2"),
  );
  assert.throws(() => normalizeJobUrl("javascript:alert(1)"));
  assert.throws(() => normalizeJobUrl("https://user:secret@example.com/job"));
});
test("silence becomes due strictly after ten days and never implies rejection", () => {
  const app = {
    status: "applied",
    applied_at: "2026-10-01T00:00:00Z",
    last_contact_at: null,
    next_action_at: null,
  };
  assert.equal(isFollowUpDue(app, new Date("2026-10-11T00:00:00Z")), false);
  assert.equal(isFollowUpDue(app, new Date("2026-10-11T00:00:01Z")), true);
  assert.equal(
    isFollowUpDue({ ...app, status: "rejected" }, new Date("2026-11-01")),
    false,
  );
  assert.equal(
    isFollowUpDue({ ...app, status: "interview" }, new Date("2026-11-01")),
    false,
  );
  assert.equal(
    isFollowUpDue(
      { ...app, status: "interview", next_action_at: "2026-10-12" },
      new Date("2026-10-13"),
    ),
    true,
  );
  assert.equal(
    isFollowUpDue(
      { ...app, last_contact_at: "2026-10-10" },
      new Date("2026-10-13"),
    ),
    false,
  );
});
test("calendar check-ins use IST around UTC midnight and deduplicate streak days", () => {
  assert.equal(localDate(new Date("2026-10-08T18:29:59Z")), "2026-10-08");
  assert.equal(localDate(new Date("2026-10-08T18:30:00Z")), "2026-10-09");
  assert.equal(
    checkinStreak(["2026-10-08", "2026-10-08", "2026-10-07"], "2026-10-09"),
    2,
  );
  assert.equal(checkinStreak(["2026-10-06"], "2026-10-09"), 0);
});
test("acknowledgements, invitations, and offers are distinct; generic mail is unknown", () => {
  assert.equal(
    classifyReply("Application received", "Thank you for applying"),
    "acknowledged",
  );
  assert.equal(classifyReply("Interview invitation", ""), "interview");
  assert.equal(classifyReply("Offer letter", ""), "offer");
  assert.equal(
    classifyReply("Update", "We are not moving forward"),
    "rejected",
  );
  assert.equal(classifyReply("Company newsletter", "Apply to our jobs"), null);
});
test("credential encryption is randomized and bound to the user and integration", () => {
  const key = randomBytes(32);
  const first = sealSecret("private-token", key, "user-a", "gmail");
  assert.notEqual(first, sealSecret("private-token", key, "user-a", "gmail"));
  assert.equal(openSecret(first, key, "user-a", "gmail"), "private-token");
  assert.throws(() => openSecret(first, key, "user-b", "gmail"));
  assert.throws(() => openSecret(first, key, "user-a", "gemini"));
  assert.throws(() => openSecret(first, randomBytes(32), "user-a", "gmail"));
  const pieces = first.split(".");
  pieces[3] = Buffer.from("tampered").toString("base64");
  assert.throws(() => openSecret(pieces.join("."), key, "user-a", "gmail"));
});
test("job capture blocks private, loopback, metadata, reserved, and IPv6 destinations", () => {
  for (const address of [
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "198.18.0.1",
    "203.0.113.1",
    "::1",
    "::ffff:127.0.0.1",
  ])
    assert.equal(isPublicIPv4(address), false);
  assert.equal(isPublicIPv4("8.8.8.8"), true);
});
