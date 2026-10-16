CREATE TABLE IF NOT EXISTS push_subscriptions (
  id text PRIMARY KEY,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  token_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS push_deliveries (
  subscription_id text NOT NULL REFERENCES push_subscriptions(id) ON DELETE CASCADE,
  day date NOT NULL,
  status text NOT NULL DEFAULT 'claimed' CHECK (status IN ('claimed', 'sent', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subscription_id, day)
);

CREATE TABLE IF NOT EXISTS push_rate_limits (
  bucket text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1,
  expires_at timestamptz NOT NULL
);
