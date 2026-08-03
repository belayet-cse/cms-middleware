/**
 * Maker-Checker engine for card maintenance modules (status change, servicing,
 * supplementary linkage, deletions, FC amendment). Pure in-memory prototype.
 */
import { tableRows, mockId } from "./db";
import { currentIdentity, IDENTITIES } from "@/lib/session-store";

export type MaintKind =
  | "status_change"
  | "servicing"
  | "supplementary"
  | "card_delete"
  | "contact_delete"
  | "fc_amendment";

export type MaintStatus =
  | "pending_checker1"
  | "pending_checker2"
  | "approved"
  | "rejected"
  | "returned";

export type SyncState = "idle" | "syncing" | "synced" | "failed";

export type FieldDiff = { field: string; before: string; after: string };

export type HistoryEntry = {
  at: string;
  actor: string;
  role: string;
  action: string;
  remarks: string;
};

export type MaintRequest = {
  id: string;
  reference_no: string;
  kind: MaintKind;
  subject: string;
  card_id: string | null;
  summary: string;
  diffs: FieldDiff[];
  reason_code: string;
  reason_note: string;
  requires_checker2: boolean;
  high_risk: boolean;
  status: MaintStatus;
  maker_id: string;
  maker_name: string;
  checker1_id: string | null;
  checker2_id: string | null;
  cbs_sync: SyncState;
  cms_sync: SyncState;
  sync_error: string | null;
  history: HistoryEntry[];
  created_at: string;
  updated_at: string;
};

export const KIND_LABEL: Record<MaintKind, string> = {
  status_change: "Card Status Change",
  servicing: "Card Servicing",
  supplementary: "Supplementary Linkage",
  card_delete: "Card Delete",
  contact_delete: "Contact Delete",
  fc_amendment: "FC Amendment",
};

export const MAINT_STATUS_LABEL: Record<MaintStatus, string> = {
  pending_checker1: "Pending Checker-1",
  pending_checker2: "Pending Checker-2",
  approved: "Approved & Synced",
  rejected: "Rejected",
  returned: "Sent Back to Maker",
};

const TABLE = "maintenance_requests";
const nowIso = () => new Date().toISOString();

export function maintRows(): MaintRequest[] {
  return tableRows(TABLE) as unknown as MaintRequest[];
}

function reference() {
  return `MN-${new Date().getFullYear()}-${String(maintRows().length + 5001)}`;
}

function audit(action: string, req: MaintRequest, remarks: string) {
  const actor = currentIdentity();
  tableRows("audit_logs").unshift({
    id: mockId("l"),
    actor_id: actor.id,
    actor_name: actor.name,
    action,
    entity_type: req.kind,
    entity_id: req.id,
    reference_no: req.reference_no,
    before_data: req.diffs.length ? Object.fromEntries(req.diffs.map((d) => [d.field, d.before])) : null,
    after_data: req.diffs.length ? Object.fromEntries(req.diffs.map((d) => [d.field, d.after])) : { remarks },
    changed_fields: req.diffs.map((d) => d.field),
    ip_address: "10.20.4.19",
    created_at: nowIso(),
  });
}

function integration(system: "CBS" | "CMS", req: MaintRequest, ok: boolean, message: string | null) {
  tableRows("integration_logs").unshift({
    id: mockId("i"),
    system,
    direction: "outbound",
    operation: req.kind,
    endpoint: system === "CBS" ? "/cbs/v1/customers/maintenance" : "/tranzware/cards/maintenance",
    request_id: req.id,
    http_status: ok ? 200 : 502,
    success: ok,
    latency_ms: 150 + Math.floor(Math.random() * 600),
    request_payload: { reference_no: req.reference_no, subject: req.subject },
    response_payload: ok ? { accepted: true } : null,
    error_message: ok ? null : message,
    created_at: nowIso(),
  });
}

export function createMaintenance(input: {
  kind: MaintKind;
  subject: string;
  cardId?: string | null;
  summary: string;
  diffs?: FieldDiff[];
  reasonCode: string;
  reasonNote?: string;
  highRisk?: boolean;
}): MaintRequest {
  const actor = currentIdentity();
  const req: MaintRequest = {
    id: mockId("mn"),
    reference_no: reference(),
    kind: input.kind,
    subject: input.subject,
    card_id: input.cardId ?? null,
    summary: input.summary,
    diffs: input.diffs ?? [],
    reason_code: input.reasonCode,
    reason_note: input.reasonNote ?? "",
    requires_checker2: !!input.highRisk,
    high_risk: !!input.highRisk,
    status: "pending_checker1",
    maker_id: actor.id,
    maker_name: actor.name,
    checker1_id: null,
    checker2_id: null,
    cbs_sync: "idle",
    cms_sync: "idle",
    sync_error: null,
    history: [
      { at: nowIso(), actor: actor.name, role: actor.role, action: "Submitted for review", remarks: input.reasonNote ?? "" },
    ],
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  maintRows().unshift(req);
  audit("maintenance_submitted", req, input.summary);
  return req;
}

function push(req: MaintRequest, action: string, remarks: string) {
  const actor = currentIdentity();
  req.history = [...req.history, { at: nowIso(), actor: actor.name, role: actor.role, action, remarks }];
  req.updated_at = nowIso();
}

export function decideMaintenance(
  id: string,
  decision: "approve" | "reject" | "return",
  remarks: string,
): MaintRequest | null {
  const req = maintRows().find((r) => r.id === id);
  if (!req) return null;
  const actor = currentIdentity();
  if (actor.id === req.maker_id) return req; // self-approval blocked

  if (decision !== "approve") {
    req.status = decision === "reject" ? "rejected" : "returned";
    push(req, decision === "reject" ? "Rejected" : "Sent back to maker", remarks);
    audit(`maintenance_${req.status}`, req, remarks);
    return req;
  }

  if (req.status === "pending_checker1") {
    req.checker1_id = actor.id;
    if (req.requires_checker2) {
      req.status = "pending_checker2";
      push(req, "Checker-1 approved", remarks);
      audit("maintenance_checker1_approved", req, remarks);
      return req;
    }
    req.status = "approved";
    push(req, "Checker-1 approved (final)", remarks);
  } else if (req.status === "pending_checker2") {
    if (req.checker1_id === actor.id) return req; // independent second approval required
    req.checker2_id = actor.id;
    req.status = "approved";
    push(req, "Checker-2 approved (final)", remarks);
  } else {
    return req;
  }

  audit("maintenance_approved", req, remarks);
  applyEffects(req);
  return req;
}

/** Applies the approved change to the mock card / customer records. */
function applyEffects(req: MaintRequest) {
  const cards = tableRows("cards");
  const card = cards.find((c) => c['id'] === req.card_id);
  if (!card) return;
  const after = (field: string) => req.diffs.find((d) => d.field === field)?.after;

  if (req.kind === "status_change") {
    const next = after("Card status");
    if (next) card['status'] = next;
  }
  if (req.kind === "card_delete") {
    card['is_deleted'] = true;
    card['status'] = "closed";
  }
  if (req.kind === "servicing") {
    card['status'] = "blocked";
    const newNumber = after("New card number");
    if (newNumber) {
      cards.unshift({
        ...card,
        id: mockId("k"),
        masked_number: newNumber,
        status: "active",
        is_deleted: false,
        created_at: nowIso(),
        updated_at: nowIso(),
      });
    }
  }
  if (req.kind === "supplementary") {
    const linkedNumber = after("Supplementary card");
    if (linkedNumber) {
      cards.unshift({
        ...card,
        id: mockId("k"),
        masked_number: linkedNumber,
        card_type: "supplementary_credit",
        embossing_name: after("Supplementary holder") ?? card['embossing_name'],
        card_limit: Number(after("Allocated limit") ?? 0),
        cash_limit: Math.round(Number(after("Allocated limit") ?? 0) * 0.2),
        parent_card_id: card['id'],
        status: "requested",
        is_deleted: false,
        created_at: nowIso(),
        updated_at: nowIso(),
      });
    }
  }
  card['updated_at'] = nowIso();
}

export function generateMaskedCard(bin = "446790") {
  const tail = String(Math.floor(1000 + Math.random() * 8999));
  return `${bin}******${tail}`;
}

/** Simulated real-time push to CBS and CMS with latency and optional failure. */
export async function syncMaintenance(id: string, opts?: { forceFail?: boolean }) {
  const req = maintRows().find((r) => r.id === id);
  if (!req) return null;
  req.cbs_sync = "syncing";
  req.cms_sync = "syncing";
  req.sync_error = null;
  await new Promise((r) => setTimeout(r, 700));
  const fail = opts?.forceFail ?? Math.random() < 0.18;
  req.cbs_sync = "synced";
  integration("CBS", req, true, null);
  await new Promise((r) => setTimeout(r, 500));
  if (fail) {
    req.cms_sync = "failed";
    req.sync_error = "CMS gateway timeout (Tranzware host 504). Change staged for retry.";
    integration("CMS", req, false, req.sync_error);
  } else {
    req.cms_sync = "synced";
    integration("CMS", req, true, null);
  }
  req.updated_at = nowIso();
  return req;
}

export function pendingFor(role: string): MaintRequest[] {
  const actorId = IDENTITIES[role as keyof typeof IDENTITIES]?.id;
  return maintRows().filter((r) => {
    if (r.status === "pending_checker1") return role === "checker1" || role === "admin";
    if (r.status === "pending_checker2") return (role === "checker2" || role === "admin") && r.checker1_id !== actorId;
    return false;
  });
}

/** Seed a couple of in-flight maintenance cases so queues are not empty. */
export function seedMaintenance() {
  if (maintRows().length) return;
  const base = Date.now();
  const at = (m: number) => new Date(base - m * 60_000).toISOString();
  maintRows().push(
    {
      id: "mn-seed-1",
      reference_no: "MN-2026-5001",
      kind: "status_change",
      subject: "446789******6677 · Shafiqul Alam",
      card_id: "k-3",
      summary: "Hotlisted → Blocked (temporary) pending police report",
      diffs: [{ field: "Card status", before: "hotlisted", after: "blocked" }],
      reason_code: "LOST_CARD_RECOVERED",
      reason_note: "Customer recovered the card; temporary block until branch verification.",
      requires_checker2: true,
      high_risk: true,
      status: "pending_checker2",
      maker_id: "u-0001",
      maker_name: "Tanvir Hasan",
      checker1_id: "u-0002",
      checker2_id: null,
      cbs_sync: "idle",
      cms_sync: "idle",
      sync_error: null,
      history: [
        { at: at(90), actor: "Tanvir Hasan", role: "maker", action: "Submitted for review", remarks: "Branch email attached." },
        { at: at(60), actor: "Nusrat Jahan", role: "checker1", action: "Checker-1 approved", remarks: "Verified with branch." },
      ],
      created_at: at(90),
      updated_at: at(60),
    },
    {
      id: "mn-seed-2",
      reference_no: "MN-2026-5002",
      kind: "fc_amendment",
      subject: "446790******4458 · Md. Arafat Rahman",
      card_id: "k-1",
      summary: "FC category changed to Private Travel Quota, credit shield enabled",
      diffs: [
        { field: "Payment instruction", before: "none", after: "fc" },
        { field: "FC category", before: "none", after: "private_travel_quota" },
        { field: "FC account no.", before: "—", after: "0011340000998877" },
      ],
      reason_code: "CUSTOMER_REQUEST",
      reason_note: "Travel quota endorsement requested at Gulshan branch.",
      requires_checker2: false,
      high_risk: false,
      status: "pending_checker1",
      maker_id: "u-0001",
      maker_name: "Tanvir Hasan",
      checker1_id: null,
      checker2_id: null,
      cbs_sync: "idle",
      cms_sync: "idle",
      sync_error: null,
      history: [
        { at: at(25), actor: "Tanvir Hasan", role: "maker", action: "Submitted for review", remarks: "Endorsement form scanned." },
      ],
      created_at: at(25),
      updated_at: at(25),
    },
    {
      id: "mn-seed-3",
      reference_no: "MN-2026-5003",
      kind: "servicing",
      subject: "446792******6677 · Farhana Akter",
      card_id: "k-5",
      summary: "Replacement issued for damaged card",
      diffs: [
        { field: "Servicing action", before: "—", after: "replacement" },
        { field: "New card number", before: "—", after: "446792******7311" },
      ],
      reason_code: "DAMAGED",
      reason_note: "Chip unreadable at POS.",
      requires_checker2: false,
      high_risk: false,
      status: "approved",
      maker_id: "u-0001",
      maker_name: "Tanvir Hasan",
      checker1_id: "u-0002",
      checker2_id: null,
      cbs_sync: "synced",
      cms_sync: "failed",
      sync_error: "CMS gateway timeout (Tranzware host 504). Change staged for retry.",
      history: [
        { at: at(240), actor: "Tanvir Hasan", role: "maker", action: "Submitted for review", remarks: "" },
        { at: at(210), actor: "Nusrat Jahan", role: "checker1", action: "Checker-1 approved (final)", remarks: "Damage confirmed." },
      ],
      created_at: at(240),
      updated_at: at(200),
    },
  );
}
