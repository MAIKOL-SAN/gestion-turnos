"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardCheck,
  History,
  LayoutDashboard,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

const iconMap = {
  calendar: CalendarDays,
  dashboard: LayoutDashboard,
  attendance: ClipboardCheck,
  audit: History,
  people: UsersRound,
  profile: UserRound,
  shield: ShieldCheck,
};

export type AppNavItem = {
  href: string;
  icon: keyof typeof iconMap;
  label: string;
};

function isActive(pathname: string, href: string) {
  if (href === "/attendance") {
    return pathname === href || pathname.startsWith("/attendance/");
  }

  if (href === "/admin" || href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav({
  className,
  items,
}: {
  className?: string;
  items: AppNavItem[];
}) {
  const pathname = usePathname();

  return (
    <nav className={className}>
      {items.map((item) => {
        const Icon = iconMap[item.icon];
        const active = isActive(pathname, item.href);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className="app-navlink"
            data-active={active}
            href={item.href}
            key={item.href}
          >
            <Icon aria-hidden size={18} strokeWidth={2.2} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
