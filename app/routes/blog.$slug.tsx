"use client";

import { Link, useLoaderData, useParams } from "react-router";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getPost, type Frontmatter } from "@/lib/posts";
import { LikeButton } from "@/components/like-button";

const components: Record<string, React.ComponentType<any>> = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="font-bold mb-4 mt-8 text-3xl" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="font-semibold mb-3 mt-6 text-2xl" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="font-semibold mb-2 mt-4 text-xl" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="leading-relaxed mb-4 text-foreground/90 font-serif" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-inside mb-4 space-y-1 font-serif" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-inside mb-4 space-y-1 font-serif" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="text-foreground/90 font-serif" {...props} />
  ),
  blockquote: (props: React.QuoteHTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground"
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4 text-sm" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="text-primary hover:underline" {...props} />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold" {...props} />
  ),
};

export function meta({ loaderData }: { loaderData: { frontmatter: Frontmatter } }) {
  const { title, excerpt } = loaderData.frontmatter;
  const description = excerpt || title;

  return [
    { title: `${title} - M.Joe Page | 毛乔的个人主页` },
    { name: "description", content: description },
  ];
}

export async function loader({
	params,
	context,
}: {
	params: { slug: string };
	context: { cloudflare: { env: { DB: D1Database } } };
}) {
	const { slug } = params;
	const module = getPost(slug);

	if (!module) {
		throw new Response("Not Found", { status: 404 });
	}

	// Fetch likes from D1 database
	const db = context.cloudflare.env.DB;
	let initialLikes = 0;

	try {
		let post = await db.prepare("SELECT likes_count FROM posts WHERE slug = ?").bind(slug).first();

		if (!post) {
			// Create post entry if not exists
			await db.prepare("INSERT INTO posts (slug, likes_count) VALUES (?, 0)").bind(slug).run();
			post = { likes_count: 0 };
		}

		initialLikes = (post.likes_count as number) || 0;
	} catch (error) {
		console.error("Failed to fetch likes:", error);
	}

	return {
		frontmatter: module.frontmatter,
		initialLikes,
	};
}

export default function BlogPostPage() {
	const { frontmatter, initialLikes } = useLoaderData() as {
		frontmatter: Frontmatter;
		initialLikes: number;
	};
	const { slug } = useParams() as { slug: string };
  const module = slug ? getPost(slug) : null;

  if (!module) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="min-h-screen container mx-auto px-4 py-8 max-w-[1000px]"
      >
        <p>文章加载失败</p>
      </motion.div>
    );
  }

  const Content = module.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen container mx-auto px-4 py-8 max-w-[1000px]"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <Link to="/blog">
          <Button variant="ghost" size="sm" className="gap-2 mb-6">
            <ArrowLeft className="size-4" />
            返回博客
          </Button>
        </Link>
      </motion.div>

      <article>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-4xl font-bold mb-4"
        >
          {frontmatter.title}
        </motion.h1>
        {frontmatter.date && (
          <motion.time
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-muted-foreground mb-8 block"
          >
            {frontmatter.date}
          </motion.time>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="prose prose-neutral prose-lg max-w-none dark:prose-invert font-serif"
        >
          <Content components={components} />
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="border-t border-border mt-12 mb-8"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex items-center gap-4"
        >
          <LikeButton slug={slug} initialLikes={initialLikes} />
        </motion.div>
      </article>
    </motion.div>
  );
}
