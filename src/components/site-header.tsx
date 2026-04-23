import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/teams", label: "Teams" },
];

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-[1235px] flex-col gap-4 px-1 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-0">
      <Link href="/" className="flex items-center gap-3">
        <div className="flex h-[50px] w-[45px] items-center justify-center rounded-full border border-border-strong bg-card font-mono text-sm uppercase tracking-[0.2em] text-heading shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          MM
        </div>
        <div>
          <p className="text-[1.4rem] font-semibold leading-none tracking-[-0.02em] text-foreground">
            {siteConfig.name}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted">
            NBA team pages
          </p>
        </div>
      </Link>

      <nav className="flex items-center gap-2 text-sm">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-full border border-border-strong bg-card px-4 py-2 text-copy transition-colors hover:bg-hover hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
