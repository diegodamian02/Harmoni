"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import styles from "./HeroSection.module.css";

const ALBUMS = [
  {
    src: "/albums/oasis.jpg",
    alt: "Definitely Maybe – Oasis",
    top: "8%", right: "18%", rotate: -8, delay: 0.1, size: 180,
    tier: "side",
  },
  {
    src: "/albums/drake.jpg",
    alt: "Take Care – Drake",
    top: "38%", right: "6%", rotate: 5, delay: 0.22, size: 200,
    tier: "side",
  },
  {
    src: "/albums/weeknd.jpg",
    alt: "After Hours – The Weeknd",
    top: "62%", right: "22%", rotate: -4, delay: 0.34, size: 160,
    tier: "side",
  },
  {
    src: "/albums/am.jpg",
    alt: "AM – Arctic Monkeys",
    top: "14%", right: "42%", rotate: 6, delay: 0.16, size: 150,
    tier: "center",
  },
  {
    src: "/albums/sublime.jpg",
    alt: "What I Got – Sublime",
    top: "55%", right: "46%", rotate: -11, delay: 0.28, size: 140,
    tier: "center",
  },
];


export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const textY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const albumsY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <section ref={ref} className={styles.section}>
      {/* Floating album covers */}
      <motion.div className={styles.albumsLayer} style={{ y: albumsY }}>
        {ALBUMS.map((album) => (
          <motion.div
            key={album.src}
            className={`${styles.albumCard} ${styles[`tier_${album.tier}`]}`}
            style={{
              top: album.top,
              right: album.right,
              width: album.size,
              height: album.size,
              rotate: album.rotate,
            }}
            initial={{ opacity: 0, scale: 0.82, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.9,
              delay: album.delay,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <Image
              src={album.src}
              alt={album.alt}
              fill
              sizes={`${album.size}px`}
              style={{ objectFit: "cover", borderRadius: 10 }}
              priority
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Text content */}
      <motion.div className={styles.content} style={{ y: textY, opacity: textOpacity }}>
        <motion.p
          className={styles.eyebrow}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
        >
          Coming Soon
        </motion.p>

        <motion.h1
          className={styles.heading}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          Find your
          <br />
          <span className={styles.grad}>music twin.</span>
        </motion.h1>

        <motion.p
          className={styles.sub}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.22 }}
        >
          Connect with music.
          <br className={styles.desktopBreak} /> Share your favorite tunes.
        </motion.p>

        <motion.div
          className={styles.actions}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32 }}
        >
          <a href="#waitlist" className={styles.btnPrimary}>
            Join the Waitlist
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
