import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/lib/mock/db";
import { PageHeader } from "@/components/app/PageHeader";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/cms-constants";

export const Route = createFileRoute("/_authenticated/audit")({
  component: Audit,
});

function Audit() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });

  const term = search.trim().toLowerCase();
  const rows = (data ?? []).filter(
    (l) =>
      !term ||
      l.action.toLowerCase().includes(term) ||
      l.entity_type.toLowerCase().includes(term) ||
      (l.actor_name ?? "").toLowerCase().includes(term) ||
      (l.reference_no ?? "").toLowerCase().includes(term),
  );

  return (
    <div>
      <PageHeader
        title="Audit trail"
        description="Immutable record of every data change and authorisation action, with the officer, timestamp and the fields that changed."
      />
      <Input
        placeholder="Search action, entity, officer or reference"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              {["When", "Action", "Entity", "Reference", "Officer", "Changed fields"].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2.5 field-label">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-muted-foreground">
                  No audit entries visible.
                </td>
              </tr>
            )}
            {rows.map((l) => (
              <tr key={l.id} className="hover:bg-accent/40">
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                  {formatDateTime(l.created_at)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-medium capitalize">
                  {l.action.replace(/_/g, " ")}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">{l.entity_type}</td>
                <td className="whitespace-nowrap px-3 py-2.5 mono text-xs">{l.reference_no ?? "—"}</td>
                <td className="px-3 py-2.5">{l.actor_name ?? "system"}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {(l.changed_fields ?? []).join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}