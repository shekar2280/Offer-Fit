"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode } from "react";

const variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export function TransitionShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
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
