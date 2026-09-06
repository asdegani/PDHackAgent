import { OnboardingFlow } from "@/components/onboarding-flow";

export default function Home() {
  return (
    <main>
      <header className="hero">
        <div>
          <p className="eyebrow">Privacy-first prototype</p>
          <h1>Your daily companion</h1>
          <p>
            Personalize a morning check-in, optional medication reminders, and
            guided movement sessions.
          </p>
        </div>
        <span className="status">POC</span>
      </header>
      <OnboardingFlow />
    </main>
  );
}
