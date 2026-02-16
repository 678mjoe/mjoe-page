/**
 * Security utilities for request validation and bot detection
 */

import { isbot } from "isbot";

export interface ClientInfo {
	ip: string;
	userAgent: string;
	isBot: boolean;
	isSuspicious: boolean;
}

/**
 * Extract IP address from request headers
 * Checks Cloudflare-specific headers first
 */
export function extractIP(request: Request): string {
	return (
		request.headers.get("CF-Connecting-IP") ||
		request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
		request.headers.get("X-Real-IP") ||
		"unknown"
	);
}

/**
 * Extract User-Agent from request headers
 */
export function extractUserAgent(request: Request): string {
	return request.headers.get("User-Agent") || "unknown";
}

/**
 * Check if User-Agent is suspicious
 */
export function isSuspiciousUserAgent(userAgent: string): boolean {
	const ua = userAgent.toLowerCase();

	// Empty or very short UA
	if (!userAgent || userAgent.length < 10) {
		return true;
	}

	// Common automation tools
	const suspiciousKeywords = [
		"curl",
		"wget",
		"python",
		"python-requests",
		"node-fetch",
		"axios",
		"java",
		"perl",
		"ruby",
		"go-http",
		"postman",
		"insomnia",
		"httpie",
		"lwp::simple",
		"libwww-perl",
		"mechanize",
		"phantom",
		"selenium",
		"puppeteer",
		"playwright",
		"headless",
		"spider",
		"crawler",
		"scraper",
		"bot",
	];

	// Check for suspicious keywords (excluding legitimate bots)
	for (const keyword of suspiciousKeywords) {
		if (ua.includes(keyword)) {
			return true;
		}
	}

	return false;
}

/**
 * Analyze request and extract client information
 */
export function analyzeRequest(request: Request): ClientInfo {
	const ip = extractIP(request);
	const userAgent = extractUserAgent(request);
	const isBot = isbot(userAgent);
	const isSuspicious = isSuspiciousUserAgent(userAgent);

	return {
		ip,
		userAgent,
		isBot,
		isSuspicious,
	};
}

/**
 * Check if time window limit is respected
 *
 * @param db - D1 database instance
 * @param slug - Post slug
 * @param visitorId - Visitor ID
 * @param minIntervalSeconds - Minimum interval between requests (default: 3 seconds)
 * @returns true if the minimum interval has passed
 */
export async function checkTimeInterval(
	db: D1Database,
	slug: string,
	visitorId: string,
	minIntervalSeconds: number = 3
): Promise<boolean> {
	try {
		const cutoffTime = new Date(Date.now() - minIntervalSeconds * 1000).toISOString();

		const recentLike = await db
			.prepare("SELECT created_at FROM post_likes WHERE post_slug = ? AND visitor_id = ? AND created_at > ?")
			.bind(slug, visitorId, cutoffTime)
			.first();

		return !recentLike; // true if no recent like found
	} catch (error) {
		console.error("Time interval check error:", error);
		return true; // Allow on error
	}
}

/**
 * Check if IP has multiple visitor IDs (suspicious behavior)
 *
 * @param db - D1 database instance
 * @param ipAddress - IP address to check
 * @param maxVisitors - Maximum number of unique visitors per IP (default: 5)
 * @param timeWindowMinutes - Time window to check (default: 60 minutes)
 * @returns true if IP has too many unique visitors
 */
export async function hasTooManyVisitors(
	db: D1Database,
	ipAddress: string,
	maxVisitors: number = 5,
	timeWindowMinutes: number = 60
): Promise<boolean> {
	try {
		const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000).toISOString();

		const result = await db
			.prepare(
				"SELECT COUNT(DISTINCT visitor_id) as count FROM post_likes WHERE ip_address = ? AND created_at > ?"
			)
			.bind(ipAddress, cutoffTime)
			.first();

		const uniqueVisitors = (result?.count as number) || 0;

		return uniqueVisitors > maxVisitors;
	} catch (error) {
		console.error("Multiple visitors check error:", error);
		return false; // Allow on error
	}
}

/**
 * Validate visitor ID format
 * Ensures the visitor ID is a valid UUID
 */
export function isValidVisitorId(visitorId: string): boolean {
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	return uuidRegex.test(visitorId);
}

/**
 * Create a sanitized response with rate limit headers
 */
export function createRateLimitResponse(
	data: unknown,
	rateLimit: { limit: number; remaining: number; resetAt: number }
): Response {
	return new Response(JSON.stringify(data), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
			"X-RateLimit-Limit": rateLimit.limit.toString(),
			"X-RateLimit-Remaining": rateLimit.remaining.toString(),
			"X-RateLimit-Reset": rateLimit.resetAt.toString(),
		},
	});
}

/**
 * Create an error response
 */
export function createErrorResponse(message: string, status: number): Response {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: {
			"Content-Type": "application/json",
		},
	});
}
