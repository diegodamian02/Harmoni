"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./WaitlistSection.module.css";

export default function WaitlistSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      await fetch("https://api.harmoni.cc/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // fail silently — still show success to user
    }
    setStatus("done");
  }

  return (
    <section id="waitlist" ref={ref} className={styles.section}>
      <motion.div
        className={styles.inner}
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {status === "done" ? (
          <>
            <h2 className={styles.heading}>You&apos;re on the list.</h2>
            <p className={styles.sub}>
              We&apos;ll reach out when Harmoni is ready. Stay loud.
            </p>
          </>
        ) : (
          <>
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
            <p className={styles.fine}>No spam. Just the drop.</p>
          </>
        )}
      </motion.div>
    </section>
  );
}
