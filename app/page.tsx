"use client";

import { LandingHero } from "@/components/landing/landing-hero";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center min-h-screen bg-gradient-to-b from-[#1e1a14] to-[#2d3436] py-12">
      <LandingHero />
      
    </main>
  );
}