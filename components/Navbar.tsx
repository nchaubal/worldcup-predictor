"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, LayoutGrid, GitBranch, Users, User, BarChart3, Menu, X } from "lucide-react";
import { AuthButton } from "./AuthButton";

const NAV_LINKS = [
  { href: "/",        label: "Home",    icon: Trophy },
  { href: "/predict", label: "Predict", icon: LayoutGrid },
  { href: "/bracket", label: "Bracket", icon: GitBranch },
  { href: "/leagues", label: "Leagues", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-card/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          <Link href="/" className="group flex items-center gap-2.5">
            <Image
              src="/2026_FIFA_World_Cup_emblem.svg.webp"
              alt="FIFA World Cup 2026"
              width={960}
              height={1482}
              className="h-9 w-auto rounded-md transition-transform duration-200 ease-out group-hover:scale-110"
            />
            <div className="hidden sm:block text-sm font-bold leading-none text-foreground whitespace-nowrap">
              Boom FIFA World Cup 2026™ Predictor
            </div>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Primary" className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110" />
                  <span>{label}</span>
                  <span
                    className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary origin-center transition-transform duration-200 ${
                      active ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </Link>
              );
            })}
            <div className="ml-4 pl-4 border-l border-border">
              <AuthButton />
            </div>
          </nav>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu panel */}
        <div
          className={`md:hidden grid overflow-hidden transition-[grid-template-rows,opacity] duration-[250ms] ease-out ${
            mobileOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0">
            <nav aria-label="Mobile" className="flex flex-col gap-0.5 pb-4">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
              <div className="mt-2 pt-3 border-t border-border">
                <AuthButton />
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
