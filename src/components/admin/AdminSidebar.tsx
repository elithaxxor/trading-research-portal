import Link from "next/link";
import {
  FilePlus2,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Newspaper,
  Tag,
} from "lucide-react";

import { cn } from "@/lib/utils";

const adminLinks = [
  {
    href: "/admin",
    icon: LayoutDashboard,
    label: "Overview",
  },
  {
    href: "/admin/ideas",
    icon: FolderKanban,
    label: "Trading Ideas",
  },
  {
    href: "/admin/ideas/new",
    icon: FilePlus2,
    label: "New Idea",
  },
  {
    href: "/admin/posts",
    icon: Newspaper,
    label: "Research Posts",
  },
  {
    href: "/admin/posts/new",
    icon: FileText,
    label: "New Post",
  },
  {
    href: "/admin/tags",
    icon: Tag,
    label: "Tags",
  },
];

type AdminSidebarProps = {
  className?: string;
};

export function AdminSidebar({ className }: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        "border-b border-border bg-card/50 lg:border-b-0 lg:border-r",
        className
      )}
    >
      <div className="flex flex-col gap-5 p-4 sm:p-6 lg:sticky lg:top-0">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">
            Admin Console
          </p>
          <h2 className="text-lg font-semibold text-foreground">
            Content Ops
          </h2>
        </div>

        <nav
          aria-label="Admin navigation"
          className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0"
        >
          <div className="flex min-w-max gap-2 lg:grid lg:min-w-0 lg:grid-cols-1">
            {adminLinks.map((link) => {
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
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
}
