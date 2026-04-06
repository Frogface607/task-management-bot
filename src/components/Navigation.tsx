"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { IconHome, IconLeaf, IconScan, IconMap, IconUser } from "./icons";

export default function Navigation() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const navItems = [
    { href: "/" as const, icon: IconHome, label: t("home") },
    { href: "/strains" as const, icon: IconLeaf, label: t("strains") },
    { href: "/scan" as const, icon: IconScan, label: t("scan"), isCenter: true },
    { href: "/map" as const, icon: IconMap, label: t("map") },
    { href: "/profile" as const, icon: IconUser, label: t("profile") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="glass-card border-t border-border">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;

            if (item.isCenter) {
              return (
                <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5">
                  <div className={`w-11 h-11 -mt-5 rounded-full flex items-center justify-center shadow-lg transition-all ${
                    isActive ? "bg-accent-green glow-green" : "bg-accent-green/90"
                  }`}>
                    <Icon className="w-5 h-5 text-black" />
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? "text-accent-green" : "text-text-muted"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
                  isActive ? "text-accent-green" : "text-text-muted hover:text-text-secondary"
                }`}>
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
