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

const SpotifyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.516 17.306c-.213.356-.666.47-1.022.257-2.797-1.71-6.32-2.096-10.47-1.148-.397.09-.796-.154-.887-.553-.09-.398.154-.796.553-.887 4.538-1.035 8.43-.59 11.57 1.326.356.213.47.667.256 1.005zm1.472-3.27c-.27.437-.843.574-1.28.305-3.2-1.968-8.08-2.54-11.87-1.39-.47.143-.968-.118-1.11-.588-.143-.47.118-.967.588-1.11 4.33-1.314 9.705-.678 13.37 1.583.436.27.572.843.302 1.2zm.127-3.4C15.532 8.49 9.37 8.28 5.976 9.293c-.564.17-1.162-.15-1.333-.716-.17-.565.15-1.163.716-1.334 3.93-1.193 10.47-.962 14.6 1.607.508.303.674.958.37 1.466-.302.508-.956.674-1.464.37z" />
  </svg>
);

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
          <a href="#waitlist" className={styles.btnSpotify}>
            <SpotifyIcon />
            Connect with Spotify
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
