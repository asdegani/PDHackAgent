import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function isTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export const profileSchema = z.object({
  preferredName: z
    .string()
    .trim()
    .min(1, "Enter the name you would like us to use.")
    .max(80, "Keep your preferred name under 80 characters."),
  timeZone: z
    .string()
    .trim()
    .min(1, "Enter a time zone.")
    .refine(isTimeZone, "Enter a valid IANA time zone, such as Europe/London."),
  consent: z
    .boolean()
    .refine((value) => value, "Consent is required to continue."),
});

export const morningCallSchema = z.object({
  morningCallTime: z
    .string()
    .regex(timePattern, "Choose a valid morning call time."),
});

export const medicationChoiceSchema = z.object({
  medicationReminders: z.enum(["yes", "no"], {
    errorMap: () => ({ message: "Choose whether you want medication reminders." }),
  }),
});

export const reminderSchema = z.object({
  reminderTimes: z
    .array(z.string().regex(timePattern, "Choose a valid reminder time."))
    .min(1, "Add at least one medication reminder time."),
  reminderSound: z.enum(["gentle-chime", "bright-bell", "soft-pulse"], {
    errorMap: () => ({ message: "Choose a reminder sound." }),
  }),
});

const onboardingBaseSchema = profileSchema
  .merge(morningCallSchema);

export const onboardingSubmissionSchema = z.discriminatedUnion(
  "medicationReminders",
  [
    onboardingBaseSchema.extend({
      medicationReminders: z.literal("no"),
    }),
    onboardingBaseSchema
      .merge(reminderSchema)
      .extend({ medicationReminders: z.literal("yes") }),
  ],
);

export const onboardingSteps = [
  "setup",
  "greeting",
  "profile",
  "morning-call",
  "medication-choice",
  "reminders",
  "home",
] as const;

export const onboardingDraftSchema = z.object({
  step: z.enum(onboardingSteps),
  data: z.object({
    preferredName: z.string(),
    timeZone: z.string(),
    consent: z.boolean(),
    morningCallTime: z.string(),
    medicationReminders: z.enum(["yes", "no"]).optional(),
    reminderTimes: z.array(z.string()),
    reminderSound: z.enum(["gentle-chime", "bright-bell", "soft-pulse"]),
  }),
});

export type ProfileFields = z.infer<typeof profileSchema>;
export type MorningCallFields = z.infer<typeof morningCallSchema>;
export type MedicationChoiceFields = z.infer<typeof medicationChoiceSchema>;
export type ReminderFields = z.infer<typeof reminderSchema>;
export type OnboardingSubmission = z.infer<typeof onboardingSubmissionSchema>;
export type OnboardingStep = (typeof onboardingSteps)[number];
export type OnboardingDraft = z.infer<typeof onboardingDraftSchema>;

export function isOnboardingDraftValid(draft: OnboardingDraft) {
  switch (draft.step) {
    case "setup":
    case "greeting":
    case "profile":
      return true;
    case "morning-call":
      return profileSchema.safeParse(draft.data).success;
    case "medication-choice":
      return (
        profileSchema.safeParse(draft.data).success &&
        morningCallSchema.safeParse(draft.data).success
      );
    case "reminders":
      return (
        profileSchema.safeParse(draft.data).success &&
        morningCallSchema.safeParse(draft.data).success &&
        medicationChoiceSchema.safeParse(draft.data).success &&
        draft.data.medicationReminders === "yes"
      );
    case "home":
      return onboardingSubmissionSchema.safeParse(draft.data).success;
  }
}
