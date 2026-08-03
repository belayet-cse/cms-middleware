import { createFileRoute } from "@tanstack/react-router";
import { useReducer, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { MaintenanceQueue } from "@/components/app/MaintenanceQueue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { FC_CATEGORIES, PAYMENT_INSTRUCTIONS, formatAmount, labelOf } from "@/lib/cms-constants";
import { createMaintenance, maintRows, seedMaintenance } from "@/lib/mock/maintenance";

export const Route = createFileRoute("/_authenticated/fc")({
  head: () => ({
    meta: [
      { title: "Foreign Currency Setup & Amendment — Card Middleware" },
      {
        name: "description",
        content:
          "Configure FC, ERQ and RFCD payment instructions, FC account validation, quota category and credit shield premium with maker-checker approval.",
      },
      { property: "og:title", content: "Foreign Currency Setup & Amendment" },
      { property: "og:description", content: "FC / ERQ / RFCD endorsement and credit shield setup for cards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FcSetup,
});

const SHIELD_RATE = 0.35;

function FcSetup() {
  const auth = useAuth();
  seedMaintenance();
  const [, refresh] = useReducer((x: number) => x + 1, 0);
  const cards = tableRows("cards").filter((c) => !c['is_deleted']);
  const [cardId, setCardId] = useState(String(cards[0]?.['id'] ?? ""));
  const [instruction, setInstruction] = useState("fc");
  const [category, setCategory] = useState("private_travel_quota");
  const [account, setAccount] = useState("0011340000998877");
  const [shield, setShield] = useState(true);
  const [note, setNote] = useState("");

  const card = cards.find((c) => c['id'] === cardId);
  const limit = Number(card?.['card_limit'] ?? 0);
  const premium = (limit * SHIELD_RATE) / 100;
  const accountValid = /^\d{13,17}$/.test(account);

  function submit() {
    if (!card) return;
    if (instruction !== "none" && !accountValid) {
      toast.error("FC account number must be 13–17 digits.");
      return;
    }
    if (!note.trim()) {
      toast.error("Reason detail is mandatory.");
      return;
    }
    createMaintenance({
      kind: "fc_amendment",
      subject: `${card['masked_number']} · ${card['embossing_name']}`,
      cardId: String(card['id']),
      summary: `FC endorsement — ${labelOf(PAYMENT_INSTRUCTIONS, instruction)} / ${labelOf(FC_CATEGORIES, category)}`,
      diffs: [
        { field: "Payment instruction", before: "none", after: instruction },
        { field: "FC category", before: "none", after: category },
        { field: "FC account no.", before: "—", after: account },
        { field: "Credit shield", before: String(!!card['credit_shield']), after: String(shield) },
      ],
      reasonCode: "FC_ENDORSEMENT",
      reasonNote: note.trim(),
    });
    toast.success("FC amendment submitted for checker review");
    setNote("");
    refresh();
  }

  return (
    <div>
      <PageHeader
        title="Foreign currency setup"
        description="FC / ERQ / RFCD endorsement, quota category and credit shield premium. Available inside the booking wizard and independently here as an FC amendment under maker-checker control."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">FC amendment</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Card</Label>
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
            <div className="space-y-1.5">
              <Label>Payment instruction type</Label>
              <Select value={instruction} onValueChange={setInstruction}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_INSTRUCTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category of FC</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FC_CATEGORIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>FC account number</Label>
              <Input value={account} onChange={(e) => setAccount(e.target.value)} className="mono" />
              {!accountValid && (
                <p className="text-[11px] text-destructive">Enter a 13–17 digit FC account number.</p>
              )}
            </div>
            <label className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2 sm:col-span-2">
              <span className="text-[13px] font-medium">Credit shield / premium charging</span>
              <Switch checked={shield} onCheckedChange={setShield} />
            </label>
            {shield && (
              <div className="rounded-md border bg-muted/30 p-3 text-[12px] sm:col-span-2">
                <p className="text-muted-foreground">Premium preview @ {SHIELD_RATE}% of outstanding limit</p>
                <p className="mt-1 font-semibold">
                  {formatAmount(limit)} → {formatAmount(premium)} per statement cycle
                </p>
              </div>
            )}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Reason detail</Label>
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Endorsement request reference, travel dates, Bangladesh Bank quota note…" />
            </div>
          </div>
          <Button className="mt-3" onClick={submit} disabled={!auth.canMake}>Submit for approval</Button>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold">FC amendment queue</h2>
          <MaintenanceQueue rows={maintRows()} kinds={["fc_amendment"]} onChange={refresh} emptyLabel="No FC amendments pending." />
        </section>
      </div>
    </div>
  );
}
