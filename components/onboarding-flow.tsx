"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useReducer, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  isOnboardingDraftValid,
  medicationChoiceSchema,
  morningCallSchema,
  onboardingDraftSchema,
  onboardingSubmissionSchema,
  profileSchema,
  reminderSchema,
  type MedicationChoiceFields,
  type MorningCallFields,
  type OnboardingDraft,
  type OnboardingStep,
  type ProfileFields,
  type ReminderFields,
} from "@/lib/domain/onboarding";
import { SessionDemo } from "@/components/session-demo";

const storageKey = "pdhack-onboarding-v1";

function detectedTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function initialDraft(): OnboardingDraft {
  return {
    step: "setup",
    data: {
      preferredName: "",
      timeZone: "UTC",
      consent: false,
      morningCallTime: "09:00",
      reminderTimes: ["09:00"],
      reminderSound: "gentle-chime",
    },
  };
}

type Action =
  | { type: "hydrate"; draft: OnboardingDraft }
  | { type: "next"; values?: Partial<OnboardingDraft["data"]> }
  | { type: "save"; values: Partial<OnboardingDraft["data"]> }
  | { type: "back" };

function nextStep(step: OnboardingStep, reminders?: "yes" | "no"): OnboardingStep {
  const steps: Record<OnboardingStep, OnboardingStep> = {
    setup: "greeting",
    greeting: "profile",
    profile: "morning-call",
    "morning-call": "medication-choice",
    "medication-choice": reminders === "yes" ? "reminders" : "home",
    reminders: "home",
    home: "home",
  };
  return steps[step];
}

function previousStep(step: OnboardingStep, reminders?: "yes" | "no"): OnboardingStep {
  const steps: Record<OnboardingStep, OnboardingStep> = {
    setup: "setup",
    greeting: "setup",
    profile: "greeting",
    "morning-call": "profile",
    "medication-choice": "morning-call",
    reminders: "medication-choice",
    home: reminders === "yes" ? "reminders" : "medication-choice",
  };
  return steps[step];
}

function reducer(state: OnboardingDraft, action: Action): OnboardingDraft {
  if (action.type === "hydrate") return action.draft;

  if (action.type === "save") {
    return { ...state, data: { ...state.data, ...action.values } };
  }

  if (action.type === "back") {
    return {
      ...state,
      step: previousStep(state.step, state.data.medicationReminders),
    };
  }

  const data = { ...state.data, ...action.values };
  return {
    data,
    step: nextStep(state.step, data.medicationReminders),
  };
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p className="field-error" id={id} role="alert">
      {message}
    </p>
  );
}

function StepActions({
  back,
  busy = false,
  submitLabel = "Continue",
}: {
  back: () => void;
  busy?: boolean;
  submitLabel?: string;
}) {
  return (
    <div className="step-actions">
      <button className="secondary" type="button" onClick={back}>
        Back
      </button>
      <button type="submit" disabled={busy}>
        {busy ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}

function ProfileStep({
  data,
  onBack,
  onNext,
}: {
  data: OnboardingDraft["data"];
  onBack: () => void;
  onNext: (values: ProfileFields) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFields>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      preferredName: data.preferredName,
      timeZone: data.timeZone,
      consent: data.consent,
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <div className="field">
        <label htmlFor="preferredName">Preferred name</label>
        <input
          id="preferredName"
          autoComplete="nickname"
          aria-invalid={Boolean(errors.preferredName)}
          aria-describedby={errors.preferredName ? "preferredName-error" : undefined}
          {...register("preferredName")}
        />
        <FieldError id="preferredName-error" message={errors.preferredName?.message} />
      </div>
      <div className="field">
        <label htmlFor="timeZone">Time zone</label>
        <input
          id="timeZone"
          autoComplete="off"
          aria-invalid={Boolean(errors.timeZone)}
          aria-describedby={errors.timeZone ? "timeZone-error" : "timeZone-hint"}
          {...register("timeZone")}
        />
        <p className="field-hint" id="timeZone-hint">
          Detected from this device. You can edit it.
        </p>
        <FieldError id="timeZone-error" message={errors.timeZone?.message} />
      </div>
      <div className="check-field">
        <input
          id="consent"
          type="checkbox"
          aria-invalid={Boolean(errors.consent)}
          aria-describedby={errors.consent ? "consent-error" : undefined}
          {...register("consent")}
        />
        <label htmlFor="consent">
          I consent to saving these onboarding preferences on this device.
        </label>
      </div>
      <FieldError id="consent-error" message={errors.consent?.message} />
      <StepActions back={onBack} />
    </form>
  );
}

function MorningCallStep({
  data,
  onBack,
  onNext,
}: {
  data: OnboardingDraft["data"];
  onBack: () => void;
  onNext: (values: MorningCallFields) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MorningCallFields>({
    resolver: zodResolver(morningCallSchema),
    defaultValues: { morningCallTime: data.morningCallTime },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <div className="field">
        <label htmlFor="morningCallTime">Morning call time</label>
        <input
          id="morningCallTime"
          type="time"
          aria-invalid={Boolean(errors.morningCallTime)}
          aria-describedby={errors.morningCallTime ? "morningCallTime-error" : undefined}
          {...register("morningCallTime")}
        />
        <FieldError
          id="morningCallTime-error"
          message={errors.morningCallTime?.message}
        />
      </div>
      <StepActions back={onBack} />
    </form>
  );
}

function MedicationChoiceStep({
  data,
  onBack,
  onNext,
}: {
  data: OnboardingDraft["data"];
  onBack: () => void;
  onNext: (values: MedicationChoiceFields) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MedicationChoiceFields>({
    resolver: zodResolver(medicationChoiceSchema),
    defaultValues: { medicationReminders: data.medicationReminders },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <fieldset aria-describedby={errors.medicationReminders ? "medication-error" : undefined}>
        <legend>Would you like medication reminders?</legend>
        <label className="radio-option">
          <input
            type="radio"
            value="yes"
            {...register("medicationReminders")}
          />
          Yes, set reminders
        </label>
        <label className="radio-option">
          <input
            type="radio"
            value="no"
            {...register("medicationReminders")}
          />
          No reminders
        </label>
      </fieldset>
      <FieldError id="medication-error" message={errors.medicationReminders?.message} />
      <StepActions back={onBack} busy={isSubmitting} />
    </form>
  );
}

function ReminderStep({
  data,
  onBack,
  onNext,
}: {
  data: OnboardingDraft["data"];
  onBack: () => void;
  onNext: (values: ReminderFields) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReminderFields>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      reminderTimes: data.reminderTimes,
      reminderSound: data.reminderSound,
    },
  });
  const reminderTimes = watch("reminderTimes");

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <fieldset aria-describedby={errors.reminderTimes ? "reminderTimes-error" : undefined}>
        <legend>Medication reminder times</legend>
        {reminderTimes.map((_, index) => (
          <div className="field" key={index}>
            <label htmlFor={`reminderTime-${index}`}>Reminder {index + 1}</label>
            <div className="time-row">
              <input
                id={`reminderTime-${index}`}
                type="time"
                aria-invalid={Boolean(errors.reminderTimes?.[index])}
                aria-describedby={
                  errors.reminderTimes?.[index]
                    ? `reminderTime-${index}-error`
                    : undefined
                }
                {...register(`reminderTimes.${index}`)}
              />
              {reminderTimes.length > 1 && (
                <button
                  className="secondary"
                  type="button"
                  onClick={() =>
                    setValue(
                      "reminderTimes",
                      reminderTimes.filter((_, timeIndex) => timeIndex !== index),
                      { shouldValidate: true },
                    )
                  }
                >
                  Remove
                </button>
              )}
            </div>
            <FieldError
              id={`reminderTime-${index}-error`}
              message={errors.reminderTimes?.[index]?.message}
            />
          </div>
        ))}
        <button
          className="secondary"
          type="button"
          onClick={() =>
            setValue("reminderTimes", [...reminderTimes, "09:00"], {
              shouldValidate: true,
            })
          }
        >
          Add another time
        </button>
      </fieldset>
      <FieldError
        id="reminderTimes-error"
        message={errors.reminderTimes?.message}
      />
      <div className="field">
        <label htmlFor="reminderSound">Bundled reminder sound</label>
        <select
          id="reminderSound"
          aria-invalid={Boolean(errors.reminderSound)}
          aria-describedby={errors.reminderSound ? "reminderSound-error" : undefined}
          {...register("reminderSound")}
        >
          <option value="gentle-chime">Gentle chime</option>
          <option value="bright-bell">Bright bell</option>
          <option value="soft-pulse">Soft pulse</option>
        </select>
        <FieldError id="reminderSound-error" message={errors.reminderSound?.message} />
      </div>
      <StepActions back={onBack} busy={isSubmitting} submitLabel="Finish setup" />
    </form>
  );
}

export function OnboardingFlow() {
  const [draft, dispatch] = useReducer(reducer, undefined, initialDraft);
  const [hydrated, setHydrated] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = onboardingDraftSchema.safeParse(JSON.parse(saved));
        if (parsed.success && isOnboardingDraftValid(parsed.data)) {
          dispatch({ type: "hydrate", draft: parsed.data });
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    } else {
      dispatch({
        type: "hydrate",
        draft: { ...initialDraft(), data: { ...initialDraft().data, timeZone: detectedTimeZone() } },
      });
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (draft.data.consent) {
      localStorage.setItem(storageKey, JSON.stringify(draft));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [draft, hydrated]);

  useEffect(() => {
    if (hydrated) headingRef.current?.focus();
  }, [draft.step, hydrated]);

  async function complete(values: Partial<OnboardingDraft["data"]>) {
    setSubmitError(null);
    const data = { ...draft.data, ...values };
    const submission = onboardingSubmissionSchema.safeParse(data);
    if (!submission.success) {
      setSubmitError("Some onboarding details are incomplete. Go back and review them.");
      return;
    }

    dispatch({ type: "save", values });
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(submission.data),
      });
      if (!response.ok) {
        setSubmitError("Your onboarding preferences could not be saved.");
        return;
      }
    } catch {
      setSubmitError("Your onboarding preferences could not be saved.");
      return;
    }
    dispatch({ type: "next", values });
  }

  if (!hydrated) {
    return <section className="onboarding-card" aria-busy="true">Loading setup…</section>;
  }

  if (draft.step === "home") {
    return (
      <>
        <section className="onboarding-card complete-card">
          <p className="eyebrow">Setup complete</p>
          <h2 ref={headingRef} tabIndex={-1}>Good morning, {draft.data.preferredName}</h2>
          <p>
            Your morning call is set for {draft.data.morningCallTime} in{" "}
            {draft.data.timeZone}.
          </p>
          <button className="secondary" type="button" onClick={() => dispatch({ type: "back" })}>
            Review onboarding
          </button>
        </section>
        <SessionDemo />
      </>
    );
  }

  const stepNumber = Math.max(
    1,
    ["profile", "morning-call", "medication-choice", "reminders"].indexOf(draft.step) + 1,
  );

  return (
    <section className="onboarding-card">
      {draft.step !== "setup" && draft.step !== "greeting" && (
        <p className="step-count">Step {stepNumber} of 4</p>
      )}
      {draft.step === "setup" && (
        <>
          <p className="eyebrow">Welcome</p>
          <h2 ref={headingRef} tabIndex={-1}>Let’s set up your daily companion</h2>
          <p>We’ll ask a few questions to personalize morning calls and reminders.</p>
          <button type="button" onClick={() => dispatch({ type: "next" })}>Start setup</button>
        </>
      )}
      {draft.step === "greeting" && (
        <>
          <p className="eyebrow">Hello</p>
          <h2 ref={headingRef} tabIndex={-1}>We’re glad you’re here</h2>
          <p>You stay in control. You can review your answers at any time.</p>
          <div className="step-actions">
            <button className="secondary" type="button" onClick={() => dispatch({ type: "back" })}>
              Back
            </button>
            <button type="button" onClick={() => dispatch({ type: "next" })}>Continue</button>
          </div>
        </>
      )}
      {draft.step === "profile" && (
        <>
          <h2 ref={headingRef} tabIndex={-1}>About you</h2>
          <ProfileStep
            data={draft.data}
            onBack={() => dispatch({ type: "back" })}
            onNext={(values) => dispatch({ type: "next", values })}
          />
        </>
      )}
      {draft.step === "morning-call" && (
        <>
          <h2 ref={headingRef} tabIndex={-1}>Plan your morning call</h2>
          <MorningCallStep
            data={draft.data}
            onBack={() => dispatch({ type: "back" })}
            onNext={(values) => dispatch({ type: "next", values })}
          />
        </>
      )}
      {draft.step === "medication-choice" && (
        <>
          <h2 ref={headingRef} tabIndex={-1}>Medication reminders</h2>
          <MedicationChoiceStep
            data={draft.data}
            onBack={() => dispatch({ type: "back" })}
            onNext={async (values) => {
              if (values.medicationReminders === "yes") {
                dispatch({ type: "next", values });
              } else {
                await complete(values);
              }
            }}
          />
        </>
      )}
      {draft.step === "reminders" && (
        <>
          <h2 ref={headingRef} tabIndex={-1}>Schedule reminders</h2>
          <ReminderStep
            data={draft.data}
            onBack={() => dispatch({ type: "back" })}
            onNext={complete}
          />
        </>
      )}
      {submitError && <p className="error" role="alert">{submitError}</p>}
    </section>
  );
}
