import { createFileRoute } from "@tanstack/react-router";
import { useReducer, useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { MaintenanceQueue } from "@/components/app/MaintenanceQueue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tableRows } from "@/lib/mock/db";
import { CARD_STATUS_LABEL } from "@/lib/cms-constants";
import { createMaintenance, maintRows, seedMaintenance } from "@/lib/mock/maintenance";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/status")({
  head: () => ({
    meta: [
      { title: "Card Status Management — Card Middleware Console" },
      {
        name: "description",
        content:
          "Change card status with validated state transitions, mandatory reason codes and dual checker approval for hotlist and closure.",
      },
      { property: "og:title", content: "Card Status Management" },
      { property: "og:description", content: "Validated card status transitions with maker-checker control." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CardStatusManagement,
});

const TRANSITIONS: Record<string, string[]> = {
  requested: ["active", "closed"],
  active: ["blocked", "hotlisted", "dormant", "closed"],
  blocked: ["active", "hotlisted", "closed"],
  dormant: ["active", "closed"],
  hotlisted: ["blocked", "closed"],
  inactive: ["active", "closed"],
  closed: [],
  expired: ["closed"],
};

const HIGH_RISK = ["hotlisted", "closed"];

const REASONS = [
  "CUSTOMER_REQUEST",
  "LOST_CARD",
  "STOLEN_CARD",
  "LOST_CARD_RECOVERED",
  "FRAUD_SUSPECTED",
  "DELINQUENCY",
  "RELATIONSHIP_CLOSED",
  "DORMANCY",
];

const LABEL = { ...CARD_STATUS_LABEL, dormant: "Dormant" } as Record<string, string>;

function CardStatusManagement() {
  const auth = useAuth();
  seedMaintenance();
  const [, refresh] = useReducer((x: number) => x + 1, 0);
  const cards = tableRows("cards").filter((c) => !c['is_deleted']);
  const [cardId, setCardId] = useState(String(cards[0]?.['id'] ?? ""));
  const [next, setNext] = useState("");
  const [reason, setReason] = useState(REASONS[0]!);
  const [note, setNote] = useState("");

  const card = cards.find((c) => c['id'] === cardId);
  const current = String(card?.['status'] ?? "active");
  const allowed = TRANSITIONS[current] ?? [];
  const highRisk = HIGH_RISK.includes(next);

  function submit() {
    if (!card || !next) {
      toast.error("Select a card and a target status.");
      return;
    }
    if (!note.trim()) {
      toast.error("Free-text reason detail is mandatory.");
      return;
    }
    createMaintenance({
      kind: "status_change",
      subject: `${card['masked_number']} · ${card['embossing_name']}`,
      cardId: String(card['id']),
      summary: `${LABEL[current] ?? current} → ${LABEL[next] ?? next}`,
      diffs: [{ field: "Card status", before: current, after: next }],
      reasonCode: reason,
      reasonNote: note.trim(),
      highRisk,
    });
    toast.success("Status change submitted for checker review");
    setNext("");
    setNote("");
    refresh();
  }

  return (
    <div>
      <PageHeader
        title="Card status management"
        description="Only valid state transitions are offered. Hotlist and closure are high-risk and require an independent Checker-2 approval before the status is pushed to CBS and CMS."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Request a status change</h2>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Card</Label>
              <Select value={cardId} onValueChange={(v) => { setCardId(v); setNext(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select card" />
                </SelectTrigger>
                <SelectContent>
                  {cards.map((c) => (
                    <SelectItem key={String(c['id'])} value={String(c['id'])}>
                      {String(c['masked_number'])} · {String(c['embossing_name'])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Allowed transitions from {LABEL[current] ?? current}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[11px]">{LABEL[current] ?? current}</Badge>
                <ArrowRight className="size-3.5 text-muted-foreground" />
                {allowed.length ? (
                  allowed.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNext(s)}
                      className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                        next === s ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                      } ${HIGH_RISK.includes(s) ? "text-destructive" : ""}`}
                    >
                      {LABEL[s] ?? s}
                    </button>
                  ))
                ) : (
                  <span className="text-[12px] text-muted-foreground">Terminal state — no changes allowed.</span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Reason code</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reason detail</Label>
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Describe the instruction, document reference, branch, etc." />
            </div>

            {highRisk && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                High-risk transition — Checker-1 and an independent Checker-2 approval are both mandatory.
              </p>
            )}

            <Button onClick={submit} disabled={!auth.canMake || !next}>
              Submit for approval
            </Button>
            {!auth.canMake && (
              <p className="text-[12px] text-muted-foreground">
                Switch the active role to Maker in the top bar to raise a request.
              </p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold">Status change queue</h2>
          <MaintenanceQueue
            rows={maintRows()}
            kinds={["status_change"]}
            onChange={refresh}
            emptyLabel="No status changes awaiting review."
          />
        </section>
      </div>
    </div>
  );
}
