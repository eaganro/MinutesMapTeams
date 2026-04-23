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
            <picture>
              <source
                type="image/avif"
                srcSet="/logo-70.avif 1x, /logo-140.avif 2x"
              />
              <source
                type="image/webp"
                srcSet="/logo-70.webp 1x, /logo-140.webp 2x"
              />
              <img
                src="/logo-70.png"
                srcSet="/logo-70.png 1x, /logo-140.png 2x"
                width="40"
                height="40"
                alt="MinutesMap logo"
                className="h-10 w-10 object-contain"
              />
            </picture>
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
