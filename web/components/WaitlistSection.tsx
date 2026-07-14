"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import styles from "./WaitlistSection.module.css";

const WaveIcon = () => (
  <svg width="52" height="36" viewBox="0 0 52 36" fill="none" aria-hidden="true">
    <rect x="0"  y="10" width="6" height="16" rx="3" fill="url(#g)" opacity="0.5"/>
    <rect x="9"  y="4"  width="6" height="28" rx="3" fill="url(#g)" opacity="0.7"/>
    <rect x="18" y="0"  width="6" height="36" rx="3" fill="url(#g)"/>
    <rect x="27" y="6"  width="6" height="24" rx="3" fill="url(#g)" opacity="0.85"/>
    <rect x="36" y="12" width="6" height="12" rx="3" fill="url(#g)" opacity="0.6"/>
    <rect x="45" y="8"  width="6" height="20" rx="3" fill="url(#g)" opacity="0.75"/>
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ff69b4"/>
        <stop offset="100%" stopColor="#73105a"/>
      </linearGradient>
    </defs>
  </svg>
);

export default function WaitlistSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("https://api.harmoni.cc/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="waitlist" ref={ref} className={styles.section}>
      <motion.div
        className={styles.inner}
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <AnimatePresence mode="wait">
          {status === "done" ? (
            <motion.div
              key="success"
              className={styles.success}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className={styles.waveWrap}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <WaveIcon />
              </motion.div>
              <motion.h2
                className={styles.heading}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                You&apos;re on the list.
              </motion.h2>
              <motion.p
                className={styles.sub}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.32 }}
              >
                Check your inbox — we sent you a note. We&apos;ll be in touch when
                Harmoni drops. Tell a friend who&apos;d get it.
              </motion.p>
            </motion.div>
          ) : (
            <motion.div key="form" exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
              <h2 className={styles.heading}>Be first.</h2>
              <p className={styles.sub}>
                Launching soon. Drop your email and we&apos;ll let you know.
              </p>
              <form className={styles.form} onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={styles.input}
                  aria-label="Email address"
                />
                <button
                  type="submit"
                  className={styles.btn}
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "..." : "Join Waitlist"}
                </button>
              </form>
              {status === "error" ? (
                <p className={`${styles.fine} ${styles.fineError}`}>
                  Something went wrong — try again.
                </p>
              ) : (
                <p className={styles.fine}>No spam. Just the drop.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
