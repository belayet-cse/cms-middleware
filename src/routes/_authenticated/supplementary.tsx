import { createFileRoute } from "@tanstack/react-router";
import { useReducer, useState } from "react";
import { toast } from "sonner";
import { Link2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { MaintenanceQueue } from "@/components/app/MaintenanceQueue";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { formatAmount } from "@/lib/cms-constants";
import { createMaintenance, generateMaskedCard, maintRows, seedMaintenance } from "@/lib/mock/maintenance";

export const Route = createFileRoute("/_authenticated/supplementary")({
  head: () => ({
    meta: [
      { title: "Supplementary Card Linkage — Card Middleware Console" },
      {
        name: "description",
        content:
          "Attach supplementary cards to a primary card, allocate shared or single limits and visualise the primary-to-supplementary linkage.",
      },
      { property: "og:title", content: "Supplementary Card Linkage" },
      { property: "og:description", content: "Link supplementary cards and allocate limits under dual control." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupplementaryLinkage,
});

function SupplementaryLinkage() {
  const auth = useAuth();
  seedMaintenance();
  const [, refresh] = useReducer((x: number) => x + 1, 0);
  const cards = tableRows("cards").filter((c) => !c['is_deleted']);
  const primaries = cards.filter((c) => c['card_type'] === "primary_credit" || c['card_type'] === "business");
  const [primaryId, setPrimaryId] = useState(String(primaries[0]?.['id'] ?? ""));
  const [holderType, setHolderType] = useState("existing_cif");
  const [holderName, setHolderName] = useState("SUMAIYA RAHMAN");
  const [nid, setNid] = useState("1996774411223");
  const [limitType, setLimitType] = useState("combined");
  const [allocated, setAllocated] = useState("75000");
  const [note, setNote] = useState("");

  const primary = primaries.find((c) => c['id'] === primaryId);
  const supplementaries = cards.filter((c) => c['parent_card_id'] === primaryId);
  const primaryLimit = Number(primary?.['card_limit'] ?? 0);
  const usedByChildren = supplementaries.reduce((s, c) => s + Number(c['card_limit'] ?? 0), 0);
  const requested = Number(allocated || 0);
  const share = primaryLimit ? Math.min(100, ((usedByChildren + requested) / primaryLimit) * 100) : 0;

  function submit() {
    if (!primary) return;
    if (!holderName.trim() || !note.trim()) {
      toast.error("Holder name and reason detail are mandatory.");
      return;
    }
    if (limitType === "combined" && usedByChildren + requested > primaryLimit) {
      toast.error("Combined allocation exceeds the primary card limit.");
      return;
    }
    createMaintenance({
      kind: "supplementary",
      subject: `Primary ${primary['masked_number']} · ${primary['embossing_name']}`,
      cardId: String(primary['id']),
      summary: `Supplementary card for ${holderName.trim()} linked to primary ${primary['masked_number']}`,
      diffs: [
        { field: "Supplementary holder", before: "—", after: holderName.trim().toUpperCase() },
        { field: "Holder identity", before: "—", after: holderType === "existing_cif" ? `Existing CIF · NID ${nid}` : `New individual (no independent CIF) · NID ${nid}` },
        { field: "Limit type", before: "—", after: limitType },
        { field: "Allocated limit", before: "0", after: String(requested) },
        { field: "Supplementary card", before: "—", after: generateMaskedCard("512345") },
      ],
      reasonCode: "SUPPLEMENTARY_REQUEST",
      reasonNote: note.trim(),
      highRisk: true,
    });
    toast.success("Supplementary linkage submitted — Checker-1 then Checker-2");
    setNote("");
    refresh();
  }

  return (
    <div>
      <PageHeader
        title="Supplementary card creation & linkage"
        description="Attach one or more supplementary cards to a primary card. Limits can be combined with the primary limit or set as an independent single limit; both routes need Checker-1 and Checker-2."
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Supplementary holder</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Primary card / client</Label>
              <Select value={primaryId} onValueChange={setPrimaryId}>
                <SelectTrigger><SelectValue placeholder="Select primary card" /></SelectTrigger>
                <SelectContent>
                  {primaries.map((c) => (
                    <SelectItem key={String(c['id'])} value={String(c['id'])}>
                      {String(c['masked_number'])} · {String(c['embossing_name'])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Holder identity</Label>
              <Select value={holderType} onValueChange={setHolderType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="existing_cif">Existing CIF holder</SelectItem>
                  <SelectItem value="no_cif">New individual, no independent CIF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Name on card</Label>
              <Input value={holderName} onChange={(e) => setHolderName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>NID / Passport</Label>
              <Input value={nid} onChange={(e) => setNid(e.target.value)} className="mono" />
            </div>
            <div className="space-y-1.5">
              <Label>Limit type</Label>
              <Select value={limitType} onValueChange={setLimitType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="combined">Combined with primary limit</SelectItem>
                  <SelectItem value="single">Single (independent) limit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Allocated limit (BDT)</Label>
              <Input type="number" value={allocated} onChange={(e) => setAllocated(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Reason detail</Label>
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Relationship to primary holder, request reference…" />
            </div>
          </div>
          <Button className="mt-3" onClick={submit} disabled={!auth.canMake}>Submit for approval</Button>
        </section>

        <section className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Linkage map</h2>
            {primary ? (
              <>
                <div className="rounded-md border border-primary/40 bg-primary/5 p-3">
                  <p className="mono text-[12px] font-semibold">{String(primary['masked_number'])}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {String(primary['embossing_name'])} · Primary · {formatAmount(primaryLimit)}
                  </p>
                </div>
                <div className="mt-3 space-y-2 border-l pl-4">
                  {supplementaries.length ? (
                    supplementaries.map((s) => (
                      <div key={String(s['id'])} className="relative rounded-md border bg-muted/30 p-3">
                        <Link2 className="absolute -left-[26px] top-4 size-3.5 text-muted-foreground" />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="mono text-[12px]">{String(s['masked_number'])}</span>
                          <StatusBadge status={String(s['status'])} />
                        </div>
                        <p className="text-[12px] text-muted-foreground">
                          {String(s['embossing_name'])} · {formatAmount(Number(s['card_limit'] ?? 0))}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[12px] text-muted-foreground">No supplementary cards linked yet.</p>
                  )}
                </div>
                <div className="mt-4">
                  <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                    Limit allocation (primary vs supplementary)
                  </p>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary transition-all" style={{ width: `${share}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatAmount(usedByChildren + requested)} of {formatAmount(primaryLimit)} allocated to supplementary cards
                  </p>
                </div>
              </>
            ) : (
              <p className="text-[12px] text-muted-foreground">Select a primary card.</p>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold">Linkage queue</h2>
            <MaintenanceQueue rows={maintRows()} kinds={["supplementary"]} onChange={refresh} emptyLabel="No supplementary requests pending." />
          </div>
        </section>
      </div>
    </div>
  );
}
