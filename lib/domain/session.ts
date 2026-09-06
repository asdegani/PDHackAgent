export const sessionStates = [
  "awaiting_consent",
  "setup",
  "ready",
  "active",
  "completed",
] as const;

export type SessionState = (typeof sessionStates)[number];

export interface Session {
  id: string;
  state: SessionState;
  consentVersion?: string;
  createdAt: string;
  updatedAt: string;
}

export type SessionEvent =
  | { type: "CONSENT_GRANTED"; consentVersion: string }
  | { type: "SETUP_CONFIRMED" }
  | { type: "SESSION_STARTED" }
  | { type: "SESSION_COMPLETED" };

const transitions: Record<SessionState, Partial<Record<SessionEvent["type"], SessionState>>> = {
  awaiting_consent: { CONSENT_GRANTED: "setup" },
  setup: { SETUP_CONFIRMED: "ready" },
  ready: { SESSION_STARTED: "active" },
  active: { SESSION_COMPLETED: "completed" },
  completed: {},
};

export class InvalidSessionTransitionError extends Error {}

export function transitionSession(session: Session, event: SessionEvent): Session {
  const nextState = transitions[session.state][event.type];
  if (!nextState) {
    throw new InvalidSessionTransitionError(
      `Cannot apply ${event.type} while session is ${session.state}`,
    );
  }

  return {
    ...session,
    state: nextState,
    consentVersion:
      event.type === "CONSENT_GRANTED" ? event.consentVersion : session.consentVersion,
    updatedAt: new Date().toISOString(),
  };
}
