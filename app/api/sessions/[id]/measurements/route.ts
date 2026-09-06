import { measurementSummarySchema } from "@/lib/domain/measurements";
import { sessionStore } from "@/lib/server/session-store";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await sessionStore.get(id);
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
  if (session.state !== "active" && session.state !== "completed") {
    return Response.json(
      { error: "Measurements are accepted only during or after an active session" },
      { status: 409 },
    );
  }

  const parsed = measurementSummarySchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid measurement summary", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // Persistence is intentionally behind this validated boundary; connect the
  // PostgreSQL repository before accepting real participant data.
  return Response.json({ accepted: true, measurementCount: parsed.data.values.length }, { status: 202 });
}
