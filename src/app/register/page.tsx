import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Crear cuenta</h1>
        <p className="mt-1 text-sm text-slate-600">
          Completa tus datos basicos para inscribirte en turnos.
        </p>
        <div className="mt-6">
          <RegisterForm />
        </div>
        <p className="mt-5 text-sm text-slate-600">
          Ya tienes cuenta?{" "}
          <Link className="font-semibold text-teal-700" href="/login">
            Inicia sesion
          </Link>
        </p>
      </div>
    </main>
  );
}
