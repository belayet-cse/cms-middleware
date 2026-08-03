import { createFileRoute } from "@tanstack/react-router";
import { useReducer, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { MaintenanceQueue } from "@/components/app/MaintenanceQueue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tableRows } from "@/lib/mock/db";
import { useAuth } from "@/hooks/useAuth";
import { createMaintenance, generateMaskedCard, maintRows, seedMaintenance } from "@/lib/mock/maintenance";

export const Route = createFileRoute("/_authenticated/servicing")({
  head: () => ({
    meta: [
      { title: "Card Servicing — Reissue, Replacement & Renewal" },
      {
        name: "description",
        content:
          "Unified card servicing for reissue, replacement and renewal with reason capture, automatic blocking of the old card and maker-checker controlled CBS/CMS sync.",
      },
      { property: "og:title", content: "Card Servicing — Reissue, Replacement & Renewal" },
      { property: "og:description", content: "Reissue, replace or renew cards under maker-checker control." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CardServicing,
});

const ACTIONS = [
  { value: "reissue", label: "Reissue — lost / stolen", risk: true, reasons: ["LOST_CARD", "STOLEN_CARD", "FRAUD_SUSPECTED"] },
  { value: "replacement", label: "Replacement — damaged", risk: false, reasons: ["DAMAGED", "CHIP_FAILURE", "EMBOSSING_ERROR"] },
  { value: "renewal", label: "Renewal — expiry", risk: false, reasons: ["EXPIRY_RENEWAL", "EARLY_RENEWAL"] },
] as const;

function CardServicing() {
  const auth = useAuth();
  seedMaintenance();
  const [, refresh] = useReducer((x: number) => x + 1, 0);
  const cards = tableRows("cards").filter((c) => !c['is_deleted']);
  const [cardId, setCardId] = useState(String(cards[0]?.['id'] ?? ""));
  const [action, setAction] = useState<string>("reissue");
  const meta = ACTIONS.find((a) => a.value === action)!;
  const [reason, setReason] = useState<string>(meta.reasons[0]);
  const [note, setNote] = useState("");

  const card = cards.find((c) => c['id'] === cardId);

  function submit() {
    if (!card) return;
    if (!note.trim()) {
      toast.error("Reason detail is mandatory for card servicing.");
      return;
    }
    const bin = String(card['masked_number'] ?? "446790").slice(0, 6);
    createMaintenance({
      kind: "servicing",
      subject: `${card['masked_number']} · ${card['embossing_name']}`,
      cardId: String(card['id']),
      summary: `${meta.label} — new plastic on approval`,
      diffs: [
        { field: "Servicing action", before: "—", after: action },
        { field: "Old card status", before: String(card['status']), after: "blocked" },
        { field: "New card number", before: "—", after: generateMaskedCard(bin) },
      ],
      reasonCode: reason,
      reasonNote: note.trim(),
      highRisk: meta.risk,
    });
    toast.success("Servicing request submitted for checker review");
    setNote("");
    refresh();
  }

  return (
    <div>
      <PageHeader
        title="Card servicing"
        description="Reissue, replacement and renewal follow the same maker-checker path as new issuance. The old plastic is auto-blocked and a fresh card number is generated only after final approval."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Raise a servicing request</h2>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Existing card</Label>
              <Select value={cardId} onValueChange={setCardId}>
                <SelectTrigger><SelectValue placeholder="Select card" /></SelectTrigger>
                <SelectContent>
                  {cards.map((c) => (
                    <SelectItem key={String(c['id'])} value={String(c['id'])}>
                      {String(c['masked_number'])} · {String(c['embossing_name'])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {ACTIONS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => { setAction(a.value); setReason(a.reasons[0]); }}
                  className={`rounded-md border p-3 text-left text-[12px] font-medium transition-colors ${
                    action === a.value ? "border-primary bg-primary/5" : "hover:bg-muted"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label>Reason code</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {meta.reasons.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reason detail</Label>
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="GD reference, branch confirmation, courier instruction…" />
            </div>

            <Button onClick={submit} disabled={!auth.canMake}>Submit for approval</Button>
            {!auth.canMake && (
              <p className="text-[12px] text-muted-foreground">Switch to the Maker role to raise a request.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold">Servicing queue</h2>
          <MaintenanceQueue rows={maintRows()} kinds={["servicing"]} onChange={refresh} emptyLabel="No servicing requests." />
        </section>
      </div>
    </div>
  );
}
