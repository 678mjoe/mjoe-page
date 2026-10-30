import { analyzeRequest } from "./security";

const DEDUPLICATION_MS = 30 * 60 * 1_000;
const RATE_LIMIT_MS = 60 * 1_000;
const RATE_LIMIT_REQUESTS = 60;

/** Reject recognizable bots without requiring Cloudflare Bot Management. */
export function isAutomatedView(request: Request): boolean {
  const client = analyzeRequest(request);
  const metadata = request.cf?.botManagement;
  const botManagement = metadata && typeof metadata === "object"
    ? metadata as { verifiedBot?: unknown; score?: unknown }
    : undefined;

  return (
    client.isBot ||
    client.isSuspicious ||
    botManagement?.verifiedBot === true ||
    (typeof botManagement?.score === "number" &&
      botManagement.score > 0 &&
      botManagement.score < 30)
  );
}

/** Rate-limit by a short-lived IP-derived key, without storing the raw IP. */
export async function allowViewRequest(db: D1Database, ip: string | null, now: number): Promise<boolean> {
  // Do not group every request with missing Cloudflare metadata under one key.
  if (!ip) return true;

  const windowStart = Math.floor(now / RATE_LIMIT_MS) * RATE_LIMIT_MS;
  const input = new TextEncoder().encode(`${windowStart}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  const identifier = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");

  const result = await db.prepare(`
    INSERT INTO post_view_rate_limits (identifier, window_start, request_count)
    VALUES (?, ?, 1)
    ON CONFLICT(identifier, window_start) DO UPDATE SET request_count = request_count + 1
    WHERE request_count < ?
    RETURNING request_count
  `).bind(identifier, windowStart, RATE_LIMIT_REQUESTS).first();

  return result !== null;
}

/** One statement atomically applies deduplication and records the counted view via a trigger. */
export async function recordPostView(db: D1Database, slug: string, visitorId: string, ip: string | null, now: number): Promise<void> {
  await db.prepare(`
    INSERT INTO post_view_visitors (post_slug, visitor_id, last_counted_at, ip_address)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(post_slug, visitor_id) DO UPDATE SET
      last_counted_at = excluded.last_counted_at,
      ip_address = excluded.ip_address
    WHERE post_view_visitors.last_counted_at <= excluded.last_counted_at - ?
  `).bind(slug, visitorId, now, ip, DEDUPLICATION_MS).run();
}

/** Remove expired transient records while retaining the aggregate counts. */
export async function cleanupPostViews(db: D1Database, now: number): Promise<void> {
  await db.batch([
    db.prepare(`
      DELETE FROM post_view_visitors WHERE (post_slug, visitor_id) IN (
        SELECT post_slug, visitor_id FROM post_view_visitors
        WHERE last_counted_at <= ? ORDER BY last_counted_at LIMIT 500
      )
    `).bind(now - DEDUPLICATION_MS),
    db.prepare(`
      DELETE FROM post_view_rate_limits WHERE (identifier, window_start) IN (
        SELECT identifier, window_start FROM post_view_rate_limits
        WHERE window_start < ? ORDER BY window_start LIMIT 500
      )
    `).bind(now - 2 * RATE_LIMIT_MS),
  ]);
}
