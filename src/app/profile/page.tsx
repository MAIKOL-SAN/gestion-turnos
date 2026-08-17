import { AppShell } from "@/components/AppShell";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getPersonProfile } from "@/lib/data";

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getPersonProfile(user.id);

  return (
    <AppShell user={user}>
      <PageHeader
        title="Perfil"
        description="Tu informacion sensible solo es visible para ti y para administradores autorizados."
      />
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <ProfileForm profile={profile} />
      </div>
    </AppShell>
  );
}
