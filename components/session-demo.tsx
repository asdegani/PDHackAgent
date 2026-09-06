"use client";

import { useEffect, useRef, useState } from "react";
import type { MeasurementSummary } from "@/lib/domain/measurements";
import type { Session, SessionEvent } from "@/lib/domain/session";

const eventForState: Partial<Record<Session["state"], SessionEvent>> = {
  awaiting_consent: { type: "CONSENT_GRANTED", consentVersion: "poc-v1" },
  setup: { type: "SETUP_CONFIRMED" },
  ready: { type: "SESSION_STARTED" },
  active: { type: "SESSION_COMPLETED" },
};

export function SessionDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementSummary | null>(null);

  useEffect(() => {
    return () => streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function createSession() {
    setError(null);
    const response = await fetch("/api/sessions", { method: "POST" });
    if (!response.ok) {
      setError("The session could not be created.");
      return;
    }
    setSession((await response.json()) as Session);
  }

  async function advanceSession() {
    if (!session) return;
    const event = eventForState[session.state];
    if (!event) return;

    const response = await fetch(`/api/sessions/${session.id}/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(event),
    });
    const body = (await response.json()) as Session | { error: string };
    if (!response.ok) {
      setError("error" in body ? body.error : "The session could not be updated.");
      return;
    }
    const next = body as Session;
    setSession(next);
    if (next.state === "completed") {
      setMeasurements({
        capturedAt: new Date().toISOString(),
        algorithmVersion: "poc-local-v1",
        quality: 0.91,
        values: [
          { name: "left_knee_range", value: 42.3, unit: "degree" },
          { name: "right_knee_range", value: 40.8, unit: "degree" },
          { name: "knee_asymmetry", value: 3.55, unit: "percent" },
        ],
      });
    }
  }

  async function enableCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraEnabled(true);
    } catch {
      setError("Camera and microphone access is required for this prototype.");
    }
  }

  const nextLabels: Partial<Record<Session["state"], string>> = {
    awaiting_consent: "Grant prototype consent",
    setup: "Confirm setup",
    ready: "Start guided exercise",
    active: "Complete exercise",
  };

  return (
    <>
      <p className="notice">
        This prototype is non-diagnostic. Video stays in this browser; the displayed
        measurements are example output until a MediaPipe adapter is connected.
      </p>
      <section className="session-grid">
        <article className="panel">
          <div className="panel-header">
            <h2>Guide</h2>
            <span className="status">{session?.state ?? "not started"}</span>
          </div>
          <div className="avatar" data-state={session?.state === "active" ? "speaking" : "listening"}>
            ●
          </div>
          <p>
            {session?.state === "active"
              ? "Move slowly through a comfortable knee bend. Stop if you feel pain."
              : "Create a session, review consent, and complete the setup steps."}
          </p>
          <div className="controls">
            {!session && <button onClick={createSession}>Create session</button>}
            {session && nextLabels[session.state] && (
              <button
                disabled={session.state === "setup" && !cameraEnabled}
                onClick={advanceSession}
              >
                {nextLabels[session.state]}
              </button>
            )}
          </div>
        </article>
        <article className="panel">
          <div className="panel-header">
            <h2>Local capture</h2>
            <span className="status">{cameraEnabled ? "ready" : "off"}</span>
          </div>
          <video
            ref={videoRef}
            className={`camera ${cameraEnabled ? "" : "placeholder"}`}
            autoPlay
            muted
            playsInline
          />
          <div className="controls">
            <button disabled={cameraEnabled} onClick={enableCamera}>
              Enable camera and microphone
            </button>
          </div>
          {measurements && (
            <dl>
              {measurements.values.map((measurement) => (
                <div key={measurement.name}>
                  <dt>{measurement.name.replaceAll("_", " ")}</dt>
                  <dd>
                    {measurement.value} {measurement.unit}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {error && <p className="error" role="alert">{error}</p>}
        </article>
      </section>
    </>
  );
}
