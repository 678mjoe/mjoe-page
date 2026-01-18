"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";

export default function AboutPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen container mx-auto px-4 py-8 max-w-[1000px]"
    >
      <div className="mb-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2 mb-4">
            <ArrowLeft className="size-4" />
            返回首页
          </Button>
        </Link>
        <h1 className="text-4xl font-bold">关于</h1>
      </div>
      <div className="max-w-3xl space-y-6">
        <p className="text-lg text-muted-foreground">
          毛乔的个人主页。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">技术栈</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>React Router v7</strong> - React 全栈框架</li>
          <li><strong>TypeScript</strong> - 类型安全的 JavaScript</li>
          <li><strong>Tailwind CSS v4</strong> - CSS 框架</li>
          <li><strong>shadcn/ui</strong> - 现代 UI 组件库</li>
          <li><strong>react/motion</strong> - 动画库</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">联系我</h2>
        <p>
          Email：public@mjoe.page
        </p>
      </div>
    </motion.div>
  );
}
