import assert from "node:assert/strict";
import test from "node:test";
import {
  isOnboardingDraftValid,
  onboardingSubmissionSchema,
  profileSchema,
} from "../lib/domain/onboarding";

const baseOnboarding = {
  preferredName: "Sam",
  timeZone: "Europe/London",
  consent: true,
  morningCallTime: "08:30",
};

test("accepts onboarding without medication reminders", () => {
  const result = onboardingSubmissionSchema.safeParse({
    ...baseOnboarding,
    medicationReminders: "no",
  });

  assert.equal(result.success, true);
});

test("requires reminder details when medication reminders are enabled", () => {
  const missingDetails = onboardingSubmissionSchema.safeParse({
    ...baseOnboarding,
    medicationReminders: "yes",
  });
  const complete = onboardingSubmissionSchema.safeParse({
    ...baseOnboarding,
    medicationReminders: "yes",
    reminderTimes: ["09:00", "20:00"],
    reminderSound: "gentle-chime",
  });

  assert.equal(missingDetails.success, false);
  assert.equal(complete.success, true);
});

test("validates consent and IANA time zones in the shared profile contract", () => {
  const result = profileSchema.safeParse({
    preferredName: "Sam",
    timeZone: "not-a-time-zone",
    consent: false,
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.deepEqual(
      result.error.issues.map((issue) => issue.path[0]).sort(),
      ["consent", "timeZone"],
    );
  }
});

test("does not allow invalid persisted data to skip onboarding", () => {
  assert.equal(
    isOnboardingDraftValid({
      step: "home",
      data: {
        preferredName: "",
        timeZone: "invalid",
        consent: false,
        morningCallTime: "bad",
        medicationReminders: "no",
        reminderTimes: ["09:00"],
        reminderSound: "gentle-chime",
      },
    }),
    false,
  );
});
