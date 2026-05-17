import { Badge } from "@/components/badge";
import { generateSlug } from "@/lib/admin/validation";

type SlugFieldHelperProps = {
  currentSlug?: string | null;
  title?: string | null;
};

export function SlugFieldHelper({
  currentSlug,
  title,
}: SlugFieldHelperProps) {
  const suggestedSlug = title ? generateSlug(title) : "";
  const visibleSlug = currentSlug || suggestedSlug;

  return (
    <div className="rounded-lg border border-border bg-secondary/35 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Slug guidance</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Use lowercase letters, numbers, and hyphens. Keep it stable after
            publishing when possible.
          </p>
        </div>
        {visibleSlug ? <Badge tone="muted">{visibleSlug}</Badge> : null}
      </div>
    </div>
  );
}
