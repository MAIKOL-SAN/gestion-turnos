import { AppShell } from "@/components/AppShell";
import { ShiftForm } from "@/components/forms/ShiftForm";
import { PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";

export default async function NewShiftPage() {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN"]);

  return (
    <AppShell user={user}>
      <PageHeader title="Crear turno" />
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <ShiftForm />
      </div>
    </AppShell>
  );
}
