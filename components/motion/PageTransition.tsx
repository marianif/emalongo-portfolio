"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Scaffold page-enter transition (Framer Motion). A simple fade for now;
 * real choreography to be designed via the flow plugin.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
