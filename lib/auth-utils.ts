import { UserRole } from "@prisma/client";
import { auth } from "@/auth";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
  avatar?: string | null;
};

export function isAnyRole(role: string, ...roles: UserRole[]): boolean {
  return roles.includes(role as UserRole);
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user as SessionUser;
}

export async function requireRole(...roles: UserRole[]) {
  const user = await requireAuth();
  if (!isAnyRole(user.role, ...roles)) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function requireAdminOrStaff() {
  return requireRole(UserRole.ADMIN, UserRole.STAFF);
}

export async function requireAdminOrPimpinan() {
  return requireRole(UserRole.ADMIN, UserRole.PIMPINAN);
}
