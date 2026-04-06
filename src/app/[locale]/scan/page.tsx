"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getUserData, incrementScans, getScansRemaining } from "@/lib/store";
import { IconCamera } from "@/components/icons";

interface ScanResult {
  name: string;
  confidence: "high" | "medium" | "low";
  type: "sativa" | "indica" | "hybrid";
  thc_range: string;
  cbd_range: string;
  effects: string[];
  flavors: string[];
  description: string;
  best_for: string;
  similar_strains: string[];
  _demo?: boolean;
}

const confidenceColors = {
  high: "text-accent-green",
  medium: "text-accent-orange",
  low: "text-text-muted",
};

const confidenceLabels = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default function ScanPage() {
  const t = useTranslations("scan");
  const tc = useTranslations("common");
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"idle" | "loading" | "result">("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scansLeft, setScansLeft] = useState(5);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const data = getUserData();
    setScansLeft(getScansRemaining(data));
    setIsPro(data.isPro);
  }, []);

  const handleScan = async (image?: string, text?: string) => {
    // Check scan limit
    const { allowed } = incrementScans();
    if (!allowed) {
      setError("Daily scan limit reached. Upgrade to PRO for unlimited scans.");
      return;
    }

    setMode("loading");
    setError(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: image || undefined,
          description: text || undefined,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setMode("idle");
        return;
      }

      setResult(data);
      setMode("result");
      setScansLeft(getScansRemaining(getUserData()));
    } catch {
      setError("Connection error. Please try again.");
      setMode("idle");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      handleScan(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleTextScan = () => {
    if (!description.trim()) return;
    handleScan(undefined, description.trim());
  };

  const reset = () => {
    setMode("idle");
    setResult(null);
    setPreview(null);
    setDescription("");
    setError(null);
  };

  // Loading state
  if (mode === "loading") {
    return (
      <div className="max-w-lg mx-auto px-4 pb-24 pt-8">
        <div className="text-center py-20">
          <div className="text-6xl mb-6 animate-float">🔍</div>
          <h2 className="text-xl font-black gradient-text mb-2">
            {t("analyzing")}
          </h2>
          <div className="flex justify-center gap-1 mt-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-accent-green animate-pulse-soft"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
          {preview && (
            <div className="mt-6 mx-auto w-32 h-32 rounded-2xl overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Scanning" className="w-full h-full object-cover opacity-60" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Result state
  if (mode === "result" && result) {
    return (
      <div className="max-w-lg mx-auto px-4 pb-24 pt-6">
        <button
          onClick={reset}
          className="text-text-muted text-sm mb-4 hover:text-text-secondary transition-colors"
        >
          ← {t("scanAgain")}
        </button>

        <h2 className="text-lg font-bold mb-4">🔍 {t("scanResult")}</h2>

        {/* Main Result Card */}
        <div className="glass-card rounded-3xl p-6 mb-4 glow-green border border-accent-green/20">
          {preview && (
            <div className="w-full h-40 rounded-2xl overflow-hidden mb-4 border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt={result.name} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h1 className="text-2xl font-black">{result.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`strain-${result.type} px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider text-white`}>
                  {result.type}
                </span>
                <span className="text-text-muted text-sm">THC {result.thc_range}</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-medium ${confidenceColors[result.confidence]}`}>
                {t("confidence")}
              </span>
              <p className={`text-sm font-bold ${confidenceColors[result.confidence]}`}>
                {confidenceLabels[result.confidence]}
              </p>
            </div>
          </div>

          <p className="text-text-secondary text-sm leading-relaxed mb-3">
            {result.description}
          </p>

          <div className="bg-bg-primary/50 rounded-xl p-3">
            <p className="text-xs text-text-muted mb-1">Best for</p>
            <p className="text-sm text-text-primary">{result.best_for}</p>
          </div>

          {result._demo && (
            <div className="mt-3 bg-accent-orange/10 rounded-xl p-3 border border-accent-orange/20">
              <p className="text-accent-orange text-xs font-medium">
                Demo mode — add ANTHROPIC_API_KEY for real AI scans
              </p>
            </div>
          )}
        </div>

        {/* Effects */}
        <div className="glass-card rounded-2xl p-5 mb-4">
          <h3 className="font-bold mb-3">⚡ Effects</h3>
          <div className="flex flex-wrap gap-2">
            {result.effects.map((effect) => (
              <span key={effect} className="px-3 py-1.5 rounded-full bg-accent-green/10 text-accent-green text-sm font-medium border border-accent-green/20">
                {effect}
              </span>
            ))}
          </div>
        </div>

        {/* Flavors */}
        <div className="glass-card rounded-2xl p-5 mb-4">
          <h3 className="font-bold mb-3">👅 Flavors</h3>
          <div className="flex flex-wrap gap-2">
            {result.flavors.map((flavor) => (
              <span key={flavor} className="px-3 py-1.5 rounded-full bg-accent-purple/10 text-accent-purple text-sm font-medium border border-accent-purple/20">
                {flavor}
              </span>
            ))}
          </div>
        </div>

        {/* Similar Strains */}
        {result.similar_strains.length > 0 && (
          <div className="glass-card rounded-2xl p-5 mb-6">
            <h3 className="font-bold mb-3">🔗 Similar Strains</h3>
            <div className="flex flex-wrap gap-2">
              {result.similar_strains.map((strain) => (
                <span key={strain} className="px-3 py-1.5 rounded-full bg-bg-primary text-text-secondary text-sm border border-border">
                  {strain}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/checkin"
            className="flex-1 py-3 rounded-2xl bg-accent-green text-black font-bold text-center hover:brightness-110 transition-all glow-green"
          >
            {t("saveCheckin")}
          </Link>
          <button
            onClick={reset}
            className="flex-1 py-3 rounded-2xl bg-bg-card border border-border text-text-secondary font-medium hover:bg-bg-card-hover transition-all"
          >
            {t("scanAgain")} 🔍
          </button>
        </div>
      </div>
    );
  }

  // Idle state — scan input
  return (
    <div className="max-w-lg mx-auto px-4 pb-24 pt-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black gradient-text mb-1">{t("title")}</h1>
        <p className="text-text-secondary text-sm">{t("subtitle")}</p>
      </div>

      {error && (
        <div className="glass-card rounded-2xl p-4 mb-6 border border-red-500/20 bg-red-500/5">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* PRIMARY: Enter strain name */}
      <div className="mb-5">
        <label className="text-sm font-semibold mb-2 block text-text-primary">Enter strain name</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Oreo Zushi, Blue Dream, OG Kush..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTextScan()}
            className="flex-1 bg-bg-card border border-border rounded-2xl px-4 py-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green/50 transition-colors"
          />
          <button
            onClick={handleTextScan}
            disabled={!description.trim()}
            className={`px-5 rounded-2xl font-bold transition-all flex-shrink-0 ${
              description.trim()
                ? "bg-accent-green text-black hover:brightness-110 glow-green"
                : "bg-bg-card text-text-muted border border-border"
            }`}
          >
            Scan
          </button>
        </div>
        <p className="text-text-muted text-[10px] mt-1.5 ml-1">
          Type any strain name — WIZL AI will tell you everything about it
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-text-muted text-xs">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Photo scan */}
      <div className="mb-5">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full glass-card rounded-2xl p-6 border border-border text-center hover:bg-bg-card-hover hover:border-accent-green/30 transition-all group flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <IconCamera className="w-6 h-6 text-accent-purple" />
          </div>
          <div className="text-left">
            <p className="text-text-primary font-semibold text-sm">{t("takePhoto")}</p>
            <p className="text-text-muted text-xs">Snap the jar or package — AI identifies the strain</p>
          </div>
          <span className="pro-badge px-2 py-0.5 rounded-full text-[9px] font-bold text-black flex-shrink-0">PRO</span>
        </button>
      </div>

      {/* Or describe freely */}
      <div className="mb-6">
        <label className="text-xs font-medium mb-2 block text-text-muted">
          Or describe what you see / smell / feel
        </label>
        <textarea
          placeholder="green dense buds, smells like citrus and pine, came in a purple jar..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-bg-card border border-border rounded-2xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green/50 transition-colors resize-none"
        />
      </div>

      {/* Scan limit / PRO */}
      {isPro ? (
        <div className="glass-card rounded-2xl p-4 text-center border border-accent-green/20">
          <p className="text-accent-green text-xs font-medium">
            <span className="pro-badge px-2 py-0.5 rounded-full text-[10px] font-bold text-black mr-1">PRO</span>
            {" "}Unlimited scans active
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-4 text-center border border-accent-purple/20">
          <p className="text-text-secondary text-sm font-medium mb-1">
            {scansLeft} free scan{scansLeft !== 1 ? "s" : ""} left today
          </p>
          <Link href="/pro" className="text-accent-green text-xs font-semibold">
            Upgrade to PRO for unlimited →
          </Link>
        </div>
      )}
    </div>
  );
}
