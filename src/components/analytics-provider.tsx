"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

import {
  captureAnalyticsEvent,
  initPostHog,
} from "@/lib/analytics/posthog-client";

type AnalyticsProviderProps = {
  children: ReactNode;
  posthogEnabled: boolean;
};

function getDashboardSection(pathname: string) {
  if (!pathname.startsWith("/dashboard")) {
    return null;
  }

  const [, section, subsection] = pathname.split("/");

  if (section !== "dashboard") {
    return null;
  }

  return subsection || "home";
}

export function AnalyticsProvider({
  children,
  posthogEnabled,
}: AnalyticsProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    initPostHog({ enabled: posthogEnabled });
  }, [posthogEnabled]);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    captureAnalyticsEvent("page_view", {
      path: pathname,
    });

    if (pathname === "/pricing") {
      captureAnalyticsEvent("pricing_viewed", {
        path: pathname,
      });
    }

    const dashboardSection = getDashboardSection(pathname);

    if (dashboardSection) {
      captureAnalyticsEvent("dashboard_section_viewed", {
        path: pathname,
        section: dashboardSection,
      });
    }

    if (pathname.startsWith("/dashboard/software/")) {
      captureAnalyticsEvent("software_product_viewed", {
        path: pathname,
      });
    }
  }, [pathname]);

  return children;
}
