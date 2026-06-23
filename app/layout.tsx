import type { Metadata } from "next";

import "./globals.css";
import { ThemeSync } from "@/components/theme/ThemeSync";

export const metadata: Metadata = {
  title: "Collaborative Canvas",
  description: "Collaborative canvas editor assignment project"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover"
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="cc-landing-theme min-h-full flex flex-col">
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
