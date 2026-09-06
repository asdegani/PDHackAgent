import assert from "node:assert/strict";
import test from "node:test";
import {
  InvalidSessionTransitionError,
  transitionSession,
  type Session,
} from "../lib/domain/session";

const baseSession: Session = {
  id: "session-1",
  state: "awaiting_consent",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

test("session follows the approved deterministic flow", () => {
  const consented = transitionSession(baseSession, {
    type: "CONSENT_GRANTED",
    consentVersion: "v1",
  });
  const configured = transitionSession(consented, { type: "SETUP_CONFIRMED" });
  const active = transitionSession(configured, { type: "SESSION_STARTED" });
  const completed = transitionSession(active, { type: "SESSION_COMPLETED" });

  assert.equal(completed.state, "completed");
  assert.equal(completed.consentVersion, "v1");
});

test("session rejects out-of-order events", () => {
  assert.throws(
    () => transitionSession(baseSession, { type: "SESSION_STARTED" }),
    InvalidSessionTransitionError,
  );
});
