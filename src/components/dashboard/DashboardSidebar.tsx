import Link from "next/link";
import {
  Bell,
  Bookmark,
  CheckCircle2,
  Clock3,
  Eye,
  LayoutDashboard,
  Settings,
  Star,
  UserCircle,
  Wrench,
} from "lucide-react";

import { cn } from "@/lib/utils";

const dashboardLinks = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Overview",
  },
  {
    href: "/dashboard/watchlist",
    icon: Star,
    label: "Watchlist",
  },
  {
    href: "/dashboard/saved",
    icon: Bookmark,
    label: "Saved Ideas",
  },
  {
    href: "/dashboard/following",
    icon: Eye,
    label: "Following",
  },
  {
    href: "/dashboard/recent",
    icon: Clock3,
    label: "Recent Updates",
  },
  {
    href: "/dashboard/closed",
    icon: CheckCircle2,
    label: "Closed Reviews",
  },
  {
    href: "/dashboard/software",
    icon: Wrench,
    label: "Software Library",
  },
  {
    href: "/dashboard/preferences",
    icon: Settings,
    label: "Preferences",
  },
  {
    href: "/account",
    icon: UserCircle,
    label: "Account",
  },
  {
    href: "/account/notifications",
    icon: Bell,
    label: "Notifications",
  },
];

type DashboardSidebarProps = {
  className?: string;
  tierLabel: string;
};

export function DashboardSidebar({
  className,
  tierLabel,
}: DashboardSidebarProps) {
  return (
    <aside
      className={cn(
        "w-full min-w-0 max-w-full border-b border-border bg-card/50 lg:border-b-0 lg:border-r",
        className
      )}
    >
      <div className="flex min-w-0 max-w-full flex-col gap-5 p-4 sm:p-6 lg:sticky lg:top-0">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">
            Member Dashboard
          </p>
          <h2 className="text-lg font-semibold text-foreground">
            {tierLabel} workspace
          </h2>
        </div>

        <nav
          aria-label="Dashboard navigation"
          className="-mx-4 max-w-full overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0"
        >
          <div className="flex w-max min-w-full gap-2 lg:grid lg:w-full lg:min-w-0 lg:grid-cols-1">
            {dashboardLinks.map((link) => {
              const Icon = link.icon;

              return (
                <Link
                  className="group flex min-h-11 shrink-0 items-center gap-3 rounded-lg border border-border bg-background/55 px-3 py-2 text-sm font-medium text-muted-foreground transition hover:border-gold-400/35 hover:bg-gold-400/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:shrink"
                  href={link.href}
                  key={link.href}
                >
                  <Icon
                    aria-hidden="true"
                    className="size-4 text-muted-foreground transition group-hover:text-gold-300"
                  />
                  <span>{link.label}</span>
                  {link.href === "/dashboard/software" ? (
                    <Bell
                      aria-label="Tier gated"
                      className="ml-auto size-3.5 text-gold-300"
                    />
                  ) : null}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
}
