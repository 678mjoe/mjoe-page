-- Add the IP to the temporary deduplication record so it can be written
-- atomically with the aggregate counter by the existing triggers.
ALTER TABLE post_view_visitors ADD COLUMN ip_address TEXT;

-- One row per counted view; NULL means Cloudflare did not provide an IP.
CREATE TABLE IF NOT EXISTS post_view_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,
  ip_address TEXT,
  viewed_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_post_view_events_slug_time
  ON post_view_events(post_slug, viewed_at);

DROP TRIGGER IF EXISTS post_view_count_insert;

DROP TRIGGER IF EXISTS post_view_count_update;

CREATE TRIGGER post_view_count_insert
AFTER INSERT ON post_view_visitors
BEGIN
  INSERT INTO post_view_counts (post_slug, view_count) VALUES (NEW.post_slug, 1)
  ON CONFLICT(post_slug) DO UPDATE SET view_count = view_count + 1;
  INSERT INTO post_view_events (post_slug, ip_address, viewed_at)
  VALUES (NEW.post_slug, NEW.ip_address, NEW.last_counted_at);
END;

CREATE TRIGGER post_view_count_update
AFTER UPDATE OF last_counted_at ON post_view_visitors
WHEN NEW.last_counted_at >= OLD.last_counted_at + 1800000
BEGIN
  INSERT INTO post_view_counts (post_slug, view_count) VALUES (NEW.post_slug, 1)
  ON CONFLICT(post_slug) DO UPDATE SET view_count = view_count + 1;
  INSERT INTO post_view_events (post_slug, ip_address, viewed_at)
  VALUES (NEW.post_slug, NEW.ip_address, NEW.last_counted_at);
END;
