import { useCallback } from "react";
import { MOCK_USER } from "@/lib/mock/data";
import { tableRows } from "@/lib/mock/db";

export type AppRole = "admin" | "maker" | "checker1" | "checker2" | "auditor";

const ALL_ROLES: AppRole[] = ["admin", "maker", "checker1", "checker2", "auditor"];

/**
 * Prototype auth. There is no real session — the demo user is always signed in
 * and holds every role so all screens are explorable.
 */
export function useSession() {
  return { session: { user: { id: MOCK_USER.id, email: MOCK_USER.email } }, loading: false };
}

export function useAuth() {
  const { session } = useSession();
  const roles = ALL_ROLES;
  const profile = tableRows("profiles").find((p) => p['id'] === MOCK_USER.id) ?? null;

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);
  const hasAnyRole = useCallback((list: AppRole[]) => list.some((r) => roles.includes(r)), [roles]);

  return {
    session,
    user: session.user,
    profile,
    roles,
    loading: false,
    hasRole,
    hasAnyRole,
    isAdmin: true,
    canMake: true,
    canCheck: true,
    isChecker1: true,
    isChecker2: true,
  };
}
