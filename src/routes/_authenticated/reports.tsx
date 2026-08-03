import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useReducer, useState } from "react";
import { toast } from "sonner";
import { Download, RefreshCw, Siren } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tableRows } from "@/lib/mock/db";
import { formatDateTime } from "@/lib/cms-constants";
import { maintRows, seedMaintenance, syncMaintenance } from "@/lib/mock/maintenance";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports, Monitoring & Alerts — Card Middleware Console" },
      {
        name: "description",
        content:
          "Compliance-ready reports on data changes, approvals and sync exceptions, plus a live monitoring feed of CBS and CMS integration failures with retry and escalation.",
      },
      { property: "og:title", content: "Reports, Monitoring & Alerts" },
      { property: "og:description", content: "Exportable audit reports and a live integration exception feed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reports,
});

const REPORTS = [
  { value: "data_changes", label: "Data change report" },
  { value: "approvals", label: "Approval & authorisation report" },
  { value: "exceptions", label: "Sync exception report" },
] as const;

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function Reports() {
  seedMaintenance();
  const [, refresh] = useReducer((x: number) => x + 1, 0);
  const [report, setReport] = useState<string>("data_changes");
  const [term, setTerm] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const rows = useMemo(() => {
    const needle = term.trim().toLowerCase();
    const audits = tableRows("audit_logs");
    const integrations = tableRows("integration_logs");
    let out: Record<string, unknown>[] = [];

    if (report === "data_changes") {
      out = audits.map((a) => ({
        timestamp: formatDateTime(String(a['created_at'])),
        user: String(a['actor_name'] ?? ""),
        module: String(a['entity_type'] ?? ""),
        action: String(a['action'] ?? ""),
        reference: String(a['reference_no'] ?? "—"),
        changed_fields: (a['changed_fields'] as string[] | null)?.join(" | ") ?? "",
        ip: String(a['ip_address'] ?? ""),
      }));
    } else if (report === "approvals") {
      out = maintRows().flatMap((r) =>
        r.history.map((h) => ({
          timestamp: formatDateTime(h.at),
          reference: r.reference_no,
          module: r.kind,
          action: h.action,
          user: h.actor,
          role: h.role,
          remarks: h.remarks,
        })),
      );
    } else {
      out = integrations
        .filter((i) => !i['success'])
        .map((i) => ({
          timestamp: formatDateTime(String(i['created_at'])),
          system: String(i['system'] ?? ""),
          operation: String(i['operation'] ?? ""),
          endpoint: String(i['endpoint'] ?? ""),
          http_status: String(i['http_status'] ?? ""),
          error: String(i['error_message'] ?? ""),
        }));
    }

    return needle
      ? out.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(needle)))
      : out;
  }, [report, term]);

  const alerts = maintRows().filter((r) => r.cbs_sync === "failed" || r.cms_sync === "failed");
  const headers = rows.length ? Object.keys(rows[0]!) : [];

  async function retry(id: string) {
    setBusy(id);
    await syncMaintenance(id, { forceFail: false });
    refresh();
    setBusy(null);
    toast.success("Retry completed — check the sync state");
  }

  return (
    <div>
      <PageHeader
        title="Reports, monitoring & alerts"
        description="Authorised compliance reports over every data change, approval decision and integration exception, with a live feed of CBS/CMS failures that can be retried or escalated."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => download(`${report}.csv`, toCsv(rows), "text/csv")}
              disabled={!rows.length}
            >
              <Download className="mr-1.5 size-3.5" /> Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                download(
                  `${report}.txt`,
                  rows.map((r) => Object.entries(r).map(([k, v]) => `${k}: ${v}`).join("\n")).join("\n\n"),
                  "text/plain",
                )
              }
              disabled={!rows.length}
            >
              <Download className="mr-1.5 size-3.5" /> Export print file
            </Button>
          </>
        }
      />

      <section className="mb-6 rounded-lg border border-warning/40 bg-warning/5 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Siren className="size-4" /> Monitoring & alerts
          <Badge variant="outline" className="status-warning text-[10px]">{alerts.length} open</Badge>
        </h2>
        {alerts.length ? (
          <ul className="mt-3 space-y-2">
            {alerts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card px-3 py-2">
                <div className="min-w-0">
                  <p className="mono text-[12px] font-semibold">{a.reference_no}</p>
                  <p className="text-[12px] text-muted-foreground">{a.sync_error ?? "Integration exception"}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => retry(a.id)} disabled={busy === a.id}>
                    <RefreshCw className={`mr-1.5 size-3.5 ${busy === a.id ? "animate-spin" : ""}`} /> Retry
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.success(`${a.reference_no} escalated to Card Systems support`)}
                  >
                    Escalate
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[12px] text-muted-foreground">No open integration exceptions.</p>
        )}
      </section>

      <div className="mb-3 flex flex-wrap gap-2">
        <Select value={report} onValueChange={setReport}>
          <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
          <SelectContent>
            {REPORTS.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Filter by user, module, reference…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-[12px]">
          <thead className="bg-muted/60 text-left">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-3 py-2 font-medium capitalize">{h.replace(/_/g, " ")}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.slice(0, 200).map((r, i) => (
                <tr key={i} className="border-t">
                  {headers.map((h) => (
                    <td key={h} className="px-3 py-2 align-top">{String(r[h] ?? "—")}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-6 text-center text-muted-foreground" colSpan={Math.max(1, headers.length)}>
                  No rows for this report.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
