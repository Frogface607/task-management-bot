"use client";

import Link from "next/link";
import { useState } from "react";

const features = [
  { icon: "📸", title: "AI Strain Scanner", desc: "Snap a photo — get full strain info instantly" },
  { icon: "🔓", title: "Unlimited Scans", desc: "No daily limits. Scan everything you find" },
  { icon: "🧠", title: "Smart Insights", desc: "Personalized recommendations based on your taste" },
  { icon: "📊", title: "Full History", desc: "Track every strain you've ever tried" },
  { icon: "🏆", title: "Exclusive Badges", desc: "Unlock rare achievements and collectibles" },
  { icon: "🌍", title: "Global Map", desc: "See your check-ins across the world" },
];

const freeVsPro = [
  { feature: "Browse strains", free: true, pro: true },
  { feature: "Daily scans", free: "5/day", pro: "Unlimited" },
  { feature: "Check-ins", free: true, pro: true },
  { feature: "AI Scanner", free: false, pro: true },
  { feature: "Full history", free: false, pro: true },
  { feature: "Smart insights", free: false, pro: true },
  { feature: "Rare badges", free: false, pro: true },
  { feature: "No ads", free: false, pro: true },
];

export default function ProPage() {
  const [subscribed, setSubscribed] = useState(false);

  if (subscribed) {
    return (
      <div className="max-w-lg mx-auto px-4 pb-24 pt-8">
        <div className="text-center py-16">
          <div className="text-7xl mb-4 animate-float">💚</div>
          <h2 className="text-2xl font-black gradient-text mb-1">
            Welcome to WIZL PRO
          </h2>
          <p className="text-sm gradient-love font-medium mb-4">with love</p>
          <p className="text-text-secondary text-sm mb-8">
            You&apos;re in. All features unlocked. Go explore.
          </p>
          <Link
            href="/checkin"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent-green text-black font-bold hover:brightness-110 transition-all glow-green"
          >
            🔍 Start Scanning
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-24 pt-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3 animate-float">🔍</div>
        <h1 className="text-3xl font-black gradient-text mb-1">WIZL PRO</h1>
        <p className="text-sm gradient-love font-medium mb-3">with love</p>
        <p className="text-text-secondary text-sm">
          Unlock the full experience. Support the journey.
        </p>
      </div>

      {/* Price — the star of the show */}
      <div className="glass-card rounded-3xl p-8 mb-8 text-center glow-green border border-accent-green/20">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-text-muted line-through text-lg">$9.99</span>
        </div>
        <div className="text-6xl font-black price-420 mb-1">$4.20</div>
        <p className="text-text-muted text-sm">/month</p>
        <p className="text-text-muted text-xs mt-2">
          Yes, we did that on purpose.
        </p>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {features.map((f) => (
          <div key={f.title} className="glass-card rounded-2xl p-4">
            <span className="text-2xl">{f.icon}</span>
            <p className="font-bold text-sm mt-2">{f.title}</p>
            <p className="text-text-muted text-xs mt-1">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Free vs Pro table */}
      <div className="glass-card rounded-2xl p-5 mb-8">
        <h3 className="font-bold mb-4">Free vs PRO</h3>
        <div className="flex flex-col gap-3">
          {freeVsPro.map((row) => (
            <div key={row.feature} className="flex items-center justify-between">
              <span className="text-text-secondary text-sm">{row.feature}</span>
              <div className="flex items-center gap-6">
                <span className="text-xs w-16 text-center text-text-muted">
                  {row.free === true ? "✓" : row.free === false ? "—" : row.free}
                </span>
                <span className="text-xs w-16 text-center text-accent-green font-medium">
                  {row.pro === true ? "✓" : row.pro}
                </span>
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-6 mt-1 border-t border-border pt-2">
            <span className="text-[10px] w-16 text-center text-text-muted">Free</span>
            <span className="text-[10px] w-16 text-center text-accent-green font-bold">PRO</span>
          </div>
        </div>
      </div>

      {/* Support the journey */}
      <div className="glass-card rounded-2xl p-5 mb-8 text-center border border-accent-love/20 glow-love">
        <p className="text-accent-love font-bold text-sm mb-2">💚 Support the Journey</p>
        <p className="text-text-secondary text-xs leading-relaxed">
          WIZL is built by one person walking through Bangkok with a GoPro and a dream.
          Your subscription directly supports this adventure and keeps the app free for everyone.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={() => setSubscribed(true)}
        className="w-full py-4 rounded-2xl bg-accent-green text-black font-bold text-lg hover:brightness-110 transition-all glow-green mb-3"
      >
        Start 7-Day Free Trial
      </button>
      <p className="text-text-muted text-xs text-center mb-2">
        7 days free, then $4.20/month. Cancel anytime.
      </p>
      <p className="text-text-muted text-[10px] text-center">
        You know the vibe. No tricks. Just vibes.
      </p>
    </div>
  );
}
