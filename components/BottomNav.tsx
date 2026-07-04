"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, User, History, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTournamentSupabase } from "@/context/TournamentContextSupabase";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/predict", label: "Predict", icon: Trophy },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { isAdmin } = useTournamentSupabase();

  const navItems = isAdmin 
    ? [...NAV_ITEMS, { href: "/admin", label: "Admin", icon: Shield }]
    : NAV_ITEMS;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          const isAdminLink = href === "/admin";
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive
                  ? "text-primary"
                  : isAdminLink
                    ? "text-amber-500 hover:text-amber-400"
                    : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
              <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
