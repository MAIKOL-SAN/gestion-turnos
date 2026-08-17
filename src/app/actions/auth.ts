"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth";
import { isUniqueViolation, query, withTransaction } from "@/lib/db";
import { formString } from "@/lib/form";
import type { FormState } from "@/lib/types";
import {
  firstZodError,
  loginSchema,
  optionalString,
  registerSchema,
} from "@/lib/validation";

export async function loginAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });

  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const result = await query<{
    id: string;
    password_hash: string;
    status: string;
  }>(
    `select id, password_hash, status
     from users
     where email = $1
     limit 1`,
    [parsed.data.email],
  );

  const user = result.rows[0];

  if (!user || user.status !== "ACTIVE") {
    return { error: "Credenciales invalidas." };
  }

  const passwordOk = await bcrypt.compare(
    parsed.data.password,
    user.password_hash,
  );

  if (!passwordOk) {
    return { error: "Credenciales invalidas." };
  }

  await setSessionCookie(user.id);
  redirect("/dashboard");
}

export async function registerAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    fullName: formString(formData, "fullName"),
    cedula: formString(formData, "cedula"),
    phone: formString(formData, "phone"),
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    birthDate: formString(formData, "birthDate"),
    address: formString(formData, "address"),
    bloodType: formString(formData, "bloodType"),
    eps: formString(formData, "eps"),
  });

  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  try {
    await withTransaction(async (client) => {
      const userResult = await client.query<{ id: string }>(
        `insert into users (name, email, password_hash, role)
         values ($1, $2, $3, 'PERSON')
         returning id`,
        [parsed.data.fullName, parsed.data.email, passwordHash],
      );

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
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userResult.rows[0].id,
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
      return { error: "Ya existe una cuenta con ese correo o cedula." };
    }

    return { error: "No fue posible crear la cuenta." };
  }

  redirect("/login?registered=1");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
