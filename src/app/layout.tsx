import type { Metadata, Viewport } from "next";
import "./globals.css";
import AgeGate from "@/components/AgeGate";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "PUFF — Cannabis Check-in & Strain Guide",
  description:
    "Track, rate, and discover cannabis strains. AI-powered strain scanner, community reviews, and the chillest strain guide on the planet.",
  keywords: ["cannabis", "strains", "weed", "check-in", "reviews", "THC"],
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
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
