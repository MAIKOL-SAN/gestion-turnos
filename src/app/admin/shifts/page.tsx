import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import {
  ButtonLink,
  EmptyState,
  PageHeader,
  StatusBadge,
  inputClass,
} from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getShiftSummaries } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/format";

export default async function AdminShiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; date?: string; search?: string }>;
}) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const params = await searchParams;
  const shifts = await getShiftSummaries({
    status: params.status || undefined,
    date: params.date || undefined,
    search: params.search || undefined,
  });

  return (
    <AppShell user={user}>
      <PageHeader
        title="Gestion de turnos"
        action={<ButtonLink href="/admin/shifts/new">Crear turno</ButtonLink>}
      />
      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-4">
        <input
          className={inputClass}
          name="search"
          placeholder="Buscar"
          defaultValue={params.search ?? ""}
        />
        <input className={inputClass} name="date" type="date" defaultValue={params.date ?? ""} />
        <select className={inputClass} name="status" defaultValue={params.status ?? ""}>
          <option value="">Todos los estados</option>
          <option value="DRAFT">Borrador</option>
          <option value="OPEN">Disponible</option>
          <option value="FULL">Completo</option>
          <option value="CLOSED">Cerrado</option>
          <option value="CANCELLED">Cancelado</option>
          <option value="COMPLETED">Completado</option>
        </select>
        <button className="min-h-10 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white">
          Filtrar
        </button>
      </form>
      {shifts.length === 0 ? (
        <EmptyState>No hay turnos con esos filtros.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-normal text-slate-600">
                <tr>
                  <th className="px-4 py-3">Actividad</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Horario</th>
                  <th className="px-4 py-3">Personas</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shifts.map((shift) => (
                  <tr key={shift.id}>
                    <td className="px-4 py-3">
                      <Link
                        className="font-medium text-teal-700"
                        href={`/admin/shifts/${shift.id}`}
                      >
                        {shift.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(shift.shift_date)}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {shift.registered_count} / {shift.max_capacity}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={shift.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
