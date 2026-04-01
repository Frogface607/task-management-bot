"use client";

import { useState, useEffect } from "react";

export default function AgeGate({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState<boolean | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("wizl-age-verified");
    setVerified(stored === "true");
  }, []);

  const handleVerify = () => {
    localStorage.setItem("wizl-age-verified", "true");
    setVerified(true);
  };

  if (verified === null) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-4xl animate-float">🔍</div>
      </div>
    );
  }

  if (verified) return <>{children}</>;

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-8 max-w-sm w-full text-center">
        {/* Logo */}
        <div className="text-5xl mb-4 animate-float">🔍</div>
        <h1 className="text-4xl font-black gradient-text mb-1">WIZL</h1>
        <p className="text-sm gradient-love font-medium mb-1">with love</p>
        <p className="text-text-muted text-xs mb-8">
          Scan it. Know it. Track it.
        </p>

        {denied ? (
          <div>
            <div className="text-5xl mb-4">🚫</div>
            <p className="text-text-secondary mb-2">
              Not yet, friend. Come back when you&apos;re older.
            </p>
            <p className="text-text-muted text-xs">
              WIZL is only available for users 20+ years old.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-bg-primary/50 rounded-2xl p-5 mb-6 border border-border">
              <p className="text-text-primary font-semibold mb-1">
                Are you 20 or older?
              </p>
              <p className="text-text-muted text-xs">
                You must be of legal age to use WIZL.
                <br />
                Cannabis laws vary by location — know your local rules.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDenied(true)}
                className="flex-1 py-3 px-4 rounded-2xl bg-bg-card border border-border text-text-secondary font-medium hover:bg-bg-card-hover transition-all"
              >
                Not yet
              </button>
              <button
                onClick={handleVerify}
                className="flex-1 py-3 px-4 rounded-2xl bg-accent-green text-black font-bold hover:brightness-110 transition-all glow-green"
              >
                Yes, let me in
              </button>
            </div>

            <p className="text-text-muted text-[10px] mt-4 leading-relaxed">
              By entering you confirm you are of legal age in your jurisdiction.
              WIZL is an educational cannabis discovery tool.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
