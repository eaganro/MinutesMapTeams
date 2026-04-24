import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const themeInitScript = `(function () {
  const root = document.documentElement;
  const stored = localStorage.getItem("darkMode");
  let isDark;

  if (stored !== null) {
    try {
      isDark = JSON.parse(stored);
    } catch {
      isDark = null;
    }
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
  title: {
    default: "Minutes Map Teams",
    template: "%s | Minutes Map Teams",
  },
  description: "An NBA team hub built with Next.js and Tailwind CSS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground antialiased">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <div className="min-h-screen px-4 py-2 sm:px-6 lg:px-8">
          <SiteHeader />
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
