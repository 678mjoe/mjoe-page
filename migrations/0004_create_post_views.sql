-- Aggregate counts are kept after the temporary deduplication records expire.
CREATE TABLE IF NOT EXISTS post_view_counts (
  post_slug TEXT NOT NULL PRIMARY KEY,
  view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0)
);

CREATE TABLE IF NOT EXISTS post_view_visitors (
  post_slug TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  last_counted_at INTEGER NOT NULL,
  PRIMARY KEY (post_slug, visitor_id)
);

CREATE INDEX IF NOT EXISTS idx_post_view_visitors_expiry
  ON post_view_visitors(last_counted_at);

-- A successful insert or eligible update and its counter increment are atomic.
CREATE TRIGGER IF NOT EXISTS post_view_count_insert
AFTER INSERT ON post_view_visitors
BEGIN
  INSERT INTO post_view_counts (post_slug, view_count) VALUES (NEW.post_slug, 1)
  ON CONFLICT(post_slug) DO UPDATE SET view_count = view_count + 1;
END;

CREATE TRIGGER IF NOT EXISTS post_view_count_update
AFTER UPDATE OF last_counted_at ON post_view_visitors
WHEN NEW.last_counted_at >= OLD.last_counted_at + 1800000
BEGIN
  INSERT INTO post_view_counts (post_slug, view_count) VALUES (NEW.post_slug, 1)
  ON CONFLICT(post_slug) DO UPDATE SET view_count = view_count + 1;
END;

-- IP-derived rate-limit keys are stored only temporarily, never as raw IPs.
CREATE TABLE IF NOT EXISTS post_view_rate_limits (
  identifier TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (identifier, window_start)
);

CREATE INDEX IF NOT EXISTS idx_post_view_rate_limits_expiry
  ON post_view_rate_limits(window_start);
