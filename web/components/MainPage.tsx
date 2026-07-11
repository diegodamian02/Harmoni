"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Splash from "./Splash";
import Nav from "./Nav";
import HeroSection from "./HeroSection";
import HookSection from "./HookSection";
import HowItWorksSection from "./HowItWorksSection";
import WaitlistSection from "./WaitlistSection";
import Footer from "./Footer";

export default function MainPage() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      <AnimatePresence>
        {!splashDone && (
          <Splash key="splash" onComplete={() => setSplashDone(true)} />
        )}
      </AnimatePresence>

      {/* Render main content immediately, fade in as splash exits */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: splashDone ? 1 : 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        <Nav />
        <main>
          <HeroSection />
          <HookSection />
          <HowItWorksSection />
          <WaitlistSection />
        </main>
        <Footer />
      </motion.div>
    </>
  );
}
