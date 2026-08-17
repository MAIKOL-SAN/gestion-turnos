import { notFound } from "next/navigation";
import { setPersonStatusAction } from "@/app/actions/profile";
import { AppShell } from "@/components/AppShell";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { PageHeader, SubmitButton } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getPersonForAdmin, getUserRegistrations } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/format";

export default async function AdminPersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { id } = await params;
  const [person, registrations] = await Promise.all([
    getPersonForAdmin(id),
    getUserRegistrations(id),
  ]);

  if (!person) {
    notFound();
  }

  return (
    <AppShell user={user}>
      <PageHeader title={person.name} description={person.email} />
      <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <ProfileForm
            personId={person.id}
            profile={{
              id: person.profile_id ?? person.id,
              full_name: person.full_name,
              cedula: person.cedula,
              phone: person.phone,
              birth_date: person.birth_date,
              address: person.address,
              blood_type: person.blood_type,
              eps: person.eps,
            }}
          />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Estado</h2>
          <p className="mt-2 text-sm text-slate-600">{person.status}</p>
          <form action={setPersonStatusAction} className="mt-4 flex flex-col gap-3">
            <input type="hidden" name="personId" value={person.id} />
            <select
              className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
              name="status"
              defaultValue={person.status}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
            <SubmitButton variant="secondary">Guardar estado</SubmitButton>
          </form>
        </div>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Turnos de la persona</h2>
        <div className="mt-3 divide-y divide-slate-100">
          {registrations.length === 0 ? (
            <p className="py-4 text-sm text-slate-600">No hay turnos registrados.</p>
          ) : (
            registrations.map((registration) => (
              <div key={registration.registration_id} className="py-3">
                <p className="font-medium text-slate-950">{registration.name}</p>
                <p className="text-sm text-slate-600">
                  {formatDate(registration.shift_date)} · {formatTime(registration.start_time)} -{" "}
                  {formatTime(registration.end_time)} · {registration.registration_status}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
