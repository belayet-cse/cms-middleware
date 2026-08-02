import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/mock/db";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/cms-constants";

export const Route = createFileRoute("/_authenticated/integration")({
  component: IntegrationMonitor,
});

function IntegrationMonitor() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["integration-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = data ?? [];
  const failures = rows.filter((l) => !l.success).length;

  return (
    <div>
      <PageHeader
        title="Integration monitor"
        description="Every call between the middleware, Core Banking and the Tranzware Card Management System, with latency and failure detail."
        actions={
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["integration-logs"] })}
          >
            Refresh
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="field-label">Calls recorded</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{rows.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="field-label">Failures</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-destructive">{failures}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="field-label">Average latency</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {rows.length
              ? `${Math.round(rows.reduce((a, l) => a + (l.latency_ms ?? 0), 0) / rows.length)} ms`
              : "—"}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              {["When", "System", "Direction", "Operation", "Endpoint", "HTTP", "Latency", "Result"].map(
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
                  No integration calls recorded yet.
                </td>
              </tr>
            )}
            {rows.map((l) => (
              <tr key={l.id} className="hover:bg-accent/40">
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                  {formatDateTime(l.created_at)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-medium uppercase">{l.system}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs">{l.direction}</td>
                <td className="px-3 py-2.5">{l.operation}</td>
                <td className="px-3 py-2.5 mono text-xs text-muted-foreground">{l.endpoint ?? "—"}</td>
                <td className="px-3 py-2.5 tabular-nums">{l.http_status ?? "—"}</td>
                <td className="px-3 py-2.5 tabular-nums">{l.latency_ms ?? "—"}</td>
                <td className="px-3 py-2.5">
                  <Badge variant="outline" className={l.success ? "status-success" : "status-danger"}>
                    {l.success ? "Success" : (l.error_message ?? "Failed")}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}