import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 glass-card border-b border-border">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🔍</span>
          <span className="text-xl font-black gradient-text tracking-tight">WIZL</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/pro"
            className="pro-badge px-2.5 py-0.5 rounded-full text-[10px] font-bold text-black"
          >
            PRO
          </Link>
          <Link
            href="/profile"
            className="w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center text-sm"
          >
            🔥
          </Link>
        </div>
      </div>
    </header>
  );
}
