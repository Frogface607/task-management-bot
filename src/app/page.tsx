import Link from "next/link";
import { strains, recentCheckins } from "@/data/strains";
import StrainCard from "@/components/StrainCard";
import CheckinCard from "@/components/CheckinCard";

export default function Home() {
  const topStrains = strains.slice(0, 5);

  return (
    <div className="max-w-lg mx-auto px-4 pb-24">
      {/* Hero */}
      <section className="py-8 text-center">
        <div className="text-6xl mb-4 animate-float">💨</div>
        <h1 className="text-3xl font-black gradient-text mb-2">PUFF</h1>
        <p className="text-text-secondary text-sm max-w-xs mx-auto">
          Track. Rate. Discover. Your cannabis journey, one puff at a time.
        </p>
        <Link
          href="/checkin"
          className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-2xl bg-accent-green text-black font-bold hover:brightness-110 transition-all glow-green"
        >
          💨 Check In Now
        </Link>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-3 gap-3 mb-8">
        <div className="glass-card rounded-2xl p-3 text-center">
          <p className="text-2xl font-black text-accent-green">
            {strains.length}
          </p>
          <p className="text-text-muted text-xs">Strains</p>
        </div>
        <div className="glass-card rounded-2xl p-3 text-center">
          <p className="text-2xl font-black text-accent-purple">2.4K</p>
          <p className="text-text-muted text-xs">Check-ins</p>
        </div>
        <div className="glass-card rounded-2xl p-3 text-center">
          <p className="text-2xl font-black text-accent-orange">891</p>
          <p className="text-text-muted text-xs">Users</p>
        </div>
      </section>

      {/* AI Scanner Promo */}
      <section className="glass-card rounded-2xl p-5 mb-8 glow-purple relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📸</span>
            <span className="pro-badge px-2 py-0.5 rounded-full text-[10px] font-bold text-black">
              PRO
            </span>
          </div>
          <h3 className="font-bold text-lg mb-1">AI Strain Scanner</h3>
          <p className="text-text-secondary text-sm mb-3">
            Сфоткай банку — получи карточку сорта с полным описанием, эффектами
            и рейтингом от комьюнити. Magic.
          </p>
          <Link
            href="/checkin"
            className="inline-flex items-center gap-1.5 text-accent-purple text-sm font-semibold"
          >
            Try it now →
          </Link>
        </div>
      </section>

      {/* Trending Strains */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">🔥 Trending</h2>
          <Link
            href="/strains"
            className="text-accent-green text-sm font-medium"
          >
            See all →
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {topStrains.map((strain) => (
            <StrainCard key={strain.id} strain={strain} />
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4">⚡ Recent Check-ins</h2>
        <div className="flex flex-col gap-3">
          {recentCheckins.map((checkin) => (
            <CheckinCard key={checkin.id} checkin={checkin} />
          ))}
        </div>
      </section>

      {/* Subscription CTA */}
      <section className="glass-card rounded-2xl p-6 mb-8 text-center border border-accent-green/20">
        <h3 className="text-xl font-bold mb-2">Go PRO 🚀</h3>
        <p className="text-text-secondary text-sm mb-4">
          Unlimited check-ins, AI scanner, exclusive strains, no ads.
          <br />
          Support the community.
        </p>
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-text-muted line-through text-sm">$9.99</span>
          <span className="text-2xl font-black text-accent-green">
            $4.20
          </span>
          <span className="text-text-muted text-sm">/month</span>
        </div>
        <button className="w-full py-3 rounded-2xl bg-accent-green text-black font-bold hover:brightness-110 transition-all glow-green">
          Start Free Trial
        </button>
        <p className="text-text-muted text-xs mt-2">
          7 days free. Cancel anytime. Nice.
        </p>
      </section>
    </div>
  );
}
