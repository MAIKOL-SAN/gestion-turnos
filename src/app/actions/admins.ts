"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { isUniqueViolation, query } from "@/lib/db";
import { formString } from "@/lib/form";
import type { FormState } from "@/lib/types";
import { adminSchema, firstZodError } from "@/lib/validation";

export async function createAdministratorAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const creator = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const parsed = adminSchema.safeParse({
    name: formString(formData, "name"),
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    role:
      creator.role === "SUPER_ADMIN"
        ? formString(formData, "role") || "ADMIN"
        : "ADMIN",
  });

  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  if (creator.role !== "SUPER_ADMIN" && parsed.data.role !== "ADMIN") {
    return { error: "Solo un SUPER_ADMIN puede crear SUPER_ADMIN." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  try {
    const result = await query<{ id: string }>(
      `insert into users (name, email, password_hash, role)
       values ($1, $2, $3, $4)
       returning id`,
      [parsed.data.name, parsed.data.email, passwordHash, parsed.data.role],
    );

    await logAudit(
      creator.id,
      "SUPER_ADMIN_CREATED_ADMIN",
      "USER",
      result.rows[0].id,
      { role: parsed.data.role },
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: "Ya existe un usuario con ese correo." };
    }

    return { error: "No fue posible crear el administrador." };
  }

  revalidatePath("/admin/administrators");
  return { success: "Administrador creado." };
}

export async function updateAdministratorAction(formData: FormData) {
  const actor = await requireRole(["SUPER_ADMIN"]);
  const adminId = formString(formData, "adminId");
  const status = formString(formData, "status") === "INACTIVE" ? "INACTIVE" : "ACTIVE";
  const role = formString(formData, "role") === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN";

  if (actor.id === adminId && status === "INACTIVE") {
    redirect("/admin/administrators?error=self");
  }

  await query(
    `update users
     set status = $1,
         role = $2
     where id = $3 and role in ('ADMIN', 'SUPER_ADMIN')`,
    [status, role, adminId],
  );

  await logAudit(actor.id, "SUPER_ADMIN_UPDATED_ADMIN", "USER", adminId, {
    status,
    role,
  });
  revalidatePath("/admin/administrators");
  redirect("/admin/administrators");
}
