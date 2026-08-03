import { createFileRoute } from "@tanstack/react-router";
import { useReducer, useState } from "react";
import { toast } from "sonner";
import { AlertOctagon } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { MaintenanceQueue } from "@/components/app/MaintenanceQueue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { tableRows } from "@/lib/mock/db";
import { useAuth } from "@/hooks/useAuth";
import { createMaintenance, maintRows, seedMaintenance } from "@/lib/mock/maintenance";

export const Route = createFileRoute("/_authenticated/deletions")({
  head: () => ({
    meta: [
      { title: "Card & Contact Deletion — Card Middleware Console" },
      {
        name: "description",
        content:
          "Irreversible card deletion and email/mobile detagging with typed confirmation, mandatory reason and compulsory Checker-2 approval.",
      },
      { property: "og:title", content: "Card & Contact Deletion" },
      { property: "og:description", content: "High-risk deletions with typed confirmation and dual approval." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Deletions,
});

const CARD_REASONS = ["DUPLICATE_ISSUANCE", "WRONG_BOOKING", "CUSTOMER_REQUEST", "RELATIONSHIP_CLOSED"];
const CONTACT_REASONS = ["WRONG_NUMBER", "WRONG_EMAIL", "CUSTOMER_OPT_OUT", "BOUNCED_DELIVERY"];

function Deletions() {
  const auth = useAuth();
  seedMaintenance();
  const [, refresh] = useReducer((x: number) => x + 1, 0);
  const cards = tableRows("cards").filter((c) => !c['is_deleted']);
  const customers = tableRows("customers");

  const [cardId, setCardId] = useState(String(cards[0]?.['id'] ?? ""));
  const [cardReason, setCardReason] = useState(CARD_REASONS[0]!);
  const [cardNote, setCardNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const [customerId, setCustomerId] = useState(String(customers[0]?.['id'] ?? ""));
  const [channel, setChannel] = useState("email");
  const [contactReason, setContactReason] = useState(CONTACT_REASONS[0]!);
  const [contactNote, setContactNote] = useState("");

  const card = cards.find((c) => c['id'] === cardId);
  const last4 = String(card?.['masked_number'] ?? "").slice(-4);
  const customer = customers.find((c) => c['id'] === customerId);
  const contactValue = channel === "email" ? String(customer?.['email'] ?? "") : String(customer?.['mobile'] ?? "");

  function openConfirm() {
    if (!cardNote.trim()) {
      toast.error("Reason detail is mandatory for card deletion.");
      return;
    }
    setConfirmText("");
    setConfirmOpen(true);
  }

  function submitCardDelete() {
    if (!card) return;
    createMaintenance({
      kind: "card_delete",
      subject: `${card['masked_number']} · ${card['embossing_name']}`,
      cardId: String(card['id']),
      summary: `Permanent card deletion requested for ${card['masked_number']}`,
      diffs: [
        { field: "Card record", before: "active in CMS", after: "deleted / closed" },
        { field: "Card status", before: String(card['status']), after: "closed" },
      ],
      reasonCode: cardReason,
      reasonNote: cardNote.trim(),
      highRisk: true,
    });
    setConfirmOpen(false);
    setCardNote("");
    toast.success("Deletion submitted — Checker-1 and Checker-2 approvals required");
    refresh();
  }

  function submitContactDelete() {
    if (!customer) return;
    if (!contactNote.trim()) {
      toast.error("Reason detail is mandatory for contact detagging.");
      return;
    }
    createMaintenance({
      kind: "contact_delete",
      subject: `${customer['cif_number'] ?? "No CIF"} · ${customer['full_name']}`,
      cardId: null,
      summary: `${channel === "email" ? "Email" : "Mobile"} detagged for ${customer['full_name']}`,
      diffs: [
        { field: channel === "email" ? "Tagged email" : "Tagged mobile", before: contactValue || "—", after: "detagged" },
      ],
      reasonCode: contactReason,
      reasonNote: contactNote.trim(),
      highRisk: true,
    });
    setContactNote("");
    toast.success("Contact detag submitted for dual approval");
    refresh();
  }

  return (
    <div>
      <PageHeader
        title="Card & contact deletion"
        description="Irreversible operations. Both flows demand a typed confirmation or explicit reason, and both need Checker-1 plus an independent Checker-2 before anything is removed from CBS or CMS."
      />

      <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-[12px] text-destructive">
        <AlertOctagon className="mt-0.5 size-4 shrink-0" />
        Deletions cannot be undone once synchronised. Prefer a status change to Blocked or Closed where the relationship may resume.
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Tabs defaultValue="card">
          <TabsList>
            <TabsTrigger value="card">Card delete</TabsTrigger>
            <TabsTrigger value="contact">Contact delete</TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="mt-3 rounded-lg border bg-card p-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
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
                <Label>Reason code</Label>
                <Select value={cardReason} onValueChange={setCardReason}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CARD_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Reason detail</Label>
                <Textarea rows={3} value={cardNote} onChange={(e) => setCardNote(e.target.value)} />
              </div>
              <Button variant="destructive" onClick={openConfirm} disabled={!auth.canMake}>
                Delete card…
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="mt-3 rounded-lg border bg-card p-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={String(c['id'])} value={String(c['id'])}>
                        {String(c['full_name'])} · {String(c['cif_number'] ?? "No CIF")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Channel to detag</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email tagging</SelectItem>
                    <SelectItem value="mobile">Mobile number tagging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="mono rounded-md border bg-muted/30 px-3 py-2 text-[12px]">
                {contactValue || "No value tagged"}
              </p>
              <div className="space-y-1.5">
                <Label>Reason code</Label>
                <Select value={contactReason} onValueChange={setContactReason}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTACT_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Reason detail</Label>
                <Textarea rows={3} value={contactNote} onChange={(e) => setContactNote(e.target.value)} />
              </div>
              <Button variant="destructive" onClick={submitContactDelete} disabled={!auth.canMake}>
                Submit detag request
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <section>
          <h2 className="mb-3 text-sm font-semibold">Deletion queue</h2>
          <MaintenanceQueue
            rows={maintRows()}
            kinds={["card_delete", "contact_delete"]}
            onChange={refresh}
            emptyLabel="No deletion requests pending."
          />
        </section>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm irreversible card deletion</DialogTitle>
            <DialogDescription>
              Type the last 4 digits of {String(card?.['masked_number'] ?? "")} to confirm. The request still needs
              Checker-1 and Checker-2 approval before it reaches CBS and CMS.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={`Last 4 digits (${last4.length} characters)`}
            className="mono"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={confirmText !== last4} onClick={submitCardDelete}>
              Submit deletion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
