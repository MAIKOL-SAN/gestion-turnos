import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { query } from "@/lib/db";
import type { CurrentUser, Role } from "@/lib/types";

const COOKIE_NAME = "turnos_session";
const SESSION_DAYS = 7;

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET es obligatoria en produccion.");
  }

  return new TextEncoder().encode(secret ?? "dev-secret-change-me");
}

async function signSession(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
}

export async function setSessionCookie(userId: string) {
  const token = await signSession(userId);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.sub;

    if (!userId) {
      return null;
    }

    const result = await query<CurrentUser>(
      `select id, email, name, role, status
       from users
       where id = $1 and status = 'ACTIVE'
       limit 1`,
      [userId],
    );

    return result.rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser();

  if (!roles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}

export function isAdminRole(role: Role) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function canTakeAttendance(role: Role) {
  return isAdminRole(role) || role === "ATTENDANCE_MANAGER";
}
