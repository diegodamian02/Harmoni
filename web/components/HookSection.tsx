"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./HookSection.module.css";

export default function HookSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });

  return (
    <section ref={ref} className={styles.section}>
      <motion.div
        className={styles.inner}
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className={styles.line1}>
          Most dating apps ask where you went to school.
        </p>
        <p className={styles.line2}>
          We ask what you listen to at 2am.
        </p>
      </motion.div>
    </section>
  );
}
