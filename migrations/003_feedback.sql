-- Run only in the dedicated feedback database, first on an isolated empty Preview branch.
-- This migration never touches push/reminder storage. The plain login feedback_runtime is provisioned separately.
BEGIN;

DO $$ BEGIN
  IF to_regclass('public.push_subscriptions') IS NOT NULL THEN
    RAISE EXCEPTION 'Use a dedicated feedback database, never notification storage';
  END IF;
END $$;

CREATE TABLE feedback_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key uuid NOT NULL UNIQUE,
  payload_hash text NOT NULL CHECK (payload_hash ~ '^[a-f0-9]{64}$'),
  category text NOT NULL CHECK (category IN ('bug','improvement')),
  description text NOT NULL CHECK (length(description) BETWEEN 1 AND 5000 AND length(btrim(description)) > 0),
  reproduction text CHECK (length(reproduction) <= 3000),
  expected text CHECK (length(expected) <= 2000),
  pathname text CHECK (length(pathname) <= 512 AND pathname LIKE '/%' AND pathname NOT LIKE '//%' AND position(chr(92) in pathname) = 0 AND pathname !~ '[?#[:cntrl:][:space:]]'),
  client_commit text CHECK (client_commit ~ '^[a-f0-9]{40}$'),
  server_commit text CHECK (server_commit ~ '^[a-f0-9]{40}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX feedback_submissions_created_at ON feedback_submissions (created_at);

CREATE TABLE feedback_contacts (
  feedback_id uuid PRIMARY KEY REFERENCES feedback_submissions(id) ON DELETE CASCADE,
  reply_email text NOT NULL CHECK (length(reply_email) BETWEEN 3 AND 254 AND reply_email !~ '[[:cntrl:]]'),
  reply_requested_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE feedback_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL UNIQUE REFERENCES feedback_submissions(id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','processing','delivered','failed')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  lease_token uuid,
  notion_page_id text CHECK (length(notion_page_id) <= 64),
  last_error_code text CHECK (length(last_error_code) <= 80),
  created_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  CHECK ((state = 'processing') = (lease_until IS NOT NULL AND lease_token IS NOT NULL))
);
CREATE INDEX feedback_outbox_pending ON feedback_outbox (next_attempt_at) WHERE state IN ('pending','processing');
CREATE INDEX feedback_outbox_lease ON feedback_outbox (lease_until) WHERE state = 'processing';

CREATE TABLE app_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  stars smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  revision bigint NOT NULL DEFAULT 1 CHECK (revision BETWEEN 1 AND 9007199254740991),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE feedback_rate_limits (
  bucket text PRIMARY KEY CHECK (bucket ~ '^[a-f0-9]{64}$'),
  count integer NOT NULL CHECK (count BETWEEN 1 AND 1000000),
  expires_at timestamptz NOT NULL
);
CREATE INDEX feedback_rate_limits_expires_at ON feedback_rate_limits (expires_at);

REVOKE ALL ON feedback_submissions, feedback_contacts, feedback_outbox, app_ratings, feedback_rate_limits FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO feedback_runtime;
GRANT SELECT, INSERT ON feedback_submissions, feedback_contacts TO feedback_runtime;
GRANT SELECT, INSERT, UPDATE ON app_ratings, feedback_outbox, feedback_rate_limits TO feedback_runtime;
-- Expired-rate cleanup and retention deletion are operator/worker maintenance, not public API privileges.
COMMIT;
