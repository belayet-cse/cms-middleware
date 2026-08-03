import { useCallback } from "react";
import { useIdentity, type ActiveRole } from "@/lib/session-store";

export type AppRole = "admin" | "maker" | "checker1" | "checker2" | "auditor";

const ROLE_SET: Record<ActiveRole, AppRole[]> = {
  maker: ["maker"],
  checker1: ["checker1"],
  checker2: ["checker2"],
  admin: ["admin", "maker", "checker1", "checker2", "auditor"],
};

export function useSession() {
  const identity = useIdentity();
  return {
    session: { user: { id: identity.id, email: `${identity.id}@mtb.com.bd` } },
    loading: false,
  };
}

/**
 * Prototype auth. The demo user is always signed in; the active operational role
 * (and therefore the acting staff identity) can be switched from the top bar so
 * maker-checker segregation of duty is demonstrable.
 */
export function useAuth() {
  const identity = useIdentity();
  const { session } = useSession();
  const roles = ROLE_SET[identity.role];

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);
  const hasAnyRole = useCallback((list: AppRole[]) => list.some((r) => roles.includes(r)), [roles]);

  return {
    session,
    user: session.user,
    identity,
    profile: { full_name: identity.name, designation: identity.designation },
    roles,
    loading: false,
    hasRole,
    hasAnyRole,
    isAdmin: roles.includes("admin"),
    canMake: roles.includes("maker"),
    canCheck: roles.includes("checker1") || roles.includes("checker2"),
    isChecker1: roles.includes("checker1"),
    isChecker2: roles.includes("checker2"),
  };
}
