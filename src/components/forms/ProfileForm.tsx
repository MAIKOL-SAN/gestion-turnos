"use client";

import { useActionState } from "react";
import {
  updatePersonByAdminAction,
  updateProfileAction,
} from "@/app/actions/profile";
import { Alert, inputClass, labelClass, SubmitButton } from "@/components/ui";
import type { PersonProfile } from "@/lib/types";

type AdminProfile = {
  id: string;
  full_name: string | null;
  cedula: string | null;
  phone: string | null;
  birth_date: string | null;
  address: string | null;
  blood_type: string | null;
  eps: string | null;
};

export function ProfileForm({
  profile,
  personId,
}: {
  profile: PersonProfile | AdminProfile | null;
  personId?: string;
}) {
  const action = personId ? updatePersonByAdminAction : updateProfileAction;
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {personId ? <input type="hidden" name="personId" value={personId} /> : null}
      <div className="sm:col-span-2">
        {state.error ? <Alert type="error">{state.error}</Alert> : null}
        {state.success ? <Alert type="success">{state.success}</Alert> : null}
      </div>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className={labelClass}>Nombre completo</span>
        <input
          className={inputClass}
          name="fullName"
          defaultValue={profile?.full_name ?? ""}
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Cedula</span>
        <input
          className={inputClass}
          name="cedula"
          defaultValue={profile?.cedula ?? ""}
          inputMode="numeric"
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Telefono</span>
        <input
          className={inputClass}
          name="phone"
          defaultValue={profile?.phone ?? ""}
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Fecha de nacimiento</span>
        <input
          className={inputClass}
          name="birthDate"
          type="date"
          defaultValue={profile?.birth_date ?? ""}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Tipo de sangre</span>
        <input
          className={inputClass}
          name="bloodType"
          defaultValue={profile?.blood_type ?? ""}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>EPS</span>
        <input className={inputClass} name="eps" defaultValue={profile?.eps ?? ""} />
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className={labelClass}>Direccion</span>
        <input
          className={inputClass}
          name="address"
          defaultValue={profile?.address ?? ""}
        />
      </label>
      <div className="sm:col-span-2">
        <SubmitButton>Guardar perfil</SubmitButton>
      </div>
    </form>
  );
}
