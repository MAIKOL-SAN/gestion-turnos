import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
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
  const links = admin
    ? [
        ["Panel", "/admin"],
        ["Turnos", "/admin/shifts"],
        ["Calendario", "/admin/calendar"],
        ["Pasar lista", "/attendance"],
        ["Personas", "/admin/people"],
        ["Administradores", "/admin/administrators"],
        ["Auditoria", "/admin/audit-log"],
      ]
    : attendance
      ? [
          ["Pasar lista", "/attendance"],
          ["Perfil", "/profile"],
        ]
    : [
        ["Panel", "/dashboard"],
        ["Turnos", "/shifts"],
        ["Mis turnos", "/my-shifts"],
        ["Perfil", "/profile"],
      ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href={homeHref} className="text-lg font-semibold text-slate-950">
              Gestion de turnos
            </Link>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span>{user.name}</span>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
                {roleLabel(user.role)}
              </span>
              <form action={logoutAction}>
                <button className="font-semibold text-teal-700 hover:text-teal-900">
                  Salir
                </button>
              </form>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
