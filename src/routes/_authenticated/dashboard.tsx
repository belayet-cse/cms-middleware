import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/mock/db";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { CARD_TYPES, formatAmount, formatDateTime, labelOf } from "@/lib/cms-constants";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [requests, cards, customers, integration] = await Promise.all([
        supabase
          .from("card_requests")
          .select(
            "id, reference_no, applicant_name, card_type, status, requested_limit, approved_limit, created_at, updated_at",
          )
          .order("updated_at", { ascending: false })
          .limit(200),
        supabase.from("cards").select("id, status").eq("is_deleted", false),
        supabase.from("customers").select("id, cif_number, cms_client_id"),
        supabase
          .from("integration_logs")
          .select("id, system, operation, success, created_at, error_message")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);
      if (requests.error) throw requests.error;
      return {
        requests: requests.data ?? [],
        cards: cards.data ?? [],
        customers: customers.data ?? [],
        integration: integration.data ?? [],
      };
    },
  });
}

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="field-label">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Dashboard() {
  const { canMake, canCheck, profile } = useAuth();
  const { data, isLoading, error } = useDashboardData();

  const requests = data?.requests ?? [];
  const count = (s: string) => requests.filter((r) => r.status === s).length;
  const myQueue = requests.filter((r) =>
    canCheck
      ? ["pending_checker", "limit_pending_checker1", "limit_pending_checker2"].includes(r.status)
      : ["draft", "returned"].includes(r.status),
  );

  return (
    <div>
      <PageHeader
        title={`Welcome${profile?.['full_name'] ? `, ${profile['full_name'].split(" ")[0]}` : ""}`}
        description="Live position of card bookings, approvals and downstream synchronisation."
        actions={
          canMake ? (
            <Link to="/onboarding" search={{ draft: "" }}>
              <Button>New card booking</Button>
            </Link>
          ) : null
        }
      />

      {error && (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {(error as Error).message}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Pending checker" value={count("pending_checker")} hint="Awaiting verification" />
        <Kpi
          label="Limit setup"
          value={count("limit_pending_checker1") + count("limit_pending_checker2")}
          hint="Checker-1 & Checker-2 stages"
        />
        <Kpi label="Completed & synced" value={count("completed")} hint="Cards issued" />
        <Kpi
          label="Returned / rejected"
          value={count("returned") + count("rejected")}
          hint="Requires maker action"
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Kpi label="Active cards" value={(data?.cards ?? []).filter((c) => c.status === "active").length} />
        <Kpi label="Customer records" value={(data?.customers ?? []).length} />
        <Kpi
          label="CIF synced"
          value={(data?.customers ?? []).filter((c) => c.cif_number && c.cms_client_id).length}
          hint="Present in both CBS and CMS"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">
              {canCheck ? "Awaiting your action" : "Your drafts & returns"}
            </h2>
            <Link to="/requests" className="text-xs font-medium text-primary hover:underline">
              View all requests
            </Link>
          </div>
          {isLoading ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Loading…</p>
          ) : myQueue.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Nothing in your queue.</p>
          ) : (
            <div className="divide-y">
              {myQueue.slice(0, 8).map((r) => (
                <Link
                  key={r.id}
                  to="/requests/$id"
                  params={{ id: r.id }}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-accent/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.applicant_name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="mono">{r.reference_no}</span> ·{" "}
                      {labelOf(CARD_TYPES, r.card_type)} ·{" "}
                      {formatAmount(r.approved_limit ?? r.requested_limit)}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Integration activity</h2>
            <Link to="/integration" className="text-xs font-medium text-primary hover:underline">
              Monitor
            </Link>
          </div>
          {(data?.integration ?? []).length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">No calls recorded yet.</p>
          ) : (
            <ul className="divide-y">
              {(data?.integration ?? []).map((log) => (
                <li key={log.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide">{log.system}</p>
                    <span
                      className={`text-[11px] font-medium ${log.success ? "text-success" : "text-destructive"}`}
                    >
                      {log.success ? "Success" : "Failed"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{log.operation}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatDateTime(log.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}