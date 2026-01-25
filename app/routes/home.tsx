"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 min-h-screen flex flex-col max-w-[1000px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-1 flex flex-col justify-center items-center text-center py-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.8, bounce: 0.3 }}
            className="relative mb-8"
          >
            <div className="w-40 h-40 rounded-full bg-linear-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/20 overflow-hidden">
              <img
                src="/MJoe.svg"
                alt="M.Joe"
                width={120}
                height={120}
                className="object-contain invert brightness-0"
              />
            </div>
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0 0px rgba(99, 102, 241, 0.3)",
                  "0 0 0 15px rgba(99, 102, 241, 0)",
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
          >
            M.Joe
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xl text-muted-foreground mb-4 flex items-center gap-2"
          >
            <Sparkles className="size-5 text-primary" />
            即使生活并不诗意，也请你诗性地生活
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/blog">
              <Button className="gap-2 min-w-[80px]">
                阅读博客
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="outline" className="gap-2 min-w-[60px]">
                关于本站
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
