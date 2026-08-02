import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CARD_TYPES,
  REQUEST_STATUS_LABEL,
  REQUEST_TYPES,
  formatAmount,
  formatDateTime,
  labelOf,
} from "@/lib/cms-constants";

export const Route = createFileRoute("/_authenticated/requests/")({
  component: RequestQueue,
});

const FILTERS = [
  { value: "all", label: "All" },
  ...Object.entries(REQUEST_STATUS_LABEL).map(([value, label]) => ({ value, label })),
];

function RequestQueue() {
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["requests", status],
    queryFn: async () => {
      let q = supabase
        .from("card_requests")
        .select(
          "id, reference_no, applicant_name, mobile, card_type, request_type, status, requested_limit, approved_limit, generated_card_number, updated_at",
        )
        .order("updated_at", { ascending: false })
        .limit(300);
      if (status !== "all") q = q.eq("status", status as never);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const term = search.trim().toLowerCase();
  const rows = (data ?? []).filter(
    (r) =>
      !term ||
      r.applicant_name.toLowerCase().includes(term) ||
      r.reference_no.toLowerCase().includes(term) ||
      (r.mobile ?? "").includes(term),
  );

  return (
    <div>
      <PageHeader
        title="Request queue"
        description="Every card booking case with its current maker-checker stage."
        actions={
          <Link to="/onboarding" search={{ draft: "" }}>
            <Button>New booking</Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search name, reference or mobile"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                status === f.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card hover:bg-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr className="text-left">
              {["Reference", "Applicant", "Type", "Request", "Limit", "Card number", "Status", "Updated"].map(
                (h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2.5 field-label">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-muted-foreground">
                  No requests found.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-accent/40">
                <td className="whitespace-nowrap px-3 py-2.5">
                  <Link
                    to="/requests/$id"
                    params={{ id: r.id }}
                    className="mono font-medium text-primary hover:underline"
                  >
                    {r.reference_no}
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <p className="font-medium">{r.applicant_name}</p>
                  <p className="text-xs text-muted-foreground">{r.mobile}</p>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">{labelOf(CARD_TYPES, r.card_type)}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{labelOf(REQUEST_TYPES, r.request_type)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                  {formatAmount(r.approved_limit ?? r.requested_limit)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 mono text-xs">
                  {r.generated_card_number ?? "—"}
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={r.status} />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                  {formatDateTime(r.updated_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}