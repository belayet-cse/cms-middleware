import { useSyncExternalStore } from "react";

export type ActiveRole = "maker" | "checker1" | "checker2" | "admin";

export type Identity = {
  id: string;
  name: string;
  designation: string;
  role: ActiveRole;
};

/** Each operational role is a distinct staff member so segregation of duty is demonstrable. */
export const IDENTITIES: Record<ActiveRole, Identity> = {
  maker: { id: "u-0001", name: "Tanvir Hasan", designation: "Officer, Cards Operations", role: "maker" },
  checker1: { id: "u-0002", name: "Nusrat Jahan", designation: "Senior Officer, Card Division", role: "checker1" },
  checker2: { id: "u-0003", name: "Rafiqul Islam", designation: "Head of Cards", role: "checker2" },
  admin: { id: "u-0004", name: "Sabina Yeasmin", designation: "Admin / Management Oversight", role: "admin" },
};

let activeRole: ActiveRole = "maker";
const listeners = new Set<() => void>();

export function setActiveRole(role: ActiveRole) {
  activeRole = role;
  listeners.forEach((l) => l());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function currentIdentity(): Identity {
  return IDENTITIES[activeRole];
}

export function useActiveRole(): ActiveRole {
  return useSyncExternalStore(subscribe, () => activeRole, () => activeRole);
}

export function useIdentity(): Identity {
  const role = useActiveRole();
  return IDENTITIES[role];
}
