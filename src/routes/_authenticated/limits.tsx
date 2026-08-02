import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { CARD_TYPES, formatAmount, formatDateTime, labelOf, maskCard } from "@/lib/cms-constants";

export const Route = createFileRoute("/_authenticated/limits")({
  component: LimitControl,
});

function LimitControl() {
  const { data, isLoading } = useQuery({
    queryKey: ["limit-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("card_requests")
        .select(
          "id, reference_no, applicant_name, card_type, status, requested_limit, approved_limit, generated_card_number, updated_at",
        )
        .in("status", ["limit_pending_checker1", "limit_pending_checker2"])
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = data ?? [];

  return (
    <div>
      <PageHeader
        title="Limit control"
        description="Dual control: Checker-1 sets the card and cash limit, Checker-2 authorises it. The same officer cannot perform both steps."
      />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              {["Reference", "Applicant", "Card type", "Card number", "Requested", "Proposed", "Stage", "Updated", ""].map(
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
                <td colSpan={9} className="px-3 py-6 text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-muted-foreground">
                  No cases awaiting limit setup or authorisation.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-accent/40">
                <td className="whitespace-nowrap px-3 py-2.5 mono">{r.reference_no}</td>
                <td className="px-3 py-2.5 font-medium">{r.applicant_name}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{labelOf(CARD_TYPES, r.card_type)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 mono text-xs">
                  {r.generated_card_number ? maskCard(r.generated_card_number) : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                  {formatAmount(r.requested_limit)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                  {r.approved_limit ? formatAmount(r.approved_limit) : "—"}
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={r.status} />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                  {formatDateTime(r.updated_at)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <Link to="/requests/$id" params={{ id: r.id }}>
                    <Button size="sm" variant="outline">
                      Open
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}