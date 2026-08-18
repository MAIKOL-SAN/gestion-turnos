import Link from "next/link";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { AppNav, type AppNavItem } from "@/components/AppNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { canTakeAttendance, isAdminRole } from "@/lib/auth";
import { roleLabel } from "@/lib/format";
import type { CurrentUser } from "@/lib/types";

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const admin = isAdminRole(user.role);
  const attendance = canTakeAttendance(user.role);
  const homeHref = admin ? "/admin" : attendance ? "/attendance" : "/dashboard";
  const links: AppNavItem[] = admin
    ? [
        { href: "/admin", icon: "dashboard", label: "Panel" },
        { href: "/admin/shifts", icon: "calendar", label: "Turnos" },
        { href: "/admin/calendar", icon: "calendar", label: "Calendario" },
        { href: "/attendance", icon: "attendance", label: "Pasar lista" },
        { href: "/admin/people", icon: "people", label: "Personas" },
        { href: "/admin/administrators", icon: "shield", label: "Administradores" },
        { href: "/admin/audit-log", icon: "audit", label: "Auditoria" },
      ]
    : attendance
      ? [
          { href: "/attendance", icon: "attendance", label: "Pasar lista" },
        ]
    : [
        { href: "/dashboard", icon: "dashboard", label: "Panel" },
        { href: "/shifts", icon: "calendar", label: "Turnos" },
        { href: "/my-shifts", icon: "attendance", label: "Mis turnos" },
        { href: "/profile", icon: "profile", label: "Perfil" },
      ];

  return (
    <div className="app-shell lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="app-sidebar sticky top-0 hidden h-screen flex-col px-4 py-5 lg:flex">
        <Link href={homeHref} className="flex min-w-0 items-center gap-3 px-1">
          <span className="app-brand-mark">GT</span>
          <span className="min-w-0">
            <span className="block truncate text-base font-bold">Gestion de turnos</span>
            <span className="block truncate text-xs font-medium text-white/60">
              Operacion diaria
            </span>
          </span>
        </Link>

        <AppNav className="mt-8 flex flex-1 flex-col gap-1" items={links} />

        <div className="rounded-lg border border-white/15 bg-white/10 p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="mt-1 truncate text-xs text-white/70">{roleLabel(user.role)}</p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <ThemeToggle />
            <form action={logoutAction}>
              <button
                aria-label="Cerrar sesion"
                className="app-icon-button"
                title="Cerrar sesion"
                type="submit"
              >
                <LogOut aria-hidden size={18} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar sticky top-0 z-20 border-b lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Link href={homeHref} className="flex min-w-0 items-center gap-3">
              <span className="app-brand-mark border border-[color:var(--border)]">GT</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-[var(--foreground)]">
                  Gestion de turnos
                </span>
                <span className="block truncate text-xs text-[var(--foreground-muted)]">
                  {user.name}
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <form action={logoutAction}>
                <button
                  aria-label="Cerrar sesion"
                  className="app-icon-button"
                  title="Cerrar sesion"
                  type="submit"
                >
                  <LogOut aria-hidden size={18} />
                </button>
              </form>
            </div>
          </div>
          <AppNav className="app-mobile-nav flex gap-2 overflow-x-auto px-4 pb-3" items={links} />
        </header>

        <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
