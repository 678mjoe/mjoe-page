"use client";

import { motion } from "motion/react";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className="py-8 text-center text-muted-foreground text-sm"
    >
      <p>© 2026 By M.Joe With 💗. </p>
    </motion.footer>
  );
}
