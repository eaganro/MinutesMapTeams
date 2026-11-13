import Link from "next/link";
import { SiteLogo } from "@/components/site-logo";
import { siteConfig } from "@/lib/site-config";

const footerLinks = [
  { href: siteConfig.gamesUrl, label: "Live games" },
  { href: "/teams", label: "Teams" },
  { href: `${siteConfig.gamesUrl}/about`, label: "About" },
  { href: `${siteConfig.gamesUrl}/privacy`, label: "Privacy Policy" },
  { href: `mailto:${siteConfig.contactEmail}`, label: "Contact" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-divider bg-footer">
      <div className="mx-auto flex w-full max-w-[1235px] flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <SiteLogo size={40} />
          <span className="text-[1.1rem] font-semibold tracking-[-0.02em] text-foreground">
            {siteConfig.name}
          </span>
        </Link>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-copy lg:justify-end">
            {footerLinks.map((item) => (
              <li key={item.label}>
                {item.href.startsWith("/") ? (
                  <Link href={item.href} className="hover:text-foreground hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  <a href={item.href} className="hover:text-foreground hover:underline">
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
