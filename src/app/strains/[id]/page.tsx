import Link from "next/link";
import { strains, recentCheckins } from "@/data/strains";
import CheckinCard from "@/components/CheckinCard";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return strains.map((s) => ({ id: s.id }));
}

export default async function StrainPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const strain = strains.find((s) => s.id === id);

  if (!strain) return notFound();

  const strainCheckins = recentCheckins.filter((c) => c.strainId === id);

  return (
    <div className="max-w-lg mx-auto px-4 pb-24">
      <Link
        href="/strains"
        className="inline-flex items-center gap-1 text-text-muted text-sm mt-4 mb-4 hover:text-text-secondary transition-colors"
      >
        ← Back to strains
      </Link>

      {/* Hero Card */}
      <div className="glass-card rounded-3xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-6xl w-20 h-20 flex items-center justify-center bg-bg-primary rounded-2xl">
            {strain.image}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black">{strain.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`strain-${strain.type} px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider text-white`}
              >
                {strain.type}
              </span>
              <span className="text-text-muted text-sm">THC {strain.thc}%</span>
              {strain.cbd > 0.1 && (
                <span className="text-text-muted text-sm">CBD {strain.cbd}%</span>
              )}
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-3 bg-bg-primary/50 rounded-xl p-3 mb-4">
          <div className="text-center">
            <p className="text-3xl font-black text-accent-green">{strain.rating}</p>
            <div className="flex gap-0.5 mt-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-xs ${
                    i < Math.round(strain.rating)
                      ? "text-accent-green"
                      : "text-text-muted"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-text-secondary text-sm">{strain.reviewCount} reviews</p>
            <p className="text-text-muted text-xs">from the WIZL community</p>
          </div>
          <Link
            href="/checkin"
            className="px-4 py-2 rounded-xl bg-accent-green text-black font-bold text-sm hover:brightness-110 transition-all"
          >
            Rate it 🔍
          </Link>
        </div>

        <p className="text-text-secondary text-sm leading-relaxed">
          {strain.description}
        </p>
      </div>

      {/* Effects */}
      <div className="glass-card rounded-2xl p-5 mb-4">
        <h2 className="font-bold mb-3">⚡ Effects</h2>
        <div className="flex flex-wrap gap-2">
          {strain.effects.map((effect) => (
            <span
              key={effect}
              className="px-3 py-1.5 rounded-full bg-accent-green/10 text-accent-green text-sm font-medium border border-accent-green/20"
            >
              {effect}
            </span>
          ))}
        </div>
      </div>

      {/* Flavors */}
      <div className="glass-card rounded-2xl p-5 mb-6">
        <h2 className="font-bold mb-3">👅 Flavors</h2>
        <div className="flex flex-wrap gap-2">
          {strain.flavors.map((flavor) => (
            <span
              key={flavor}
              className="px-3 py-1.5 rounded-full bg-accent-purple/10 text-accent-purple text-sm font-medium border border-accent-purple/20"
            >
              {flavor}
            </span>
          ))}
        </div>
      </div>

      {/* Reviews */}
      {strainCheckins.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4">💬 Recent Reviews</h2>
          <div className="flex flex-col gap-3">
            {strainCheckins.map((checkin) => (
              <CheckinCard key={checkin.id} checkin={checkin} />
            ))}
          </div>
        </section>
      )}

      {strainCheckins.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-text-secondary text-sm mb-1">
            No reviews yet. Be the first!
          </p>
          <Link href="/checkin" className="text-accent-green text-sm font-semibold">
            Write a review →
          </Link>
        </div>
      )}
    </div>
  );
}
