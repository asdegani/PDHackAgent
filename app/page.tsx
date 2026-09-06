import { SessionDemo } from "@/components/session-demo";

export default function Home() {
  return (
    <main>
      <header className="hero">
        <div>
          <p className="eyebrow">Privacy-first prototype</p>
          <h1>Guided movement session</h1>
          <p>
            A runnable foundation for consent, camera setup, deterministic session
            orchestration, and local measurement extraction.
          </p>
        </div>
        <span className="status">POC</span>
      </header>
      <SessionDemo />
    </main>
  );
}
