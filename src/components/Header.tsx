"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { WizlLogo } from "./icons";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-40 glass-card border-b border-border">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <WizlLogo className="w-7 h-7" />
          <span className="text-lg font-black gradient-text tracking-tight">{t("brand.name")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/about"
            className="text-text-muted hover:text-text-secondary transition-colors text-xs font-medium px-2 py-1 rounded-lg hover:bg-bg-card"
          >
            Story
          </Link>
          <LanguageSwitcher />
          <Link href="/pro" className="pro-badge px-2.5 py-0.5 rounded-full text-[10px] font-bold text-black">
            {t("common.pro")}
          </Link>
        </div>
      </div>
    </header>
  );
}
