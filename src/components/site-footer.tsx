import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/teams", label: "Teams" },
  { href: "mailto:minutesmap.viz@gmail.com", label: "Contact" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-divider bg-footer">
      <div className="mx-auto flex w-full max-w-[1235px] flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border-strong bg-card font-mono text-xs uppercase tracking-[0.18em] text-heading shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              MM
            </div>
            <span className="text-[1.1rem] font-semibold tracking-[-0.02em] text-foreground">
              {siteConfig.name}
            </span>
          </Link>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center gap-y-2 text-sm text-copy lg:justify-end">
            {footerLinks.map((item, index) => (
              <li key={item.label} className="inline-flex items-center">
                {index > 0 ? (
                  <span className="mx-3 text-muted" aria-hidden="true">
                    |
                  </span>
                ) : null}
                {item.href.startsWith("mailto:") ? (
                  <a
                    href={item.href}
                    className="transition-colors hover:text-foreground hover:underline"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-foreground hover:underline"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
