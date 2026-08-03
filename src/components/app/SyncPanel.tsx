import { Loader2, CheckCircle2, XCircle, CircleDashed, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SyncState } from "@/lib/mock/maintenance";

function Chip({ system, state }: { system: string; state: SyncState }) {
  const map: Record<SyncState, { cls: string; icon: typeof CheckCircle2; text: string }> = {
    idle: { cls: "status-neutral", icon: CircleDashed, text: "Not pushed" },
    syncing: { cls: "status-info", icon: Loader2, text: "Syncing…" },
    synced: { cls: "status-success", icon: CheckCircle2, text: "Synced" },
    failed: { cls: "status-danger", icon: XCircle, text: "Failed" },
  };
  const cfg = map[state];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium ${cfg.cls}`}
    >
      <Icon className={`size-3.5 ${state === "syncing" ? "animate-spin" : ""}`} />
      {system}: {cfg.text}
    </span>
  );
}

export function SyncPanel({
  cbs,
  cms,
  error,
  onRetry,
  busy,
}: {
  cbs: SyncState;
  cms: SyncState;
  error?: string | null;
  onRetry?: () => void;
  busy?: boolean;
}) {
  const failed = cbs === "failed" || cms === "failed";
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Chip system="CBS" state={cbs} />
        <Chip system="CMS" state={cms} />
        {failed && onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} disabled={busy}>
            <RefreshCw className={`mr-1.5 size-3.5 ${busy ? "animate-spin" : ""}`} /> Retry sync
          </Button>
        )}
      </div>
      {error && <p className="mt-2 text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
