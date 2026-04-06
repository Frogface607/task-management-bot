"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { WizlLogo } from "./icons";

export default function AgeGate({ children }: { children: React.ReactNode }) {
  const t = useTranslations("age");
  const tb = useTranslations("brand");
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
        <WizlLogo className="w-12 h-12 animate-pulse-soft" />
      </div>
    );
  }

  if (verified) return <>{children}</>;

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-accent-green/5 via-transparent to-accent-purple/5 pointer-events-none" />

      <div className="glass-card rounded-3xl p-8 max-w-sm w-full text-center relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <WizlLogo className="w-16 h-16 animate-float" />
        </div>
        <h1 className="text-4xl font-black gradient-text mb-1 tracking-tight">{tb("name")}</h1>
        <p className="text-sm gradient-love font-medium mb-1">{tb("tagline")}</p>
        <p className="text-text-muted text-xs mb-8">{tb("slogan")}</p>

        {denied ? (
          <div>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <span className="text-red-400 text-2xl font-bold">18+</span>
            </div>
            <p className="text-text-secondary mb-2">{t("denied")}</p>
            <p className="text-text-muted text-xs">{t("deniedNote")}</p>
          </div>
        ) : (
          <>
            <div className="bg-bg-primary/50 rounded-2xl p-5 mb-6 border border-border">
              <p className="text-text-primary font-semibold mb-2">{t("question")}</p>
              <p className="text-text-muted text-xs leading-relaxed whitespace-pre-line">{t("note")}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDenied(true)}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-bg-card border border-border text-text-secondary font-medium hover:bg-bg-card-hover transition-all"
              >
                {t("no")}
              </button>
              <button
                onClick={handleVerify}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-accent-green text-black font-bold hover:brightness-110 transition-all glow-green"
              >
                {t("yes")}
              </button>
            </div>
            <p className="text-text-muted text-[10px] mt-5 leading-relaxed">{t("legal")}</p>
          </>
        )}
      </div>
    </div>
  );
}
