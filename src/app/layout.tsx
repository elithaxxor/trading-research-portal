import type { Metadata } from "next";

import { AnalyticsProvider } from "@/components/analytics-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const siteName = "Trading Research Portal";
const siteDescription =
  "Chart-based trading research, market commentary, watchlists, and risk-aware trading ideas organized in one private dashboard.";
const fallbackSiteUrl = "https://trading-research-portal.netlify.app";
const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || fallbackSiteUrl;
const posthogEnabled =
  process.env.POSTHOG_ENABLED?.trim().toLowerCase() === "true";

function getMetadataBase(url: string) {
  try {
    return new URL(url);
  } catch {
    return new URL(fallbackSiteUrl);
  }
}

export const metadata: Metadata = {
  applicationName: siteName,
  description: siteDescription,
  metadataBase: getMetadataBase(configuredSiteUrl),
  openGraph: {
    description: siteDescription,
    locale: "en_US",
    siteName,
    title: siteName,
    type: "website",
    url: "/",
  },
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  twitter: {
    card: "summary_large_image",
    description: siteDescription,
    title: siteName,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="flex min-h-full flex-col">
        <AnalyticsProvider posthogEnabled={posthogEnabled}>
          <SiteHeader />
          {children}
          <SiteFooter />
        </AnalyticsProvider>
      </body>
    </html>
  );
}
