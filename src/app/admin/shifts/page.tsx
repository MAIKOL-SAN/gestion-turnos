import Link from "next/link";
import { Filter, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  ButtonLink,
  EmptyState,
  PageHeader,
  StatusBadge,
  inputClass,
  linkClass,
  tableClass,
  tableShellClass,
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
        description="Filtra, revisa cupos y entra al detalle de cada turno."
        action={<ButtonLink href="/admin/shifts/new" icon={<Plus aria-hidden size={16} />}>Crear turno</ButtonLink>}
      />
      <form className="app-card grid gap-3 sm:grid-cols-[1fr_11rem_13rem_auto]">
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
        <button className="app-button app-button-primary" type="submit">
          <Filter aria-hidden size={16} />
          Filtrar
        </button>
      </form>
      {shifts.length === 0 ? (
        <EmptyState>No hay turnos con esos filtros.</EmptyState>
      ) : (
        <div className={tableShellClass}>
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th>Actividad</th>
                  <th>Fecha</th>
                  <th>Horario</th>
                  <th>Personas</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => (
                  <tr key={shift.id}>
                    <td>
                      <Link className={linkClass} href={`/admin/shifts/${shift.id}`}>
                        {shift.name}
                      </Link>
                    </td>
                    <td>{formatDate(shift.shift_date)}</td>
                    <td>
                      {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                    </td>
                    <td>
                      {shift.registered_count} / {shift.max_capacity}
                    </td>
                    <td>
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
