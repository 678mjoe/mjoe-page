"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Copyright, Mail, Sparkles, Code, Github } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";

function Section({ children, index }: { children: React.ReactNode; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="min-h-screen container mx-auto px-4 py-8 max-w-[1000px]"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-8"
        >
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="size-4" />
              返回首页
            </Button>
          </Link>
          <h1 className="text-4xl font-bold">关于</h1>
          <p className="text-muted-foreground mt-2">了解毛乔和他的小站</p>
        </motion.div>

        <div className="space-y-6 max-w-3xl">
          <Section index={1}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-2">
                <div className="flex items-start gap-6">
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <div className="w-32 h-32 rounded-2xl flex items-center justify-center border border-primary/10">
                      <img
                        src="/MJoe.svg"
                        alt="M.Joe"
                        width={100}
                        height={100}
                        className="object-contain"
                      />
                    </div>
                  </motion.div>
                  <div className="flex-1 space-y-3">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                      <Sparkles className="size-5 text-primary" />
                      关于毛乔
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      左边的是毛乔本体。它既不是猫，也不是狗。就是毛乔而已。
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      他的特点是左边比右边高。当然对毛乔自己来说或者从背面看就是右边比左边高了，可是现在这个世界上好像暂时还没有人从背后看到过毛乔。所以不妨还是说左边比右边高吧。
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      毛乔还有各种变体，比如狗乔（不要问猫乔去哪里了）、毛毛乔、没毛乔。
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      现实中目前是一位内地高三生。理论上所有符合这一点的都有可能是毛乔啦。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Section>

          <Section index={2}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-2 space-y-4">
                <h2 className="text-2xl font-semibold">为啥本站是这样的</h2>
                <p className="text-muted-foreground leading-relaxed">
                  毛乔平时会写一点奇奇怪怪或者有点矫情的小东西。不停变来变去的座右铭最后定格在 <span className="text-foreground font-medium">"即使生活并不诗意，也请你诗性地生活。"</span>
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  浅尝辄止的事情有一大沓，但真正坚持下来的只有薄薄一点点。本站的写东西和geek应该算是两个，你能看到它们或许也是某种幸存者效应吧。
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  不过本站的板块很可能会不定期新增，欢迎追踪哦
                </p>
              </CardContent>
            </Card>
          </Section>

          <Section index={3}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Code className="size-5 text-primary" />
                  本站技术栈
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <span className="font-medium">React Router v7</span>
                  <Badge variant="outline">全栈框架</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <span className="font-medium">TypeScript</span>
                  <Badge variant="outline">类型安全</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <span className="font-medium">Tailwind CSS v4</span>
                  <Badge variant="outline">CSS 框架</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <span className="font-medium">shadcn/ui</span>
                  <Badge variant="outline">UI 组件库</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <span className="font-medium">motion/react</span>
                  <Badge variant="outline">动画库</Badge>
                </div>
              </CardContent>
            </Card>
          </Section>

          <Section index={4}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-2 space-y-4">
                <h2 className="text-2xl font-semibold">版权信息</h2>
                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Copyright className="size-4" />
                    <span>Copyright M.Joe毛乔 2026</span>
                  </p>
                  <p className="text-muted-foreground">
                    本站项目主要基于<span className="text-foreground font-medium"> MIT协议 </span>开源。
                  </p>
                  <p className="text-muted-foreground">
                    博客文章采用<span className="text-foreground font-medium"> CC BY-NC 4.0 </span>版权协议。
                  </p>
                  <p className="text-muted-foreground">
                    详见本站 <a href="https://github.com/678mjoe/mjoe-page" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub</a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </Section>

          <Section index={5}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-2">
                <h2 className="text-2xl font-semibold mb-4">联系我</h2>
                <div className="space-y-3">
                  <a
                    href="mailto:public@mjoe.page"
                    className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group"
                  >
                    <Mail className="size-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">public@mjoe.page</span>
                  </a>
                  <a
                    href="https://github.com/678mjoe/mjoe-page"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group"
                  >
                    <Github className="size-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">GitHub</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          </Section>
        </div>
      </motion.div>
    </div>
  );
}
