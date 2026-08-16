import Link from "next/link";

import { Container } from "@/components/container";

const footerLinks = [
  { label: "Home", href: "/" },
  { label: "Free Research", href: "/free" },
  { label: "Indicators", href: "/pinescripts" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Disclaimer", href: "/disclaimer" },
  { label: "Terms of Use", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Contact", href: "/contact" },
  { label: "Refund Policy", href: "/refund-policy" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background/74">
      <Container className="flex flex-col gap-8 py-8 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="font-medium text-foreground">Trading Research Portal</p>
          <p className="mt-2 leading-6">
            Public market commentary, chart-based research, and risk-defined
            educational content. Nothing on this site is financial advice.
          </p>
          <p className="mt-3 font-mono text-[0.68rem] uppercase tracking-[0.16em]">
            &copy; {year} Trading Research Portal
          </p>
        </div>
        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap gap-4">
            {footerLinks.map((link) => (
              <li key={link.label}>
                <Link
                  className="transition-colors hover:text-foreground"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </footer>
  );
}
