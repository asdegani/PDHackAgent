import { z } from "zod";
import {
  InvalidSessionTransitionError,
  transitionSession,
  type SessionEvent,
} from "@/lib/domain/session";
import { sessionStore } from "@/lib/server/session-store";

const eventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("CONSENT_GRANTED"), consentVersion: z.string().min(1) }),
  z.object({ type: z.literal("SETUP_CONFIRMED") }),
  z.object({ type: z.literal("SESSION_STARTED") }),
  z.object({ type: z.literal("SESSION_COMPLETED") }),
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await sessionStore.get(id);
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });

  const parsed = eventSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid session event", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const updated = transitionSession(session, parsed.data as SessionEvent);
    await sessionStore.save(updated);
    return Response.json(updated);
  } catch (error) {
    if (error instanceof InvalidSessionTransitionError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
