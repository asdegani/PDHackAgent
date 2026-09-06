import { onboardingSubmissionSchema } from "@/lib/domain/onboarding";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const result = onboardingSubmissionSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      {
        error: "Invalid onboarding details.",
        fields: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  return Response.json({ accepted: true, onboarding: result.data });
}
