# PDHackAgent PWA foundation

A runnable, privacy-first proof of concept for guided conversation and local movement
analysis. It provides team boundaries and contracts without pretending that production
services are already connected.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`. The demo exercises the consent/setup/session state machine
and browser camera permissions. Measurement results are explicitly mocked until a
MediaPipe implementation is connected.

## Building blocks

| Area | Location | Responsibility |
|---|---|---|
| PWA and session UI | `app/`, `components/`, `public/sw.js` | Installability, capture UX, avatar states, offline shell, push handling |
| Session domain | `lib/domain/session.ts` | Deterministic protocol state and valid transitions |
| Movement analysis | `lib/analysis/movement.ts` | Local calculations and the MediaPipe adapter contract |
| API boundary | `app/api/` | Input validation, orchestration, health/capability reporting |
| Service adapters | `lib/server/` | Replaceable persistence and job queue interfaces |
| Data model | `db/migrations/` | Structured PostgreSQL schema and optional pgvector storage |
| Contract tests | `tests/` | Domain behavior independent of UI or infrastructure |

## Suggested team ownership

1. **Client/PWA:** connect a MediaPipe `PoseLandmarkProvider`, replace demo measurements,
   add capability checks, and test supported browsers.
2. **Conversation/speech:** add streaming transport and providers behind dedicated
   interfaces; keep protocol transitions in the state machine.
3. **Backend/data:** replace the in-memory session store, add authentication and
   authorization, run migrations, and implement retention/deletion.
4. **Platform:** provide a durable job queue, Web Push subscription APIs, secret
   management, deployment, and observability.
5. **Safety/product:** version consent and scripts, define quality thresholds, approve
   non-diagnostic wording, and specify which measurements may leave the device.

## Important prototype constraints

- The in-memory store is development-only and is not reliable across server processes.
- The measurement endpoint validates payloads but intentionally does not persist them
  until authenticated PostgreSQL access is implemented.
- The service worker provides an app-shell cache and push click handling. Subscription,
  VAPID signing, retries, and scheduling still belong to the platform workstream.
- Raw video and landmarks are not uploaded by this scaffold.
- `pgvector` is included for future, purpose-specific embeddings; structured
  measurements remain the source of truth.

## Quality gates

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```
