CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE users (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE consent_records (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  version text NOT NULL,
  granted_at timestamptz NOT NULL,
  revoked_at timestamptz,
  UNIQUE (user_id, version, granted_at)
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  state text NOT NULL CHECK (state IN ('awaiting_consent', 'setup', 'ready', 'active', 'completed')),
  consent_record_id uuid REFERENCES consent_records(id),
  scheduled_for timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE measurement_sets (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  captured_at timestamptz NOT NULL,
  algorithm_version text NOT NULL,
  quality real NOT NULL CHECK (quality BETWEEN 0 AND 1),
  capture_metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE measurements (
  id uuid PRIMARY KEY,
  measurement_set_id uuid NOT NULL REFERENCES measurement_sets(id) ON DELETE CASCADE,
  name text NOT NULL,
  value double precision NOT NULL,
  unit text NOT NULL,
  UNIQUE (measurement_set_id, name)
);

CREATE TABLE conversation_messages (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE feature_vectors (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  purpose text NOT NULL,
  model_name text NOT NULL,
  model_version text NOT NULL,
  embedding vector(1536) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth_secret text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_events (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX measurement_sets_session_id_idx ON measurement_sets(session_id);
CREATE INDEX audit_events_user_id_created_at_idx ON audit_events(user_id, created_at DESC);
