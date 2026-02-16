"use client";

import { useState, useEffect } from "react";
import { Heart, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LikeStatus } from "@/lib/likes";

interface LikeButtonProps {
	slug: string;
	initialLikes: number;
	readOnly?: boolean;
}

type ErrorMessage = {
	message: string;
	type: "error" | "warning";
};

export function LikeButton({ slug, initialLikes, readOnly = false }: LikeButtonProps) {
	const [likes, setLikes] = useState(initialLikes);
	const [isLiked, setIsLiked] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<ErrorMessage | null>(null);

	// Get or create visitor ID from localStorage
	const getOrCreateVisitorId = (): string => {
		if (typeof window === "undefined") return "";

		let id = localStorage.getItem("visitor_id");
		if (!id) {
			id = crypto.randomUUID();
			localStorage.setItem("visitor_id", id);
		}
		return id;
	};

	// Clear error messages after 3 seconds
	useEffect(() => {
		if (error) {
			const timer = setTimeout(() => setError(null), 3000);
			return () => clearTimeout(timer);
		}
	}, [error]);

	// Check if the current visitor has liked this post on mount
	useEffect(() => {
		if (readOnly || typeof window === "undefined") return;

		const checkLikeStatus = async () => {
			try {
				const visitorId = getOrCreateVisitorId();
				const response = await fetch(`/api/likes/${slug}?visitorId=${encodeURIComponent(visitorId)}`);

				if (!response.ok) return;

				const data = (await response.json()) as LikeStatus;
				setIsLiked(data.isLiked);
				setLikes(data.likes);
			} catch (error) {
				console.error("Failed to check like status:", error);
			}
		};

		checkLikeStatus();
	}, [slug, readOnly]);

	const handleToggle = async () => {
		if (isLoading || readOnly) return;

		setIsLoading(true);
		setError(null);

		const optimisticIsLiked = !isLiked;
		const optimisticLikes = optimisticIsLiked ? likes + 1 : likes - 1;

		// Optimistic update
		const previousIsLiked = isLiked;
		const previousLikes = likes;
		setIsLiked(optimisticIsLiked);
		setLikes(optimisticLikes);

		try {
			const visitorId = getOrCreateVisitorId();
			const response = await fetch(`/api/likes/${slug}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ visitorId }),
			});

			if (!response.ok) {
				// Handle different error statuses
				if (response.status === 429) {
					const errorData = (await response.json()) as { error?: string };
					throw new Error(errorData.error || "Too many requests. Please try again later.");
				} else if (response.status === 403) {
					const errorData = (await response.json()) as { error?: string };
					throw new Error(errorData.error || "Request blocked for security reasons.");
				} else {
					throw new Error("Failed to toggle like");
				}
			}

			const data = (await response.json()) as LikeStatus & { action: string };

			// Server truth
			setLikes(data.likes);
			setIsLiked(data.isLiked);
		} catch (error) {
			// Rollback on error
			setIsLiked(previousIsLiked);
			setLikes(previousLikes);

			// Show user-friendly error message
			const message = error instanceof Error ? error.message : "An error occurred";
			setError({
				message,
				type: message.includes("security") ? "error" : "warning",
			});

			console.error("Like toggle error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	// Read-only version for blog listing
	if (readOnly) {
		return (
			<div className={cn("flex items-center gap-1.5 text-sm text-muted-foreground")}>
				<Heart className={cn("size-4", isLiked && "fill-current text-red-500")} />
				<span className="tabular-nums">{likes}</span>
			</div>
		);
	}

	// Interactive version for blog post page
	return (
		<div className="flex flex-col items-start gap-2">
			<motion.div
				whileHover={{ scale: isLoading ? 1 : 1.02 }}
				whileTap={{ scale: isLoading ? 1 : 0.98 }}
			>
				<Button
					variant={isLiked ? "default" : "outline"}
					size="sm"
					onClick={handleToggle}
					disabled={isLoading}
					className={cn(
						"gap-2",
						isLiked && "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
					)}
					aria-label={isLiked ? "Unlike post" : "Like post"}
				>
					<motion.div
						animate={{ scale: isLiked ? [1, 1.3, 1] : 1 }}
						transition={{ duration: 0.3 }}
					>
						<Heart className={cn("size-4", isLiked && "fill-current")} />
					</motion.div>
					<span className="font-medium tabular-nums">{likes}</span>
				</Button>
			</motion.div>

			{/* Error message display */}
			<AnimatePresence>
				{error && (
					<motion.div
						initial={{ opacity: 0, height: 0, y: -10 }}
						animate={{ opacity: 1, height: "auto", y: 0 }}
						exit={{ opacity: 0, height: 0, y: -10 }}
						transition={{ duration: 0.2 }}
						className={cn(
							"flex items-center gap-2 text-sm",
							error.type === "error" ? "text-red-500" : "text-amber-500"
						)}
					>
						<AlertCircle className="size-4 shrink-0" />
						<span>{error.message}</span>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
