"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LikeStatus } from "@/lib/likes";

interface LikeButtonProps {
	slug: string;
	initialLikes: number;
	readOnly?: boolean;
}

export function LikeButton({ slug, initialLikes, readOnly = false }: LikeButtonProps) {
	const [likes, setLikes] = useState(initialLikes);
	const [isLiked, setIsLiked] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

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

			if (!response.ok) throw new Error("Failed to toggle like");

			const data = (await response.json()) as LikeStatus & { action: string };

			// Server truth
			setLikes(data.likes);
			setIsLiked(data.isLiked);
		} catch (error) {
			// Rollback on error
			setIsLiked(previousIsLiked);
			setLikes(previousLikes);
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
	);
}
