import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/LoginForm";
import { Alert } from "@/components/ui";
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
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Iniciar sesion</h1>
        <p className="mt-1 text-sm text-slate-600">
          Accede al sistema de gestion de turnos.
        </p>
        <div className="mt-6">
          {params.registered ? (
            <div className="mb-4">
              <Alert type="success">Cuenta creada. Ya puedes iniciar sesion.</Alert>
            </div>
          ) : null}
          <LoginForm />
        </div>
        <p className="mt-5 text-sm text-slate-600">
          No tienes cuenta?{" "}
          <Link className="font-semibold text-teal-700" href="/register">
            Registrate
          </Link>
        </p>
      </div>
    </main>
  );
}
