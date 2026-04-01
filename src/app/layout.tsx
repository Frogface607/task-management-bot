import type { Metadata, Viewport } from "next";
import "./globals.css";
import AgeGate from "@/components/AgeGate";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "WIZL — Scan it. Know it. Track it.",
  description:
    "Discover what you got. AI-powered cannabis strain scanner, check-ins, reviews, and the chillest strain guide on the planet. With love.",
  keywords: ["cannabis", "strains", "scan", "check-in", "reviews", "AI", "WIZL"],
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary">
        <AgeGate>
          <Header />
          <main className="flex-1">{children}</main>
          <Navigation />
        </AgeGate>
      </body>
    </html>
  );
}
