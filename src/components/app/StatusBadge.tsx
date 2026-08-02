import { Badge } from "@/components/ui/badge";
import { REQUEST_STATUS_LABEL, CARD_STATUS_LABEL } from "@/lib/cms-constants";

const TONE: Record<string, string> = {
  draft: "status-neutral",
  pending_checker: "status-warning",
  returned: "status-warning",
  rejected: "status-danger",
  approved: "status-info",
  limit_pending_checker1: "status-info",
  limit_pending_checker2: "status-info",
  completed: "status-success",
  requested: "status-neutral",
  active: "status-success",
  inactive: "status-neutral",
  blocked: "status-danger",
  hotlisted: "status-danger",
  closed: "status-neutral",
  expired: "status-neutral",
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  const label = REQUEST_STATUS_LABEL[status] ?? CARD_STATUS_LABEL[status] ?? status;
  return (
    <Badge variant="outline" className={`whitespace-nowrap text-[11px] ${TONE[status] ?? ""}`}>
      {label}
    </Badge>
  );
}