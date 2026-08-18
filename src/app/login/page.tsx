import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck2 } from "lucide-react";
import { LoginForm } from "@/components/forms/LoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Alert, linkClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;

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
            <p className="text-sm text-white/70">Operacion y asistencia</p>
          </div>
        </div>
        <div className="max-w-md">
          <CalendarCheck2 aria-hidden className="mb-5 text-[var(--brand-accent)]" size={42} />
          <p className="text-4xl font-semibold leading-tight">Turnos claros, lista rapida.</p>
          <p className="mt-4 text-sm leading-6 text-white/70">
            Panel preparado para administrar cupos, asistencia y seguimiento diario.
          </p>
        </div>
      </section>

      <section className="auth-panel relative">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="app-card w-full max-w-md p-6 sm:p-8">
          <div className="mb-6">
            <div className="mb-5 inline-flex lg:hidden">
              <span className="app-brand-mark border border-[color:var(--border)]">GT</span>
            </div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Iniciar sesion</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Accede al sistema de gestion de turnos.
            </p>
          </div>
          {params.registered ? (
            <div className="mb-4">
              <Alert type="success">Cuenta creada. Ya puedes iniciar sesion.</Alert>
            </div>
          ) : null}
          <LoginForm />
          <p className="mt-5 text-sm text-[var(--foreground-muted)]">
            No tienes cuenta?{" "}
            <Link className={linkClass} href="/register">
              Registrate
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
