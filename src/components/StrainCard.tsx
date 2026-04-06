import { Link } from "@/i18n/navigation";
import { Strain } from "@/types";
import { IconStar, IconDna, StrainTypeIcon } from "./icons";

export default function StrainCard({ strain }: { strain: Strain }) {
  const topTerpene = strain.terpenes[0];

  return (
    <Link href={`/strains/${strain.id}`}>
      <div className="glass-card rounded-2xl overflow-hidden hover:bg-bg-card-hover transition-all cursor-pointer group">
        {/* Accent bar with strain color */}
        <div className="h-1" style={{ background: strain.color }} />

        <div className="p-4">
          <div className="flex gap-3.5">
            {/* Strain color dot + type */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform"
                style={{ backgroundColor: `${strain.color}20`, border: `1px solid ${strain.color}30` }}
              >
                <StrainTypeIcon type={strain.type} size="md" />
              </div>
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                {strain.thc}%
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-text-primary text-[15px] leading-tight truncate">
                    {strain.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`strain-${strain.type} px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white`}>
                      {strain.type}
                    </span>
                    {strain.genetics.parents.length > 0 && (
                      <span className="text-text-muted text-[10px] flex items-center gap-0.5 truncate">
                        <IconDna className="w-3 h-3 flex-shrink-0" />
                        {strain.genetics.parents.slice(0, 2).join(" × ")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 bg-bg-primary px-2 py-1 rounded-lg flex-shrink-0">
                  <IconStar className="w-3.5 h-3.5 text-accent-green" filled />
                  <span className="text-accent-green font-black text-sm">
                    {strain.rating.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Terpene + flavor tags */}
              <div className="flex flex-wrap items-center gap-1 mt-2">
                {topTerpene && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-purple/10 text-accent-purple border border-accent-purple/20 font-medium">
                    {topTerpene}
                  </span>
                )}
                {strain.flavors.slice(0, 2).map((flavor) => (
                  <span
                    key={flavor}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-bg-primary/80 text-text-muted border border-border/50"
                  >
                    {flavor}
                  </span>
                ))}
              </div>

              {/* Bottom row */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-text-muted text-[10px]">
                  {strain.reviewCount.toLocaleString()} reviews
                </span>
                <div className="flex items-center gap-1">
                  {strain.effects.slice(0, 2).map((e) => (
                    <span key={e} className="text-[9px] text-text-muted font-medium">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
