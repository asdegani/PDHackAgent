import { sessionStore } from "@/lib/server/session-store";

export async function POST() {
  const session = await sessionStore.create();
  return Response.json(session, { status: 201 });
}
