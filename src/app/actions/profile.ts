"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { requireRole, requireUser } from "@/lib/auth";
import { isUniqueViolation, query, withTransaction } from "@/lib/db";
import { formString } from "@/lib/form";
import type { FormState } from "@/lib/types";
import { firstZodError, optionalString, profileSchema } from "@/lib/validation";

export async function updateProfileAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    fullName: formString(formData, "fullName"),
    cedula: formString(formData, "cedula"),
    phone: formString(formData, "phone"),
    birthDate: formString(formData, "birthDate"),
    address: formString(formData, "address"),
    bloodType: formString(formData, "bloodType"),
    eps: formString(formData, "eps"),
  });

  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  try {
    await withTransaction(async (client) => {
      await client.query(`update users set name = $1 where id = $2`, [
        parsed.data.fullName,
        user.id,
      ]);

      await client.query(
        `insert into person_profiles (
           user_id,
           full_name,
           cedula,
           phone,
           birth_date,
           address,
           blood_type,
           eps
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         on conflict (user_id) do update set
           full_name = excluded.full_name,
           cedula = excluded.cedula,
           phone = excluded.phone,
           birth_date = excluded.birth_date,
           address = excluded.address,
           blood_type = excluded.blood_type,
           eps = excluded.eps,
           updated_at = now()`,
        [
          user.id,
          parsed.data.fullName,
          parsed.data.cedula,
          parsed.data.phone,
          optionalString(parsed.data.birthDate),
          optionalString(parsed.data.address),
          optionalString(parsed.data.bloodType),
          optionalString(parsed.data.eps),
        ],
      );
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: "La cedula ya esta registrada." };
    }

    return { error: "No fue posible guardar el perfil." };
  }

  revalidatePath("/profile");
  return { success: "Perfil actualizado." };
}

export async function updatePersonByAdminAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const personId = formString(formData, "personId");
  const parsed = profileSchema.safeParse({
    fullName: formString(formData, "fullName"),
    cedula: formString(formData, "cedula"),
    phone: formString(formData, "phone"),
    birthDate: formString(formData, "birthDate"),
    address: formString(formData, "address"),
    bloodType: formString(formData, "bloodType"),
    eps: formString(formData, "eps"),
  });

  if (!personId) {
    return { error: "Persona invalida." };
  }

  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  try {
    await withTransaction(async (client) => {
      const userResult = await client.query<{ id: string }>(
        `update users
         set name = $1
         where id = $2 and role = 'PERSON'
         returning id`,
        [parsed.data.fullName, personId],
      );

      if (!userResult.rows[0]) {
        throw new Error("PERSON_NOT_FOUND");
      }

      await client.query(
        `insert into person_profiles (
           user_id,
           full_name,
           cedula,
           phone,
           birth_date,
           address,
           blood_type,
           eps
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         on conflict (user_id) do update set
           full_name = excluded.full_name,
           cedula = excluded.cedula,
           phone = excluded.phone,
           birth_date = excluded.birth_date,
           address = excluded.address,
           blood_type = excluded.blood_type,
           eps = excluded.eps,
           updated_at = now()`,
        [
          personId,
          parsed.data.fullName,
          parsed.data.cedula,
          parsed.data.phone,
          optionalString(parsed.data.birthDate),
          optionalString(parsed.data.address),
          optionalString(parsed.data.bloodType),
          optionalString(parsed.data.eps),
        ],
      );
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: "La cedula ya esta registrada." };
    }

    return { error: "No fue posible guardar la persona." };
  }

  await logAudit(admin.id, "ADMIN_UPDATED_PERSON", "USER", personId);
  revalidatePath(`/admin/people/${personId}`);
  revalidatePath("/admin/people");
  return { success: "Persona actualizada." };
}

export async function setPersonStatusAction(formData: FormData) {
  const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const personId = formString(formData, "personId");
  const status = formString(formData, "status") === "INACTIVE" ? "INACTIVE" : "ACTIVE";

  await query(
    `update users
     set status = $1
     where id = $2 and role = 'PERSON'`,
    [status, personId],
  );

  await logAudit(admin.id, "ADMIN_CHANGED_PERSON_STATUS", "USER", personId, {
    status,
  });
  revalidatePath("/admin/people");
  revalidatePath(`/admin/people/${personId}`);
  redirect(`/admin/people/${personId}`);
}
