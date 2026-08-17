import { z } from "zod";

const requiredText = (label: string, max = 160) =>
  z.string().trim().min(1, `${label} es obligatorio.`).max(max);

export const cedulaSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{5,15}$/, "La cedula debe tener entre 5 y 15 digitos.");

export const registerSchema = z.object({
  fullName: requiredText("Nombre completo"),
  cedula: cedulaSchema,
  phone: requiredText("Telefono", 40),
  email: z.string().trim().toLowerCase().email("Correo invalido."),
  password: z.string().min(8, "La contrasena debe tener minimo 8 caracteres."),
  birthDate: z.string().optional(),
  address: z.string().trim().max(240).optional(),
  bloodType: z.string().trim().max(12).optional(),
  eps: z.string().trim().max(120).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo invalido."),
  password: z.string().min(1, "La contrasena es obligatoria."),
});

export const profileSchema = z.object({
  fullName: requiredText("Nombre completo"),
  cedula: cedulaSchema,
  phone: requiredText("Telefono", 40),
  birthDate: z.string().optional(),
  address: z.string().trim().max(240).optional(),
  bloodType: z.string().trim().max(12).optional(),
  eps: z.string().trim().max(120).optional(),
});

export const shiftSchema = z
  .object({
    name: requiredText("Nombre del turno"),
    description: z.string().trim().max(1000).optional(),
    shiftDate: z.string().min(1, "La fecha es obligatoria."),
    startTime: z.string().min(1, "La hora de inicio es obligatoria."),
    endTime: z.string().min(1, "La hora de finalizacion es obligatoria."),
    maxCapacity: z.coerce
      .number()
      .int("El cupo debe ser entero.")
      .min(1, "El cupo debe ser mayor que cero.")
      .max(10000, "El cupo es demasiado alto."),
    status: z
      .enum(["DRAFT", "OPEN", "FULL", "CLOSED", "CANCELLED", "COMPLETED"])
      .default("OPEN"),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "La hora de finalizacion debe ser posterior al inicio.",
    path: ["endTime"],
  });

export const adminSchema = z.object({
  name: requiredText("Nombre"),
  email: z.string().trim().toLowerCase().email("Correo invalido."),
  password: z.string().min(8, "La contrasena debe tener minimo 8 caracteres."),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]).default("ADMIN"),
});

export function optionalString(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function firstZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Datos invalidos.";
}
