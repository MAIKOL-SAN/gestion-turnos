export const ROLES = ["PERSON", "ADMIN", "SUPER_ADMIN", "ATTENDANCE_MANAGER"] as const;
export type Role = (typeof ROLES)[number];

export type UserStatus = "ACTIVE" | "INACTIVE";

export type ShiftStatus =
  | "DRAFT"
  | "OPEN"
  | "FULL"
  | "CLOSED"
  | "CANCELLED"
  | "COMPLETED";

export type RegistrationStatus = "CONFIRMED" | "CANCELLED";
export type AttendanceStatus = "PENDING" | "PRESENT" | "ABSENT" | "LATE";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
};

export type PersonProfile = {
  id: string;
  user_id: string;
  full_name: string;
  cedula: string;
  phone: string;
  birth_date: string | null;
  address: string | null;
  blood_type: string | null;
  eps: string | null;
  created_at: string;
  updated_at: string;
};

export type ShiftSummary = {
  id: string;
  name: string;
  description: string | null;
  shift_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  status: ShiftStatus;
  created_at: string;
  created_by: string | null;
  created_by_name: string | null;
  registered_count: number;
  available_count: number;
  my_registration_id?: string | null;
};

export type RegistrationRow = {
  id: string;
  person_id: string;
  shift_id: string;
  status: RegistrationStatus;
  attendance_status: AttendanceStatus;
  registered_at: string;
  cancelled_at: string | null;
  person_name: string;
  email: string;
  cedula: string | null;
  phone: string | null;
  absence_count: number;
  absence_limit: number;
  absence_unlocked_at: string | null;
  registration_blocked: boolean;
};

export type FormState = {
  error?: string;
  success?: string;
};
