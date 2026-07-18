"use client";

import { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import styles from "./Splash.module.css";

const LETTERS = ["H", "a", "r", "m", "o", "n", "i"];
const WAVE_STAGGER_MS = 100;
const ALL_LETTERS_IN_MS = LETTERS.length * WAVE_STAGGER_MS + 400; // ~1100ms

function Letter({ char, index }: { char: string; index: number }) {
  const controls = useAnimation();

  useEffect(() => {
    // Entrance: spring up from below
    controls.start({
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        delay: (index * WAVE_STAGGER_MS) / 1000,
        type: "spring",
        damping: 12,
        stiffness: 180,
        mass: 0.8,
      },
    });

    // Wave bounce after all letters have landed
    const waveDelay =
      LETTERS.length * WAVE_STAGGER_MS + 120 + index * WAVE_STAGGER_MS;

    const t = setTimeout(async () => {
      await controls.start({
        y: -28,
        transition: {
          duration: 0.28,
          ease: [0, 0, 0.58, 1] as [number, number, number, number],
        },
      });
      controls.start({
        y: 0,
        transition: { type: "spring", damping: 8, stiffness: 160 },
      });
    }, waveDelay);

    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.span
      className={styles.letter}
      animate={controls}
      initial={{ y: 60, opacity: 0, scale: 0.6 }}
    >
      {char}
    </motion.span>
  );
}

export default function Splash({ onComplete }: { onComplete: () => void }) {
  const underlineControls = useAnimation();
  const taglineControls = useAnimation();
  const containerControls = useAnimation();

  useEffect(() => {
    // Underline pops in once all letters have landed
    const t1 = setTimeout(() => {
      underlineControls.start({
        scaleX: 1,
        opacity: 1,
        transition: { type: "spring", damping: 10, stiffness: 260 },
      });
    }, ALL_LETTERS_IN_MS - 100);

    // Tagline fades in shortly after underline
    const t2 = setTimeout(() => {
      taglineControls.start({
        opacity: 1,
        transition: { duration: 0.6 },
      });
    }, ALL_LETTERS_IN_MS + 80);

    // Container fades out
    const t3 = setTimeout(() => {
      containerControls.start({
        opacity: 0,
        transition: {
          duration: 0.9,
          ease: [0.55, 0, 1, 0.45] as [number, number, number, number],
        },
      });
    }, ALL_LETTERS_IN_MS + 2200);

    // Fire onComplete after full animation (1100 + 2200 + 900 + 300 buffer)
    const t4 = setTimeout(onComplete, ALL_LETTERS_IN_MS + 2200 + 900 + 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      className={styles.root}
      animate={containerControls}
      initial={{ opacity: 1 }}
    >
      <div className={styles.glowTop} />
      <div className={styles.glowBottom} />

      <div className={styles.center}>
        <div className={styles.word} aria-label="Harmoni">
          {LETTERS.map((char, i) => (
            <Letter key={i} char={char} index={i} />
          ))}
        </div>

        <motion.div
          className={styles.underline}
          animate={underlineControls}
          initial={{ scaleX: 0, opacity: 0 }}
        />

        <motion.p
          className={styles.tagline}
          animate={taglineControls}
          initial={{ opacity: 0 }}
        >
          The dating app for music lovers
        </motion.p>
      </div>
    </motion.div>
  );
}
