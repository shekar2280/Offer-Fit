"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  motionKey: string;
}

const variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export function PageTransition({ children, motionKey }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={motionKey}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          duration: 0.2,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        style={{ minHeight: "100vh", width: "100%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function PanelTransition({
  children,
  show,
}: {
  children: ReactNode;
  show: boolean;
}) {
  return (
    <motion.div
      initial={false}
      animate={{
        opacity: show ? 1 : 0,
        y: show ? 0 : 6,
        pointerEvents: show ? "auto" : "none",
      }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{ position: show ? "relative" : "absolute", width: "100%" }}
    >
      {children}
    </motion.div>
  );
}
