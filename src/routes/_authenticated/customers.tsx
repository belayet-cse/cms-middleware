import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/cms-constants";

export const Route = createFileRoute("/_authenticated/customers")({
  component: Customers,
});

function SyncBadge({ label, value }: { label: string; value: string }) {
  const tone =
    value === "synced" ? "status-success" : value === "failed" ? "status-danger" : "status-warning";
  return (
    <Badge variant="outline" className={`text-[10px] ${tone}`}>
      {label}: {value}
    </Badge>
  );
}

function Customers() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select(
          "id, full_name, cif_number, cms_client_id, mobile, email, national_id, city, cbs_sync, cms_sync, last_synced_at, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });

  const term = search.trim().toLowerCase();
  const rows = (data ?? []).filter(
    (c) =>
      !term ||
      c.full_name.toLowerCase().includes(term) ||
      (c.cif_number ?? "").includes(term) ||
      (c.mobile ?? "").includes(term) ||
      (c.national_id ?? "").includes(term),
  );

  return (
    <div>
      <PageHeader
        title="Customers / CIF"
        description="Master customer records with their Core Banking CIF and Card Management System Client ID."
      />
      <Input
        placeholder="Search name, CIF, mobile or NID"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              {["Customer", "CIF", "CMS Client ID", "Contact", "City", "Sync", "Last synced"].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2.5 field-label">
                  {h}
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
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-muted-foreground">
                  No customer records yet.
                </td>
              </tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-accent/40">
                <td className="px-3 py-2.5">
                  <p className="font-medium">{c.full_name}</p>
                  <p className="text-xs text-muted-foreground">{c.national_id ?? "—"}</p>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 mono">{c.cif_number ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2.5 mono">{c.cms_client_id ?? "—"}</td>
                <td className="px-3 py-2.5 text-xs">
                  <p>{c.mobile}</p>
                  <p className="text-muted-foreground">{c.email ?? "—"}</p>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">{c.city ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <div className="flex gap-1.5">
                    <SyncBadge label="CBS" value={c.cbs_sync} />
                    <SyncBadge label="CMS" value={c.cms_sync} />
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                  {formatDateTime(c.last_synced_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}