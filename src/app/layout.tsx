import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site-config";

const themeInitScript = `(function () {
  const root = document.documentElement;
  let isDark = null;

  try {
    const stored = localStorage.getItem("darkMode");
    if (stored !== null) {
      isDark = JSON.parse(stored);
    }
  } catch {
    isDark = null;
  }

  if (typeof isDark !== "boolean") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    if (prefersDark) {
      isDark = true;
    } else if (prefersLight) {
      isDark = false;
    } else {
      isDark = true;
    }
  }

  root.setAttribute("data-theme", isDark ? "dark" : "light");
})();`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "MinutesMap Teams: NBA seasons, minute by minute",
    template: "%s | MinutesMap",
  },
  description: siteConfig.description,
  openGraph: {
    siteName: "MinutesMap",
    type: "website",
    images: [{ url: "/logo-140.png", width: 140, height: 140 }],
  },
  twitter: { card: "summary" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        {/* A plain blocking script, not next/script: beforeInteractive defers
            inline scripts to the Next runtime, so the page paints light first. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground antialiased">
        <div className="min-h-screen px-4 py-2 sm:px-6 lg:px-8">
          <SiteHeader />
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
