import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/mock/db";
import { PageHeader } from "@/components/app/PageHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { ROLES } from "@/lib/cms-constants";
import { setUserRolesFn } from "@/lib/mock/actions";
import type { AppRole } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersAndRoles,
});

function UsersAndRoles() {
  const queryClient = useQueryClient();
  const setRoles = setUserRolesFn;

  const { data, isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("*").order("full_name"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (profiles.error) throw profiles.error;
      return { profiles: profiles.data ?? [], roles: roles.data ?? [] };
    },
  });

  const mutation = useMutation({
    mutationFn: (vars: { userId: string; roles: AppRole[] }) => setRoles({ data: vars }),
    onSuccess: () => {
      toast.success("Roles updated");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rolesFor = (id: string) =>
    (data?.roles ?? []).filter((r) => r.user_id === id).map((r) => r.role as AppRole);

  return (
    <div>
      <PageHeader
        title="Users & roles"
        description="Assign segregated duties. A maker cannot check their own case, and Checker-2 must be a different officer from Checker-1."
      />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <th className="px-3 py-2.5 field-label">Officer</th>
              <th className="px-3 py-2.5 field-label">Branch / Designation</th>
              {ROLES.map((r) => (
                <th key={r.value} className="whitespace-nowrap px-3 py-2.5 field-label">
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {(data?.profiles ?? []).map((p) => {
              const current = rolesFor(p.id);
              return (
                <tr key={p.id} className="hover:bg-accent/40">
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{p.full_name}</p>
                    <p className="text-xs text-muted-foreground">{p.email ?? p.employee_id ?? "—"}</p>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {[p.branch, p.designation].filter(Boolean).join(" · ") || "—"}
                  </td>
                  {ROLES.map((r) => (
                    <td key={r.value} className="px-3 py-2.5">
                      <Checkbox
                        checked={current.includes(r.value as AppRole)}
                        disabled={mutation.isPending}
                        onCheckedChange={(checked) => {
                          const next = checked
                            ? [...current, r.value as AppRole]
                            : current.filter((x) => x !== r.value);
                          mutation.mutate({ userId: p.id, roles: next });
                        }}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}