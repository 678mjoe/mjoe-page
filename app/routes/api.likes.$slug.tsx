import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import type { LikeStatus, LikeResponse } from "@/lib/likes";
import {
	checkRateLimit,
	recordSuspiciousActivity,
	isIPBlocked,
} from "@/lib/rate-limit";
import {
	analyzeRequest,
	checkTimeInterval,
	hasTooManyVisitors,
	isValidVisitorId,
	createErrorResponse,
} from "@/lib/security";

/**
 * GET /api/likes/:slug
 * Returns like count and status for a post
 * Query params: visitorId (optional) - if provided, checks if this visitor has liked
 */
export async function loader({ params, context, request }: LoaderFunctionArgs) {
	const { slug } = params;
	if (!slug) {
		throw createErrorResponse("Invalid slug", 400);
	}

	const db = context.cloudflare.env.DB as D1Database;

	// Analyze request
	const clientInfo = analyzeRequest(request);

	try {
		// Check IP block (for suspicious activity)
		const blocked = await isIPBlocked(db, clientInfo.ip);
		if (blocked) {
			throw createErrorResponse("Too many suspicious requests. Please try again later.", 403);
		}

		// Rate limit for GET requests (per IP, per minute)
		if (!clientInfo.isBot) {
			const rateLimit = await checkRateLimit(db, clientInfo.ip, "api/likes:get", {
				limit: 60, // 60 requests per minute
				window: 60,
			});

			if (!rateLimit.allowed) {
				throw createErrorResponse("Too many requests. Please slow down.", 429);
			}
		}

		// Get post or create if not exists
		let post = await db.prepare("SELECT likes_count FROM posts WHERE slug = ?").bind(slug).first();

		if (!post) {
			await db.prepare("INSERT INTO posts (slug, likes_count) VALUES (?, 0)").bind(slug).run();
			post = { likes_count: 0 };
		}

		// Check if visitor has liked this post (if visitorId provided)
		let isLiked = false;
		const url = new URL(request.url);
		const visitorId = url.searchParams.get("visitorId");

		if (visitorId) {
			// Validate visitor ID format
			if (!isValidVisitorId(visitorId)) {
				throw createErrorResponse("Invalid visitor ID format", 400);
			}

			const existingLike = await db
				.prepare("SELECT id FROM post_likes WHERE post_slug = ? AND visitor_id = ?")
				.bind(slug, visitorId)
				.first();
			isLiked = !!existingLike;
		}

		// Return success
		return {
			likes: (post.likes_count as number) || 0,
			isLiked,
		} satisfies LikeStatus;
	} catch (error) {
		// Re-throw Response objects (already formatted)
		if (error instanceof Response) {
			throw error;
		}

		console.error("Failed to fetch likes:", error);
		throw createErrorResponse("Server error", 500);
	}
}

/**
 * POST /api/likes/:slug
 * Toggles like status for a post
 */
export async function action({ request, params, context }: ActionFunctionArgs) {
	const { slug } = params;
	if (!slug) {
		throw createErrorResponse("Invalid slug", 400);
	}

	if (request.method !== "POST") {
		throw createErrorResponse("Method not allowed", 405);
	}

	const db = context.cloudflare.env.DB as D1Database;

	// Analyze request
	const clientInfo = analyzeRequest(request);

	try {
		// Check for bots
		if (clientInfo.isBot || clientInfo.isSuspicious) {
			// Silently succeed for bots to prevent enumeration
			return {
				likes: 0,
				isLiked: false,
				action: "liked",
			} satisfies LikeResponse;
		}

		// Check IP block
		const blocked = await isIPBlocked(db, clientInfo.ip);
		if (blocked) {
			throw createErrorResponse("Too many suspicious requests. Please try again later.", 403);
		}

		// Parse request body
		const { visitorId } = (await request.json()) as { visitorId: string };

		if (!visitorId) {
			throw createErrorResponse("Invalid visitor ID", 400);
		}

		// Validate visitor ID format
		if (!isValidVisitorId(visitorId)) {
			throw createErrorResponse("Invalid visitor ID format", 400);
		}

		// Multi-layer rate limiting
		const [ipRateLimit, visitorRateLimit] = await Promise.all([
			// IP-level: 20 likes per hour
			checkRateLimit(db, clientInfo.ip, "api/likes:post:ip", {
				limit: 20,
				window: 3600, // 1 hour
			}),
			// Visitor-level: 10 likes per hour
			checkRateLimit(db, visitorId, "api/likes:post:visitor", {
				limit: 10,
				window: 3600, // 1 hour
			}),
		]);

		if (!ipRateLimit.allowed) {
			// Record suspicious activity
			await recordSuspiciousActivity(db, clientInfo.ip, "rate_limit_exceeded", visitorId, clientInfo.userAgent);
			throw createErrorResponse("Too many requests from your location. Please try again later.", 429);
		}

		if (!visitorRateLimit.allowed) {
			throw createErrorResponse("You've reached the like limit. Please try again later.", 429);
		}

		// Check time window: visitor must wait 3 seconds between likes
		const timeWindowValid = await checkTimeInterval(db, slug, visitorId, 3);
		if (!timeWindowValid) {
			throw createErrorResponse("Please wait a few seconds before liking again.", 429);
		}

		// Check if this IP has too many different visitor IDs (suspicious)
		const tooManyVisitors = await hasTooManyVisitors(db, clientInfo.ip, 5, 60);
		if (tooManyVisitors) {
			await recordSuspiciousActivity(db, clientInfo.ip, "multiple_visitors", visitorId, clientInfo.userAgent);
			throw createErrorResponse("Suspicious activity detected. Please try again later.", 403);
		}

		// Check if post exists, create if not
		let post = await db.prepare("SELECT likes_count FROM posts WHERE slug = ?").bind(slug).first();

		if (!post) {
			await db.prepare("INSERT INTO posts (slug, likes_count) VALUES (?, 0)").bind(slug).run();
			post = { likes_count: 0 };
		}

		// Check if already liked
		const existingLike = await db
			.prepare("SELECT id FROM post_likes WHERE post_slug = ? AND visitor_id = ?")
			.bind(slug, visitorId)
			.first();

		let action: "liked" | "unliked";

		if (existingLike) {
			// Unlike: remove record and decrement count
			await db
				.prepare("DELETE FROM post_likes WHERE post_slug = ? AND visitor_id = ?")
				.bind(slug, visitorId)
				.run();

			await db.prepare("UPDATE posts SET likes_count = likes_count - 1 WHERE slug = ?").bind(slug).run();

			action = "unliked";
		} else {
			// Like: add record and increment count
			await db
				.prepare(
					"INSERT INTO post_likes (post_slug, visitor_id, ip_address, user_agent) VALUES (?, ?, ?, ?)"
				)
				.bind(slug, visitorId, clientInfo.ip, clientInfo.userAgent)
				.run();

			await db.prepare("UPDATE posts SET likes_count = likes_count + 1 WHERE slug = ?").bind(slug).run();

			action = "liked";
		}

		// Get updated count
		const result = await db.prepare("SELECT likes_count FROM posts WHERE slug = ?").bind(slug).first();

		return {
			likes: (result?.likes_count as number) || 0,
			isLiked: action === "liked",
			action,
		} satisfies LikeResponse;
	} catch (error) {
		// Re-throw Response objects (already formatted)
		if (error instanceof Response) {
			throw error;
		}

		console.error("Like toggle error:", error);
		throw createErrorResponse("Server error", 500);
	}
}
