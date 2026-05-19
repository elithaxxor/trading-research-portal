import { CardShell } from "@/components/card-shell";

type SoftwareSetupInstructionsProps = {
  fallback: string;
  title?: string;
  value: string | null;
};

export function SoftwareSetupInstructions({
  fallback,
  title,
  value,
}: SoftwareSetupInstructionsProps) {
  const paragraphs = value
    ?.split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <CardShell padding="md" tone="subtle">
      {title ? (
        <h3 className="mb-4 text-base font-semibold text-foreground">{title}</h3>
      ) : null}
      {paragraphs?.length ? (
        <div className="space-y-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {paragraphs.map((paragraph, index) => (
            <p key={`${paragraph.slice(0, 24)}-${index}`}>{paragraph}</p>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">{fallback}</p>
      )}
    </CardShell>
  );
}
