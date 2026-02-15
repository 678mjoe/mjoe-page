import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import type { LikeStatus, LikeResponse } from "@/lib/likes";

/**
 * GET /api/likes/:slug
 * Returns like count and status for a post
 * Query params: visitorId (optional) - if provided, checks if this visitor has liked
 */
export async function loader({ params, context, request }: LoaderFunctionArgs) {
	const { slug } = params;
	if (!slug) {
		throw new Response("Invalid slug", { status: 400 });
	}

	const db = context.cloudflare.env.DB as D1Database;

	try {
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
			const existingLike = await db
				.prepare("SELECT id FROM post_likes WHERE post_slug = ? AND visitor_id = ?")
				.bind(slug, visitorId)
				.first();
			isLiked = !!existingLike;
		}

		return {
			likes: (post.likes_count as number) || 0,
			isLiked,
		} satisfies LikeStatus;
	} catch (error) {
		console.error("Failed to fetch likes:", error);
		throw new Response("Server error", { status: 500 });
	}
}

/**
 * POST /api/likes/:slug
 * Toggles like status for a post
 */
export async function action({ request, params, context }: ActionFunctionArgs) {
	const { slug } = params;
	if (!slug) {
		throw new Response("Invalid slug", { status: 400 });
	}

	if (request.method !== "POST") {
		throw new Response("Method not allowed", { status: 405 });
	}

	const db = context.cloudflare.env.DB as D1Database;

	try {
		const { visitorId } = (await request.json()) as { visitorId: string };

		if (!visitorId) {
			throw new Response("Invalid visitor ID", { status: 400 });
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
			await db.prepare("INSERT INTO post_likes (post_slug, visitor_id) VALUES (?, ?)").bind(slug, visitorId).run();

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
		console.error("Like toggle error:", error);
		throw new Response("Server error", { status: 500 });
	}
}
