/**
 * Rate limiting utility for D1 database
 * Provides functions to check and enforce rate limits
 */

export interface RateLimitResult {
	allowed: boolean;
	limit: number;
	remaining: number;
	resetAt: number; // Unix timestamp
}

export interface RateLimitConfig {
	limit: number; // Maximum requests allowed
	window: number; // Time window in seconds
}

/**
 * Get the current time window start timestamp for a given window size
 */
function getWindowStart(windowSeconds: number): number {
	const now = Math.floor(Date.now() / 1000);
	return Math.floor(now / windowSeconds) * windowSeconds;
}

/**
 * Check rate limit for a given identifier and endpoint
 *
 * @param db - D1 database instance
 * @param identifier - Unique identifier (IP address, visitor_id, etc.)
 * @param endpoint - Endpoint identifier (e.g., 'api/likes')
 * @param config - Rate limit configuration
 * @returns RateLimitResult with allowed status and metadata
 */
export async function checkRateLimit(
	db: D1Database,
	identifier: string,
	endpoint: string,
	config: RateLimitConfig
): Promise<RateLimitResult> {
	const { limit, window } = config;
	const windowStart = getWindowStart(window);

	try {
		// Try to get existing rate limit record
		const existing = await db
			.prepare(
				"SELECT request_count FROM rate_limits WHERE identifier = ? AND endpoint = ? AND window_start = ?"
			)
			.bind(identifier, endpoint, windowStart)
			.first();

		if (!existing) {
			// First request in this window - create new record
			await db
				.prepare(
					"INSERT INTO rate_limits (identifier, endpoint, window_start, request_count) VALUES (?, ?, ?, 1)"
				)
				.bind(identifier, endpoint, windowStart)
				.run();

			return {
				allowed: true,
				limit,
				remaining: limit - 1,
				resetAt: windowStart + window,
			};
		}

		// Check if limit is exceeded
		const currentCount = existing.request_count as number;
		const remaining = Math.max(0, limit - currentCount);
		const allowed = currentCount < limit;

		if (allowed) {
			// Increment counter
			await db
				.prepare(
					"UPDATE rate_limits SET request_count = request_count + 1 WHERE identifier = ? AND endpoint = ? AND window_start = ?"
				)
				.bind(identifier, endpoint, windowStart)
				.run();
		}

		return {
			allowed,
			limit,
			remaining,
			resetAt: windowStart + window,
		};
	} catch (error) {
		console.error("Rate limit check error:", error);
		// Fail open - allow request if rate limiting fails
		return {
			allowed: true,
			limit,
			remaining: limit,
			resetAt: windowStart + window,
		};
	}
}

/**
 * Clean up old rate limit records
 * Should be called periodically (e.g., via cron)
 *
 * @param db - D1 database instance
 * @param olderThanSeconds - Delete records older than this many seconds
 */
export async function cleanupOldRateLimits(db: D1Database, olderThanSeconds: number = 86400): Promise<void> {
	try {
		const cutoffTime = Math.floor(Date.now() / 1000) - olderThanSeconds;

		await db.prepare("DELETE FROM rate_limits WHERE window_start < ?").bind(cutoffTime).run();
	} catch (error) {
		console.error("Rate limit cleanup error:", error);
	}
}

/**
 * Record suspicious activity for security monitoring
 *
 * @param db - D1 database instance
 * @param ipAddress - IP address of the request
 * @param visitorId - Visitor ID (optional)
 * @param userAgent - User-Agent string (optional)
 * @param reason - Reason for flagging as suspicious
 */
export async function recordSuspiciousActivity(
	db: D1Database,
	ipAddress: string,
	reason: string,
	visitorId?: string,
	userAgent?: string
): Promise<void> {
	try {
		await db
			.prepare(
				"INSERT INTO suspicious_activity (ip_address, visitor_id, user_agent, reason) VALUES (?, ?, ?, ?)"
			)
			.bind(ipAddress, visitorId || null, userAgent || null, reason)
			.run();
	} catch (error) {
		console.error("Failed to record suspicious activity:", error);
	}
}

/**
 * Check if an IP address is temporarily blocked due to suspicious activity
 *
 * @param db - D1 database instance
 * @param ipAddress - IP address to check
 * @param blockDurationMinutes - How long to block after suspicious activity (default: 10 minutes)
 * @returns true if IP is blocked
 */
export async function isIPBlocked(
	db: D1Database,
	ipAddress: string,
	blockDurationMinutes: number = 10
): Promise<boolean> {
	try {
		const cutoffTime = new Date(Date.now() - blockDurationMinutes * 60 * 1000).toISOString();

		const recentSuspiciousActivity = await db
			.prepare(
				"SELECT COUNT(*) as count FROM suspicious_activity WHERE ip_address = ? AND created_at > ?"
			)
			.bind(ipAddress, cutoffTime)
			.first();

		const count = (recentSuspiciousActivity?.count as number) || 0;

		// Block if there are 3 or more suspicious activities in the time window
		return count >= 3;
	} catch (error) {
		console.error("IP block check error:", error);
		return false;
	}
}

/**
 * Clean up old suspicious activity records
 *
 * @param db - D1 database instance
 * @param olderThanDays - Delete records older than this many days
 */
export async function cleanupOldSuspiciousActivity(db: D1Database, olderThanDays: number = 30): Promise<void> {
	try {
		const cutoffTime = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();

		await db.prepare("DELETE FROM suspicious_activity WHERE created_at < ?").bind(cutoffTime).run();
	} catch (error) {
		console.error("Suspicious activity cleanup error:", error);
	}
}
