"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import styles from "./WaitlistSection.module.css";

const BRAND_COLORS = ["#ff69b4", "#73105a", "#ff9de2", "#c2185b", "#ffffff", "#f8bbd0"];

function fireConfetti() {
  const count = 220;
  const defaults = { startVelocity: 30, spread: 360, ticks: 80, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  // Three staggered bursts for a dynamic feel
  const bursts = [
    { origin: { x: 0.5, y: 0.6 }, scalar: 1.1, delay: 0 },
    { origin: { x: 0.2, y: 0.65 }, scalar: 0.85, delay: 150 },
    { origin: { x: 0.8, y: 0.65 }, scalar: 0.85, delay: 280 },
  ];

  bursts.forEach(({ origin, scalar, delay }) => {
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: Math.floor(count * scalar),
        origin,
        scalar,
        colors: BRAND_COLORS,
        shapes: ["circle", "square"],
        gravity: randomInRange(0.8, 1.2),
        drift: randomInRange(-0.1, 0.1),
      });
    }, delay);
  });
}

const WaveBar = ({ delay, height }: { delay: number; height: number }) => (
  <motion.div
    className={styles.waveBar}
    style={{ height }}
    initial={{ scaleY: 0 }}
    animate={{ scaleY: 1 }}
    transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
  />
);

const BARS = [
  { height: 18, delay: 0.1 },
  { height: 30, delay: 0.16 },
  { height: 42, delay: 0.22 },
  { height: 36, delay: 0.28 },
  { height: 48, delay: 0.34 },
  { height: 28, delay: 0.4 },
  { height: 38, delay: 0.46 },
  { height: 22, delay: 0.52 },
];

function SuccessState() {
  useEffect(() => {
    fireConfetti();
  }, []);

  return (
    <motion.div
      key="success"
      className={styles.success}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className={styles.waveWrap}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        {BARS.map((bar, i) => (
          <WaveBar key={i} delay={bar.delay} height={bar.height} />
        ))}
      </motion.div>

      <motion.h2
        className={styles.heading}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        You&apos;re on the list.
      </motion.h2>

      <motion.p
        className={styles.sub}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        Check your inbox — we sent you a note.
        <br />
        We&apos;ll be in touch when Harmoni drops.
      </motion.p>

      <motion.p
        className={styles.fine}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        Tell a friend who&apos;d get it.
      </motion.p>
    </motion.div>
  );
}

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
            <SuccessState key="success" />
          ) : (
            <motion.div
              key="form"
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
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
