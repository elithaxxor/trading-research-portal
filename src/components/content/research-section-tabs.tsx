import Link from "next/link";
import { BookOpenText, Library, Layers3 } from "lucide-react";

import { cn } from "@/lib/utils";

type ResearchSectionTabsProps = {
  active: "playbooks" | "research" | "stacks";
};

const tabs = [
  {
    href: "/research",
    icon: BookOpenText,
    id: "research" as const,
    label: "Research Notes",
  },
  {
    href: "/research/playbooks",
    icon: Library,
    id: "playbooks" as const,
    label: "Trading Playbooks",
  },
  {
    href: "/research/fundamental-research-stack",
    icon: Layers3,
    id: "stacks" as const,
    label: "Fundamental Research Stack",
  },
];

export function ResearchSectionTabs({ active }: ResearchSectionTabsProps) {
  return (
    <nav aria-label="Research sections" className="flex">
      <div className="grid w-full grid-cols-3 gap-1 rounded-lg border border-border bg-secondary/35 p-1 sm:w-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center justify-center gap-2 rounded-md px-2 py-2 text-center text-sm font-semibold transition-colors sm:px-4",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/55 hover:text-foreground"
              )}
              href={tab.href}
              key={tab.id}
            >
              <Icon aria-hidden className="size-4 shrink-0" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
