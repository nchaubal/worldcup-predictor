"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Trophy, LayoutGrid, GitBranch, Users, User, LogOut } from "lucide-react";
import { useTournament } from "@/context/TournamentContext";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/",        label: "Home",    icon: Trophy },
  { href: "/predict", label: "Predict", icon: LayoutGrid },
  { href: "/bracket", label: "Bracket", icon: GitBranch },
  { href: "/leagues", label: "Leagues", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { authUser, authLoading, currentUser, logout } = useTournament();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-card/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/2026_FIFA_World_Cup_emblem.svg.webp"
              alt="FIFA World Cup 2026"
              width={960}
              height={1482}
              className="h-9 w-auto rounded-md"
            />
            <div className="hidden sm:block text-sm font-bold leading-none text-foreground whitespace-nowrap">
              Boom FIFA World Cup 2026™ Predictor
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
          </nav>

          <div className="flex items-center gap-2">
            {authLoading ? null : authUser ? (
              <>
                <span className="hidden sm:block text-sm text-muted-foreground">
                  {currentUser.avatar} {currentUser.userName}
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:block">Log out</span>
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
