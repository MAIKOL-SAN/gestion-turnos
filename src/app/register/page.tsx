import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRoundPlus } from "lucide-react";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { linkClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="auth-shell">
      <section className="auth-brand hidden flex-col justify-between p-8 lg:flex">
        <div className="flex items-center gap-3">
          <span className="app-brand-mark">GT</span>
          <div>
            <p className="text-lg font-bold">Gestion de turnos</p>
            <p className="text-sm text-white/70">Registro de personas</p>
          </div>
        </div>
        <div className="max-w-md">
          <UserRoundPlus aria-hidden className="mb-5 text-[var(--brand-accent)]" size={42} />
          <p className="text-4xl font-semibold leading-tight">Datos completos, acceso sencillo.</p>
          <p className="mt-4 text-sm leading-6 text-white/70">
            Un perfil claro ayuda a gestionar cupos, asistencia y contacto operativo.
          </p>
        </div>
      </section>

      <section className="auth-panel relative">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="app-card w-full max-w-3xl p-6 sm:p-8">
          <div className="mb-6">
            <div className="mb-5 inline-flex lg:hidden">
              <span className="app-brand-mark border border-[color:var(--border)]">GT</span>
            </div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Crear cuenta</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Completa tus datos basicos para inscribirte en turnos.
            </p>
          </div>
          <RegisterForm />
          <p className="mt-5 text-sm text-[var(--foreground-muted)]">
            Ya tienes cuenta?{" "}
            <Link className={linkClass} href="/login">
              Inicia sesion
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
