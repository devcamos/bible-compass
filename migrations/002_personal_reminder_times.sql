-- Postgres resolves daylight-saving gaps/folds in the selected IANA timezone.
CREATE OR REPLACE FUNCTION next_push_delivery(reminder text, zone text, after_at timestamptz)
RETURNS timestamptz LANGUAGE sql STABLE AS $$
  SELECT CASE
    WHEN (((after_at AT TIME ZONE zone)::date + reminder::time) AT TIME ZONE zone) > after_at
      THEN (((after_at AT TIME ZONE zone)::date + reminder::time) AT TIME ZONE zone)
    ELSE ((((after_at AT TIME ZONE zone)::date + 1) + reminder::time) AT TIME ZONE zone)
  END
$$;

ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS reminder_time text NOT NULL DEFAULT '08:00';
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS time_zone text NOT NULL DEFAULT 'UTC';
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS next_send_at timestamptz;
UPDATE push_subscriptions SET next_send_at = next_push_delivery(reminder_time, time_zone, now()) WHERE next_send_at IS NULL;
ALTER TABLE push_subscriptions ALTER COLUMN next_send_at SET NOT NULL;
CREATE INDEX IF NOT EXISTS push_subscriptions_due_idx ON push_subscriptions (next_send_at);
