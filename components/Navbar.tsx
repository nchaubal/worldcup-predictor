"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, LayoutGrid, GitBranch, Users, User, BarChart3 } from "lucide-react";
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

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-card/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/30 text-xl group-hover:bg-primary/20 transition-colors">
              🏆
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold leading-none text-foreground">WC Predictor</div>
              <div className="text-xs text-primary font-semibold leading-none mt-0.5">FIFA 2026™</div>
            </div>
          </Link>

          <nav className="flex items-center gap-0.5">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden md:block">{label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
            <div className="ml-4 pl-4 border-l border-border">
              <AuthButton />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
