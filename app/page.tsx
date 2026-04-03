"use client";

import { useRouter } from "next/navigation";
import { LandingHero } from "@/components/landing/landing-hero";

export default function HomePage() {
  const router = useRouter();

  return (
    <div>
      <LandingHero />
      <button onClick={() => router.push("/projects-dashboard")}>
      </button>
    </div>
  );
}