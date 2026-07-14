"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./HowItWorksSection.module.css";

const STEPS = [
  {
    num: "01",
    title: "Build Your Taste Profile",
    body: "Pick 3 genres, 4 artists, and 8 songs. No surveys. No bios. Just the music that actually defines you.",
  },
  {
    num: "02",
    title: "Match by Sound",
    body: "Our algorithm finds people whose taste overlaps with yours in ways that actually matter — shared artists, similar scenes, genre overlap.",
  },
  {
    num: "03",
    title: "Start with a Blend",
    body: "Every match comes with a shared 8-track playlist built from both of your libraries. You already have something to talk about.",
  },
];

export default function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <section ref={ref} className={styles.section}>
      <motion.p
        className={styles.label}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        How it works
      </motion.p>

      <div className={styles.grid}>
        {STEPS.map((step, i) => (
          <motion.div
            key={step.num}
            className={styles.card}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.7,
              delay: i * 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <span className={styles.num}>{step.num}</span>
            <h3 className={styles.cardTitle}>{step.title}</h3>
            <p className={styles.cardBody}>{step.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
