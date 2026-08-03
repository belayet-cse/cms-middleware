import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ShieldAlert, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SyncPanel } from "@/components/app/SyncPanel";
import { useAuth } from "@/hooks/useAuth";
import { formatDateTime } from "@/lib/cms-constants";
import {
  KIND_LABEL,
  MAINT_STATUS_LABEL,
  decideMaintenance,
  syncMaintenance,
  type MaintKind,
  type MaintRequest,
} from "@/lib/mock/maintenance";

const TONE: Record<string, string> = {
  pending_checker1: "status-warning",
  pending_checker2: "status-info",
  approved: "status-success",
  rejected: "status-danger",
  returned: "status-warning",
};

export function MaintenanceQueue({
  rows,
  onChange,
  kinds,
  emptyLabel = "No maintenance requests in this queue.",
}: {
  rows: MaintRequest[];
  onChange: () => void;
  kinds?: MaintKind[];
  emptyLabel?: string;
}) {
  const list = kinds ? rows.filter((r) => kinds.includes(r.kind)) : rows;
  if (!list.length) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {list.map((req) => (
        <MaintenanceCard key={req.id} req={req} onChange={onChange} />
      ))}
    </div>
  );
}

export function MaintenanceCard({ req, onChange }: { req: MaintRequest; onChange: () => void }) {
  const auth = useAuth();
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const isOwnSubmission = auth.identity.id === req.maker_id;
  const alreadyChecker1 = req.checker1_id === auth.identity.id;
  const pending = req.status === "pending_checker1" || req.status === "pending_checker2";
  const stageAllowed =
    req.status === "pending_checker1"
      ? auth.isChecker1 || auth.isAdmin
      : req.status === "pending_checker2"
        ? auth.isChecker2 || auth.isAdmin
        : false;
  const blockedReason = isOwnSubmission
    ? "You submitted this request — a maker can never approve their own work."
    : req.status === "pending_checker2" && alreadyChecker1
      ? "You gave the Checker-1 approval; Checker-2 must be an independent user."
      : !stageAllowed
        ? `Only ${req.status === "pending_checker1" ? "Checker-1" : "Checker-2"} can act at this stage.`
        : null;

  async function decide(decision: "approve" | "reject" | "return") {
    if (decision !== "approve" && !remarks.trim()) {
      toast.error("A reason is mandatory when rejecting or sending back.");
      return;
    }
    setBusy(true);
    const updated = decideMaintenance(req.id, decision, remarks.trim());
    onChange();
    if (updated?.status === "approved") {
      toast.success(`${req.reference_no} approved — pushing to CBS and CMS`);
      await syncMaintenance(req.id);
      onChange();
      const after = req.cms_sync;
      if (after === "failed") toast.error("CMS sync failed — retry available");
      else toast.success("CBS and CMS synchronised");
    } else if (decision === "approve") {
      toast.success(`${req.reference_no} approved — awaiting Checker-2`);
    } else {
      toast.success(`${req.reference_no} ${decision === "reject" ? "rejected" : "sent back to maker"}`);
    }
    setRemarks("");
    setBusy(false);
  }

  async function retry(forceFail = false) {
    setBusy(true);
    await syncMaintenance(req.id, { forceFail });
    onChange();
    setBusy(false);
  }

  return (
    <article
      className={`rounded-lg border bg-card p-4 ${req.high_risk ? "border-destructive/40" : ""}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono text-[12px] font-semibold">{req.reference_no}</span>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
              {KIND_LABEL[req.kind]}
            </Badge>
            <Badge variant="outline" className={`text-[11px] ${TONE[req.status] ?? ""}`}>
              {MAINT_STATUS_LABEL[req.status]}
            </Badge>
            {req.high_risk && (
              <Badge variant="outline" className="status-danger text-[10px] uppercase tracking-wide">
                <ShieldAlert className="mr-1 size-3" /> Dual approval
              </Badge>
            )}
          </div>
          <p className="mt-1.5 text-sm font-medium">{req.summary}</p>
          <p className="mono text-[11px] text-muted-foreground">{req.subject}</p>
        </div>
        <div className="text-right text-[11px] text-muted-foreground">
          <p>Maker: {req.maker_name}</p>
          <p className="inline-flex items-center gap-1">
            <Clock className="size-3" /> {formatDateTime(req.created_at)}
          </p>
        </div>
      </header>

      {req.diffs.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-md border">
          <table className="w-full text-[12px]">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-3 py-1.5 font-medium">Field</th>
                <th className="px-3 py-1.5 font-medium">Current value</th>
                <th className="px-3 py-1.5 font-medium">Requested value</th>
              </tr>
            </thead>
            <tbody>
              {req.diffs.map((d) => (
                <tr key={d.field} className="border-t">
                  <td className="px-3 py-1.5">{d.field}</td>
                  <td className="px-3 py-1.5 text-muted-foreground line-through">{d.before}</td>
                  <td className="px-3 py-1.5 font-semibold text-primary">{d.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-[12px] text-muted-foreground">
        Reason: <span className="mono">{req.reason_code}</span>
        {req.reason_note ? ` — ${req.reason_note}` : ""}
      </p>

      {req.status === "approved" && (
        <div className="mt-3">
          <SyncPanel
            cbs={req.cbs_sync}
            cms={req.cms_sync}
            error={req.sync_error}
            busy={busy}
            onRetry={() => retry(false)}
          />
        </div>
      )}

      {pending && (
        <div className="mt-3 space-y-2 border-t pt-3">
          {blockedReason && (
            <p className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[12px]">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              {blockedReason}
            </p>
          )}
          <Textarea
            placeholder="Checker remarks (mandatory for reject / send back)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            disabled={!!blockedReason}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={!!blockedReason || busy} onClick={() => decide("approve")}>
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!!blockedReason || busy}
              onClick={() => decide("return")}
            >
              Send back to maker
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={!!blockedReason || busy}
              onClick={() => decide("reject")}
            >
              Reject
            </Button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 text-[11px] font-medium text-primary underline-offset-2 hover:underline"
      >
        {open ? "Hide" : "Show"} audit trail ({req.history.length})
      </button>
      {open && (
        <ol className="mt-2 space-y-2 border-l pl-4">
          {req.history.map((h, i) => (
            <li key={i} className="relative text-[12px]">
              <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" />
              <p className="font-medium">{h.action}</p>
              <p className="text-muted-foreground">
                {h.actor} · {h.role} · {formatDateTime(h.at)}
                {h.remarks ? ` — ${h.remarks}` : ""}
              </p>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
