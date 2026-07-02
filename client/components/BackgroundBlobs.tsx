'use client';

import { motion } from 'framer-motion';

export default function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none">
      {/* Blob 1: Top Right */}
      <motion.div
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-1/4 -right-1/4 w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-indigo-500/8 via-purple-500/5 to-transparent blur-[100px] dark:from-indigo-500/12 dark:via-purple-500/8"
      />

      {/* Blob 2: Center Left */}
      <motion.div
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -30, 0],
          scale: [1, 0.85, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute top-1/4 -left-1/4 w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-amber-500/5 via-rose-500/4 to-transparent blur-[120px] dark:from-amber-500/8 dark:via-rose-500/6"
      />

      {/* Blob 3: Bottom Center */}
      <motion.div
        animate={{
          x: [0, 30, -30, 0],
          y: [0, 50, -20, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
        className="absolute -bottom-1/4 left-1/3 w-[50vw] h-[50vw] rounded-full bg-gradient-to-t from-emerald-500/3 via-sky-500/4 to-transparent blur-[110px] dark:from-emerald-500/5 dark:via-sky-500/6"
      />
    </div>
  );
}
