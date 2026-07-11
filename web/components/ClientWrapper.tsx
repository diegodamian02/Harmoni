"use client";

import dynamic from "next/dynamic";

const MainPage = dynamic(() => import("./MainPage"), { ssr: false });

export default function ClientWrapper() {
  return <MainPage />;
}
