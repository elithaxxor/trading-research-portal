import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/badge";

type AdminBreadcrumb = {
  href?: string;
  label: string;
};

type AdminPageHeaderProps = {
  actions?: ReactNode;
  breadcrumbs?: AdminBreadcrumb[];
  description: string;
  eyebrow?: string;
  title: string;
};

export function AdminPageHeader({
  actions,
  breadcrumbs,
  description,
  eyebrow = "Admin",
  title,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-6 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex max-w-3xl flex-col gap-4">
        {breadcrumbs?.length ? <AdminBreadcrumbs items={breadcrumbs} /> : null}
        <Badge tone="gold">{eyebrow}</Badge>
        <div className="space-y-3">
          <h1 className="text-balance text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
      </div>
      {actions ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

function AdminBreadcrumbs({ items }: { items: AdminBreadcrumb[] }) {
  return (
    <nav aria-label="Admin breadcrumbs">
      <ol className="flex flex-wrap items-center gap-1 text-xs font-medium text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li className="flex items-center gap-1" key={`${item.label}-${index}`}>
              {item.href && !isLast ? (
                <Link
                  className="rounded-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-foreground" : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronRight aria-hidden="true" className="size-3" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
