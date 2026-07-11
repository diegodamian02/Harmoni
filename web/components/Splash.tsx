"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import styles from "./Splash.module.css";

const LETTERS = "harmoni".split("");
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function Splash({ onComplete }: { onComplete: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setExiting(true), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      className={styles.root}
      animate={exiting ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 1, 1] }}
      onAnimationComplete={() => {
        if (exiting) onComplete();
      }}
    >
      <div className={styles.word} aria-label="harmoni">
        {LETTERS.map((letter, i) => (
          <span key={i} className={styles.clip}>
            <motion.span
              className={styles.letter}
              initial={{ y: "110%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              transition={{
                duration: 0.6,
                delay: 0.2 + i * 0.07,
                ease: EASE_OUT,
              }}
            >
              {letter}
            </motion.span>
          </span>
        ))}
      </div>
    </motion.div>
  );
}
