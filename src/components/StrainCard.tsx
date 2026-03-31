import Link from "next/link";
import { Strain } from "@/types";

function StrainTypeBadge({ type }: { type: string }) {
  return (
    <span
      className={`strain-${type} px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-white`}
    >
      {type}
    </span>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-accent-green font-bold text-sm">{rating.toFixed(1)}</span>
      <span className="text-accent-green text-xs">★</span>
    </div>
  );
}

export default function StrainCard({ strain }: { strain: Strain }) {
  return (
    <Link href={`/strains/${strain.id}`}>
      <div className="glass-card rounded-2xl p-4 hover:bg-bg-card-hover transition-all cursor-pointer group">
        <div className="flex gap-4">
          {/* Emoji icon */}
          <div className="text-4xl flex-shrink-0 w-14 h-14 flex items-center justify-center bg-bg-primary rounded-xl group-hover:scale-110 transition-transform">
            {strain.image}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-text-primary truncate">
                  {strain.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <StrainTypeBadge type={strain.type} />
                  <span className="text-text-muted text-xs">
                    THC {strain.thc}%
                  </span>
                </div>
              </div>
              <StarDisplay rating={strain.rating} />
            </div>

            {/* Flavors */}
            <div className="flex flex-wrap gap-1 mt-2">
              {strain.flavors.slice(0, 3).map((flavor) => (
                <span
                  key={flavor}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-bg-primary text-text-muted"
                >
                  {flavor}
                </span>
              ))}
            </div>

            {/* Reviews count */}
            <p className="text-text-muted text-xs mt-2">
              {strain.reviewCount} reviews
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
