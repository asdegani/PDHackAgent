import type { Session } from "@/lib/domain/session";

export interface SessionStore {
  create(): Promise<Session>;
  get(id: string): Promise<Session | null>;
  save(session: Session): Promise<void>;
}

class InMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, Session>();

  async create() {
    const now = new Date().toISOString();
    const session: Session = {
      id: crypto.randomUUID(),
      state: "awaiting_consent",
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async get(id: string) {
    return this.sessions.get(id) ?? null;
  }

  async save(session: Session) {
    this.sessions.set(session.id, session);
  }
}

const globalStore = globalThis as typeof globalThis & {
  sessionStore?: InMemorySessionStore;
};

export const sessionStore = globalStore.sessionStore ?? new InMemorySessionStore();
if (process.env.NODE_ENV !== "production") globalStore.sessionStore = sessionStore;
