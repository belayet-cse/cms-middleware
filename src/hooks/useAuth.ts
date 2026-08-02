import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "maker" | "checker1" | "checker2" | "auditor";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  return { session, loading };
}

export function useAuth() {
  const { session, loading } = useSession();
  const userId = session?.user.id;

  const rolesQuery = useQuery({
    queryKey: ["roles", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });

  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const roles = rolesQuery.data ?? [];
  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);
  const hasAnyRole = useCallback((list: AppRole[]) => list.some((r) => roles.includes(r)), [roles]);

  return {
    session,
    user: session?.user ?? null,
    profile: profileQuery.data ?? null,
    roles,
    loading: loading || rolesQuery.isLoading,
    hasRole,
    hasAnyRole,
    isAdmin: roles.includes("admin"),
    canMake: roles.includes("maker") || roles.includes("admin"),
    canCheck: roles.includes("checker1") || roles.includes("checker2") || roles.includes("admin"),
    isChecker1: roles.includes("checker1") || roles.includes("admin"),
    isChecker2: roles.includes("checker2") || roles.includes("admin"),
  };
}