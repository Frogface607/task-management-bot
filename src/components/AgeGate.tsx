"use client";

import { useState, useEffect } from "react";

export default function AgeGate({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState<boolean | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("puff-age-verified");
    if (stored === "true") {
      setVerified(true);
    } else {
      setVerified(false);
    }
  }, []);

  const handleVerify = () => {
    localStorage.setItem("puff-age-verified", "true");
    setVerified(true);
  };

  const handleDeny = () => {
    setDenied(true);
  };

  // Loading state
  if (verified === null) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-4xl animate-float">💨</div>
      </div>
    );
  }

  if (verified) return <>{children}</>;

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-8 max-w-sm w-full text-center">
        {/* Mascot */}
        <div className="text-7xl mb-6 animate-float">💨</div>

        {/* Logo */}
        <h1 className="text-4xl font-black gradient-text mb-2">PUFF</h1>
        <p className="text-text-secondary text-sm mb-8">
          Cannabis Check-in & Strain Guide
        </p>

        {denied ? (
          <div>
            <div className="text-5xl mb-4">🚫</div>
            <p className="text-text-secondary mb-2">
              Сорян, бро. Приходи когда подрастёшь.
            </p>
            <p className="text-text-muted text-xs">
              PUFF is only available for users 20+ years old.
            </p>
          </div>
        ) : (
          <>
            {/* Age verification */}
            <div className="bg-bg-primary/50 rounded-2xl p-5 mb-6 border border-border">
              <p className="text-text-primary font-semibold mb-1">
                Тебе есть 20?
              </p>
              <p className="text-text-muted text-xs">
                You must be 20 or older to use PUFF.
                <br />
                Cannabis laws vary by location — know your local rules.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeny}
                className="flex-1 py-3 px-4 rounded-2xl bg-bg-card border border-border text-text-secondary font-medium hover:bg-bg-card-hover transition-all"
              >
                Nope 👶
              </button>
              <button
                onClick={handleVerify}
                className="flex-1 py-3 px-4 rounded-2xl bg-accent-green text-black font-bold hover:brightness-110 transition-all glow-green"
              >
                Yep 🔥
              </button>
            </div>

            <p className="text-text-muted text-[10px] mt-4 leading-relaxed">
              By entering you confirm you are of legal age in your jurisdiction
              and agree to our Terms of Service.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
