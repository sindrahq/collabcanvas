import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Collaborative Canvas",
  description: "Collaborative canvas editor assignment project"
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
