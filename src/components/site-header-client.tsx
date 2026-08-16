"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, LineChart, Menu, UserRound, X } from "lucide-react";

import { signOutAction } from "@/app/(auth)/actions";
import { Container } from "@/components/container";
import { SignOutSubmitButton } from "@/components/sign-out-submit-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Research", href: "/research" },
  { label: "Indicators", href: "/pinescripts" },
  { label: "Strat Lab", href: "/strat-lab" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Disclaimer", href: "/disclaimer" },
];

type SiteHeaderClientProps = {
  isAuthenticated: boolean;
};

export function SiteHeaderClient({ isAuthenticated }: SiteHeaderClientProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/88 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between gap-5">
        <Link className="flex min-w-0 items-center gap-3" href="/">
          <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-primary">
            <LineChart className="size-5" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-sm font-semibold text-foreground">
              Trading Research Portal
            </span>
            <span className="mt-1 hidden font-mono text-[0.64rem] uppercase tracking-[0.18em] text-muted-foreground sm:block">
              Educational research
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex xl:gap-7" aria-label="Main">
          {navItems.map((item) => (
            <Link
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              href={item.href}
              key={item.label}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <DesktopAuthActions isAuthenticated={isAuthenticated} />

          <div className="relative md:hidden">
            <button
              className={cn(
                buttonVariants({ variant: "outline", size: "icon-sm" }),
                "cursor-pointer"
              )}
              aria-controls="mobile-navigation"
              aria-expanded={isMenuOpen}
              aria-label={
                isMenuOpen ? "Close navigation menu" : "Open navigation menu"
              }
              onClick={() => setIsMenuOpen((open) => !open)}
              type="button"
            >
              {isMenuOpen ? <X aria-hidden /> : <Menu aria-hidden />}
            </button>
            {isMenuOpen ? (
              <nav
                aria-label="Mobile navigation"
                className="absolute right-0 top-11 z-40 grid w-64 gap-1 rounded-lg border border-border bg-card p-3 shadow-[0_22px_70px_oklch(0.05_0.02_235_/_42%)]"
                id="mobile-navigation"
              >
                {navItems.map((item) => (
                  <Link
                    className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    href={item.href}
                    key={item.label}
                    onClick={closeMenu}
                  >
                    {item.label}
                  </Link>
                ))}
                <MobileAuthActions
                  closeMenu={closeMenu}
                  isAuthenticated={isAuthenticated}
                />
              </nav>
            ) : null}
          </div>
        </div>
      </Container>
    </header>
  );
}

function DesktopAuthActions({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  if (isAuthenticated) {
    return (
      <div className="hidden items-center gap-3 sm:flex">
        <Link
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          href="/dashboard"
        >
          <LayoutDashboard data-icon="inline-start" />
          Dashboard
        </Link>
        <Link
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          href="/account"
        >
          <UserRound data-icon="inline-start" />
          Account
        </Link>
        <form action={signOutAction}>
          <SignOutSubmitButton
            label="Sign Out"
            pendingLabel="Signing out..."
            size="sm"
            variant="secondary"
          />
        </form>
      </div>
    );
  }

  return (
    <>
      <Link
        className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
        href="/login"
      >
        Login
      </Link>
      <Link
        className={cn(
          buttonVariants({ variant: "secondary", size: "sm" }),
          "max-sm:hidden"
        )}
        href="/register"
      >
        Create Account
      </Link>
    </>
  );
}

function MobileAuthActions({
  closeMenu,
  isAuthenticated,
}: {
  closeMenu: () => void;
  isAuthenticated: boolean;
}) {
  if (isAuthenticated) {
    return (
      <>
        <Link
          className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          href="/dashboard"
          onClick={closeMenu}
        >
          Dashboard
        </Link>
        <Link
          className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          href="/account"
          onClick={closeMenu}
        >
          Account
        </Link>
        <form action={signOutAction}>
          <button
            className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-secondary hover:text-foreground"
            onClick={closeMenu}
            type="submit"
          >
            Sign Out
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <Link
        className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        href="/login"
        onClick={closeMenu}
      >
        Login
      </Link>
      <Link
        className="rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-secondary hover:text-foreground"
        href="/register"
        onClick={closeMenu}
      >
        Create Account
      </Link>
    </>
  );
}
