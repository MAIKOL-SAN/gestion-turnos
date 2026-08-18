import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { PageHeader } from "@/components/ui";
import { canTakeAttendance, isAdminRole, requireUser } from "@/lib/auth";
import { getPersonProfile } from "@/lib/data";

export default async function ProfilePage() {
  const user = await requireUser();

  if (isAdminRole(user.role)) {
    redirect("/admin");
  }

  if (canTakeAttendance(user.role)) {
    redirect("/attendance");
  }

  const profile = await getPersonProfile(user.id);

  return (
    <AppShell user={user}>
      <PageHeader
        title="Perfil"
        description="Tu informacion sensible solo es visible para ti y para administradores autorizados."
      />
      <div className="app-card">
        <ProfileForm profile={profile} />
      </div>
    </AppShell>
  );
}
