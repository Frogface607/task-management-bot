import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { mockUser } from "@/data/strains";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const user = mockUser;

  const settingsItems = [
    { icon: "👤", label: t("editProfile") },
    { icon: "🔔", label: t("notifications") },
    { icon: "🌍", label: t("language") },
    { icon: "🔒", label: t("privacy") },
    { icon: "💚", label: t("subscription") },
    { icon: "📤", label: t("exportData") },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pb-24">
      <div className="glass-card rounded-3xl p-6 mt-6 mb-6 text-center">
        <div className="text-5xl mb-3">{user.avatar}</div>
        <h1 className="text-xl font-black">{user.displayName}</h1>
        <p className="text-text-muted text-sm">@{user.username}</p>
        {user.isPro && (
          <span className="inline-block mt-2 pro-badge px-3 py-1 rounded-full text-xs font-bold text-black">WIZL PRO</span>
        )}
        <p className="text-text-secondary text-sm mt-3">{user.bio}</p>
        <p className="text-text-muted text-xs mt-1">Member since {user.memberSince}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-accent-green">{user.totalCheckins}</p>
          <p className="text-text-muted text-xs">{t("checkins")}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-accent-purple">{user.uniqueStrains}</p>
          <p className="text-text-muted text-xs">{t("uniqueStrains")}</p>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="text-lg font-bold mb-3">🏆 {t("badges")}</h2>
        <div className="grid grid-cols-4 gap-2">
          {user.badges.map((badge) => (
            <div key={badge.id} className={`glass-card rounded-xl p-3 text-center transition-all ${badge.earned ? "border border-accent-green/20" : "opacity-40 grayscale"}`}>
              <span className="text-2xl">{badge.icon}</span>
              <p className="text-[10px] text-text-muted mt-1 leading-tight">{badge.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-bold mb-3">📝 {t("recentActivity")}</h2>
        {user.recentCheckins.length > 0 ? (
          <div className="flex flex-col gap-3">
            {user.recentCheckins.map((checkin) => (
              <Link key={checkin.id} href={`/strains/${checkin.strainId}`}
                className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:bg-bg-card-hover transition-all">
                <span className="text-2xl">{checkin.strain.image}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{checkin.strain.name}</p>
                  <p className="text-text-muted text-xs line-clamp-1">{checkin.review}</p>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: checkin.rating }).map((_, i) => (
                    <span key={i} className="text-accent-green text-xs">🌿</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-text-secondary text-sm">{t("noCheckins")}</p>
            <Link href="/checkin" className="text-accent-green text-sm font-semibold">{t("firstScan")} →</Link>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">⚙️ {t("settings")}</h2>
        <div className="flex flex-col gap-2">
          {settingsItems.map((item) => (
            <button key={item.label} className="glass-card rounded-xl p-3 flex items-center gap-3 text-left hover:bg-bg-card-hover transition-all">
              <span>{item.icon}</span>
              <span className="text-sm text-text-secondary">{item.label}</span>
              <span className="ml-auto text-text-muted text-xs">→</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
