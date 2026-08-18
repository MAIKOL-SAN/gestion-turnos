import { notFound } from "next/navigation";
import {
  cancelRegistrationAction,
  registerForShiftAction,
} from "@/app/actions/shifts";
import { AppShell } from "@/components/AppShell";
import { Alert, PageHeader, StatusBadge, SubmitButton, mutedClass } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getRegistrationBlock, getShiftByIdDirect } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/format";

const errorMessages: Record<string, string> = {
  role: "Los administradores no pueden inscribirse desde esta vista.",
  SHIFT_NOT_OPEN: "El turno no esta abierto.",
  SHIFT_FULL: "El turno ya no tiene cupos disponibles.",
  ABSENCE_BLOCKED:
    "No puedes inscribirte porque superaste el limite de faltas. Un administrador o pasa lista debe reactivar tu inscripcion.",
  FORBIDDEN: "No puedes cancelar esta inscripcion.",
};

export default async function ShiftDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; registered?: string; cancelled?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const queryParams = await searchParams;
  const [shift, registrationBlock] = await Promise.all([
    getShiftByIdDirect(id, user.id),
    getRegistrationBlock(user.id),
  ]);

  if (!shift) {
    notFound();
  }

  const canRegister =
    user.role === "PERSON" &&
    shift.status === "OPEN" &&
    shift.available_count > 0 &&
    !registrationBlock.registration_blocked &&
    !shift.my_registration_id;

  return (
    <AppShell user={user}>
      <PageHeader title={shift.name} action={<StatusBadge status={shift.status} />} />
      {queryParams.error ? (
        <Alert type="error">
          {errorMessages[queryParams.error] ?? "No fue posible completar la accion."}
        </Alert>
      ) : null}
      {queryParams.registered ? (
        <Alert type="success">Inscripcion confirmada.</Alert>
      ) : null}
      {queryParams.cancelled ? <Alert type="success">Inscripcion cancelada.</Alert> : null}
      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="app-card">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className={mutedClass}>Fecha</dt>
              <dd className="mt-1 font-semibold text-[var(--foreground)]">
                {formatDate(shift.shift_date)}
              </dd>
            </div>
            <div>
              <dt className={mutedClass}>Horario</dt>
              <dd className="mt-1 font-semibold text-[var(--foreground)]">
                {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
              </dd>
            </div>
            <div>
              <dt className={mutedClass}>Cupos</dt>
              <dd className="mt-1 font-semibold text-[var(--foreground)]">
                {shift.registered_count} / {shift.max_capacity}
              </dd>
            </div>
            <div>
              <dt className={mutedClass}>Disponibles</dt>
              <dd className="mt-1 font-semibold text-[var(--foreground)]">
                {shift.status === "FULL" ? "Cupo completo" : shift.available_count}
              </dd>
            </div>
          </dl>
          {shift.description ? (
            <p className="mt-5 whitespace-pre-line text-sm leading-6 text-[var(--foreground-soft)]">
              {shift.description}
            </p>
          ) : null}
        </div>

        <div className="app-card">
          {shift.my_registration_id ? (
            <form action={cancelRegistrationAction} className="flex flex-col gap-3">
              <input type="hidden" name="registrationId" value={shift.my_registration_id} />
              <input type="hidden" name="shiftId" value={shift.id} />
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Ya estas inscrito en este turno.
              </p>
              <SubmitButton variant="danger">Cancelar inscripcion</SubmitButton>
            </form>
          ) : canRegister ? (
            <form action={registerForShiftAction} className="flex flex-col gap-3">
              <input type="hidden" name="shiftId" value={shift.id} />
              <p className="text-sm text-[var(--foreground-muted)]">
                {shift.available_count} cupos disponibles.
              </p>
              <SubmitButton>Inscribirme</SubmitButton>
            </form>
          ) : registrationBlock.registration_blocked ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                Inscripciones bloqueadas por faltas.
              </p>
              <p className="text-sm leading-6 text-[var(--foreground-muted)]">
                Faltas actuales: {registrationBlock.absence_count} /{" "}
                {registrationBlock.absence_limit}. Un administrador o pasa lista debe reactivar tu
                cuenta para nuevos turnos.
              </p>
            </div>
          ) : (
            <p className="text-sm font-semibold text-[var(--foreground-soft)]">
              {shift.status === "FULL" ? "Cupo completo" : "Inscripciones cerradas"}
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
