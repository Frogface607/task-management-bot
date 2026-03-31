import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 glass-card border-b border-border">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">💨</span>
          <span className="text-xl font-black gradient-text">PUFF</span>
        </Link>
        <div className="flex items-center gap-3">
          <button className="text-text-muted hover:text-text-primary transition-colors text-lg">
            🔔
          </button>
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
