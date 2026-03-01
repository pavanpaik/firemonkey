"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Bot,
  History,
  List,
  Newspaper,
  Flame,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Portfolio", icon: LayoutDashboard },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/trades", label: "Trades", icon: TrendingUp },
  { href: "/watchlist", label: "Watchlist", icon: List },
  { href: "/brief", label: "Morning Brief", icon: Newspaper },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
        <Flame className="h-6 w-6 text-orange-500" />
        <span className="text-lg font-bold tracking-tight">FireMonkey</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-card hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border px-5 py-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="h-2 w-2 rounded-full bg-success" />
          Paper Trading
        </div>
      </div>
    </aside>
  );
}
