// Type definitions for blog like feature

/**
 * Like status returned from API
 */
export interface LikeStatus {
  likes: number;
  isLiked: boolean;
}

/**
 * Request body for like/unlike operations
 */
export interface LikeRequest {
  visitorId: string;
}

/**
 * Response from like/unlike API call
 */
export interface LikeResponse extends LikeStatus {
  action: "liked" | "unliked";
}

/**
 * Post like record from database
 */
export interface PostLikeRecord {
  id: number;
  post_slug: string;
  visitor_id: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

/**
 * Post record with likes
 */
export interface PostWithLikes {
  slug: string;
  likes_count: number;
}
