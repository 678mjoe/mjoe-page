"use client";

import { Link, useLoaderData } from "react-router";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllPosts, type Post } from "@/lib/posts";

export function meta() {
  return [
    { title: "博客 - M.Joe Page" },
    { name: "description", content: "毛乔的博客，留下走过的足迹。包含随便写写和技术博客两个分类。" },
  ];
}

export async function loader() {
  const posts = getAllPosts();
  return { posts };
}

function PostCard({ post, index }: { post: Post; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="pt-6">
          <article>
            <div className="flex items-center justify-between mb-3">
              <time className="text-sm text-muted-foreground">{post.date}</time>
            </div>
            <Link to={`/blog/${post.slug}`}>
              <h2 className="text-2xl font-semibold mb-3 hover:text-primary transition-colors">
                {post.title}
              </h2>
            </Link>
            {post.excerpt && (
              <p className="text-muted-foreground/90 leading-relaxed mb-4">
                {post.excerpt}
              </p>
            )}
            <Link to={`/blog/${post.slug}`}>
              <Button variant="link" className="px-0">
                阅读全文 →
              </Button>
            </Link>
          </article>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function BlogPage() {
  const { posts } = useLoaderData<{ posts: Post[] }>();
  const essayPosts = posts.filter((p) => p.category === "essay");
  const techPosts = posts.filter((p) => p.category === "tech");

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
        className="mb-8"
      >
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2 mb-4">
            <ArrowLeft className="size-4" />
            返回首页
          </Button>
        </Link>
        <h1 className="text-4xl font-bold">博客</h1>
        <p className="text-muted-foreground mt-2">留下来过的足迹</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <Tabs defaultValue="essay" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 max-w-[300px]">
            <TabsTrigger value="essay">随便写写</TabsTrigger>
            <TabsTrigger value="tech">技术博客</TabsTrigger>
          </TabsList>

          <TabsContent value="essay" className="space-y-6">
            {essayPosts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">暂时没有文章哦</p>
                </CardContent>
              </Card>
            ) : (
              essayPosts.map((post, index) => <PostCard key={post.slug} post={post} index={index} />)
            )}
          </TabsContent>

          <TabsContent value="tech" className="space-y-6">
            {techPosts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">暂时没有技术文章哦</p>
                </CardContent>
              </Card>
            ) : (
              techPosts.map((post, index) => <PostCard key={post.slug} post={post} index={index} />)
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
