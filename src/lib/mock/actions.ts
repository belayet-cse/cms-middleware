/**
 * Prototype workflow actions. Pure client-side mutations against the in-memory
 * mock store — no server calls, no schema validation.
 */
import { MOCK_USER, tableRows, mockId } from "./db";
import type { Row } from "./data";

type Payload = Record<string, any>;

const nowIso = () => new Date().toISOString();

function bump(table: string, id: string, patch: Row) {
  const rows = tableRows(table);
  const index = rows.findIndex((r) => r['id'] === id);
  if (index === -1) return null;
  rows[index] = { ...rows[index], ...patch, updated_at: nowIso() };
  return rows[index]!;
}

function logApproval(requestId: string, entry: Row) {
  tableRows("request_approvals").push({
    id: mockId("a"),
    request_id: requestId,
    actor_id: MOCK_USER.id,
    created_at: nowIso(),
    ...entry,
  });
}

function logAudit(action: string, entityType: string, entityId: string, referenceNo: string | null, after: Row) {
  tableRows("audit_logs").unshift({
    id: mockId("l"),
    actor_id: MOCK_USER.id,
    actor_name: MOCK_USER.full_name,
    action,
    entity_type: entityType,
    entity_id: entityId,
    reference_no: referenceNo,
    before_data: null,
    after_data: after,
    changed_fields: Object.keys(after),
    ip_address: "10.20.4.19",
    created_at: nowIso(),
  });
}

function logIntegration(system: string, operation: string, requestId: string | null, extra?: Row) {
  tableRows("integration_logs").unshift({
    id: mockId("i"),
    system,
    direction: "outbound",
    operation,
    endpoint: system === "CBS" ? "/cbs/v1/customers" : "/tranzware/cards",
    request_id: requestId,
    http_status: 201,
    success: true,
    latency_ms: 180 + Math.floor(Math.random() * 700),
    request_payload: extra ?? null,
    response_payload: { simulated: true },
    error_message: null,
    created_at: nowIso(),
  });
}

function nextReference() {
  const seq = tableRows("card_requests").length + 148;
  return `CR-${new Date().getFullYear()}-${String(seq).padStart(7, "0")}`;
}

function luhnCardNumber(bin: string) {
  let base = bin.padEnd(15, "0").slice(0, 15);
  base = base.slice(0, 6) + String(Math.floor(Math.random() * 1e9)).padStart(9, "0");
  let sum = 0;
  base.split("").reverse().forEach((digit, i) => {
    let value = Number(digit);
    if (i % 2 === 0) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
  });
  return base + String((10 - (sum % 10)) % 10);
}

export async function createCardRequest({ data }: { data: { payload: Payload } }) {
  const row: Row = {
    id: mockId("q"),
    reference_no: nextReference(),
    status: "draft",
    maker_id: MOCK_USER.id,
    approved_limit: null,
    generated_card_number: null,
    generated_client_id: null,
    generated_cif: null,
    checker_id: null,
    checker_remarks: null,
    checked_at: null,
    limit_checker1_id: null,
    limit_checker1_at: null,
    limit_checker2_id: null,
    limit_checker2_at: null,
    submitted_at: null,
    bulk_batch_id: null,
    created_at: nowIso(),
    updated_at: nowIso(),
    ...data.payload,
  };
  tableRows("card_requests").unshift(row);
  logAudit("draft_created", "card_request", row['id'], row['reference_no'], { status: "draft" });
  return { id: row['id'] as string, reference_no: row['reference_no'] as string };
}

export async function updateCardRequest({ data }: { data: { id: string; payload: Payload } }) {
  const row = bump("card_requests", data.id, data.payload);
  logAudit("draft_updated", "card_request", data.id, (row?.['reference_no'] as string) ?? null, data.payload);
  return { id: data.id };
}

export async function submitCardRequest({ data }: { data: { id: string; remarks?: string } }) {
  const row = bump("card_requests", data.id, {
    status: "pending_checker",
    submitted_at: nowIso(),
    maker_remarks: data.remarks ?? null,
  });
  logApproval(data.id, {
    action: "submitted",
    actor_role: "maker",
    from_status: "draft",
    to_status: "pending_checker",
    remarks: data.remarks ?? null,
  });
  logAudit("submitted", "card_request", data.id, (row?.['reference_no'] as string) ?? null, { status: "pending_checker" });
  return { id: data.id, status: "pending_checker" };
}

export async function decideCardRequest({
  data,
}: {
  data: { id: string; decision: "approved" | "returned" | "rejected"; remarks?: string };
}) {
  const request = tableRows("card_requests").find((r) => r['id'] === data.id);
  const from = request?.['status'] as string | undefined;

  if (data.decision === "approved") {
    const cif = request?.['existing_cif'] || `CIF${String(400000 + Math.floor(Math.random() * 99999))}`;
    const clientId = request?.['generated_client_id'] || `CMS${String(1000 + Math.floor(Math.random() * 8999))}`;
    const row = bump("card_requests", data.id, {
      status: "limit_pending_checker1",
      checker_id: MOCK_USER.id,
      checker_remarks: data.remarks ?? null,
      checked_at: nowIso(),
      generated_cif: cif,
      generated_client_id: clientId,
    });
    logIntegration("CBS", "create_cif", data.id, { cif });
    logIntegration("CMS", "create_client", data.id, { client_id: clientId });
    logApproval(data.id, {
      action: "approved",
      actor_role: "checker1",
      from_status: from ?? null,
      to_status: "limit_pending_checker1",
      remarks: data.remarks ?? null,
    });
    logAudit("approved", "card_request", data.id, (row?.['reference_no'] as string) ?? null, {
      status: "limit_pending_checker1",
      generated_cif: cif,
    });
    return { id: data.id, status: "limit_pending_checker1" };
  }

  const row = bump("card_requests", data.id, {
    status: data.decision,
    checker_id: MOCK_USER.id,
    checker_remarks: data.remarks ?? null,
    checked_at: nowIso(),
  });
  logApproval(data.id, {
    action: data.decision,
    actor_role: "checker1",
    from_status: from ?? null,
    to_status: data.decision,
    remarks: data.remarks ?? null,
  });
  logAudit(data.decision, "card_request", data.id, (row?.['reference_no'] as string) ?? null, { status: data.decision });
  return { id: data.id, status: data.decision };
}

export async function setRequestLimit({
  data,
}: {
  data: { id: string; approvedLimit: number; cashLimitPercent: number; remarks?: string };
}) {
  const row = bump("card_requests", data.id, {
    status: "limit_pending_checker2",
    approved_limit: data.approvedLimit,
    limit_checker1_id: MOCK_USER.id,
    limit_checker1_at: nowIso(),
    checker_remarks: data.remarks ?? null,
  });
  logApproval(data.id, {
    action: "limit_set",
    actor_role: "checker1",
    from_status: "limit_pending_checker1",
    to_status: "limit_pending_checker2",
    remarks: data.remarks ?? `Limit proposed ${data.approvedLimit}`,
  });
  logAudit("limit_set", "card_request", data.id, (row?.['reference_no'] as string) ?? null, {
    approved_limit: data.approvedLimit,
    cash_limit_percent: data.cashLimitPercent,
  });
  return { id: data.id, status: "limit_pending_checker2" };
}

export async function approveRequestLimit({ data }: { data: { id: string; remarks?: string } }) {
  const request = tableRows("card_requests").find((r) => r['id'] === data.id);
  const product = tableRows("card_products").find((p) => p['id'] === request?.['product_id']);
  const cardNumber = luhnCardNumber(String(product?.['bin'] ?? "446789"));
  const limit = Number(request?.['approved_limit'] ?? 0);

  const row = bump("card_requests", data.id, {
    status: "completed",
    limit_checker2_id: MOCK_USER.id,
    limit_checker2_at: nowIso(),
    generated_card_number: cardNumber,
  });

  tableRows("cards").unshift({
    id: mockId("k"),
    card_number: cardNumber,
    masked_number: `${cardNumber.slice(0, 6)}******${cardNumber.slice(-4)}`,
    card_type: request?.['card_type'] ?? "primary_credit",
    status: "active",
    customer_id: request?.['customer_id'] ?? null,
    request_id: data.id,
    product_id: request?.['product_id'] ?? null,
    fee_profile_id: request?.['fee_profile_id'] ?? null,
    embossing_name: request?.['embossing_name'] ?? request?.['applicant_name'] ?? "",
    expiry_month: ((new Date().getMonth() + 1) % 12) + 1,
    expiry_year: new Date().getFullYear() + 4,
    card_limit: limit,
    cash_limit: Math.round(limit * 0.2),
    parent_card_id: request?.['primary_card_id'] ?? null,
    credit_shield: !!request?.['credit_shield'],
    cbs_sync: "synced",
    cms_sync: "synced",
    is_deleted: false,
    created_at: nowIso(),
    updated_at: nowIso(),
  });

  logIntegration("CMS", "issue_card", data.id, { card: cardNumber });
  logApproval(data.id, {
    action: "limit_approved",
    actor_role: "checker2",
    from_status: "limit_pending_checker2",
    to_status: "completed",
    remarks: data.remarks ?? "Final approval, card issued.",
  });
  logAudit("limit_approved", "card_request", data.id, (row?.['reference_no'] as string) ?? null, {
    status: "completed",
    generated_card_number: cardNumber,
  });
  return { id: data.id, status: "completed", cardNumber };
}

export async function changeCardStatusFn({
  data,
}: {
  data: { cardId: string; status: string; remarks?: string };
}) {
  const row = bump("cards", data.cardId, { status: data.status });
  logIntegration("CMS", "card_status", null, { card: row?.['masked_number'], status: data.status });
  logAudit("card_status_changed", "card", data.cardId, (row?.['masked_number'] as string) ?? null, {
    status: data.status,
    remarks: data.remarks ?? null,
  });
  return { id: data.cardId, status: data.status };
}

export async function setUserRolesFn({ data }: { data: { userId: string; roles: string[] } }) {
  const rows = tableRows("user_roles");
  const kept = rows.filter((r) => r['user_id'] !== data.userId);
  rows.length = 0;
  rows.push(...kept, ...data.roles.map((role) => ({ id: mockId("r"), user_id: data.userId, role, created_at: nowIso() })));
  logAudit("roles_updated", "profile", data.userId, null, { roles: data.roles });
  return { userId: data.userId, roles: data.roles };
}

export async function bulkUploadRequests({ data }: { data: { fileName: string; rows: Payload[] } }) {
  const total = data.rows.length;
  const rejected = data.rows.filter((r) => !r['applicant_name'] || !r['mobile']);
  const accepted = total - rejected.length;
  const batch: Row = {
    id: mockId("b"),
    file_name: data.fileName,
    total_rows: total,
    accepted_rows: accepted,
    rejected_rows: rejected.length,
    errors: rejected.length
      ? rejected.map((r, i) => ({ row: i + 1, message: `Missing applicant name or mobile for "${r['applicant_name'] ?? "—"}"` }))
      : null,
    uploaded_by: MOCK_USER.id,
    created_at: nowIso(),
  };
  tableRows("bulk_batches").unshift(batch);

  data.rows
    .filter((r) => r['applicant_name'] && r['mobile'])
    .forEach((r) => {
      tableRows("card_requests").unshift({
        id: mockId("q"),
        reference_no: nextReference(),
        request_type: r['request_type'] ?? "new_onboarding",
        card_type: r['card_type'] ?? "primary_credit",
        status: "pending_checker",
        applicant_name: r['applicant_name'],
        embossing_name: String(r['applicant_name'] ?? "").toUpperCase().slice(0, 26),
        mobile: r['mobile'],
        email: r['email'] ?? null,
        national_id: r['national_id'] ?? null,
        requested_limit: Number(r['requested_limit'] ?? 0),
        product_id: r['product_id'] ?? "p-1",
        fee_profile_id: r['fee_profile_id'] ?? "f-1",
        approved_limit: null,
        payment_instruction: "none",
        fc_category: "none",
        credit_shield: false,
        email_tagged: true,
        sms_tagged: true,
        use_existing_cif: false,
        maker_id: MOCK_USER.id,
        submitted_at: nowIso(),
        bulk_batch_id: batch['id'],
        created_at: nowIso(),
        updated_at: nowIso(),
      });
    });

  logAudit("bulk_upload", "bulk_batch", batch['id'], data.fileName, {
    total_rows: total,
    accepted_rows: accepted,
    rejected_rows: rejected.length,
  });
  return { batchId: batch['id'], total, accepted, rejected: rejected.length, errors: batch['errors'] };
}

export async function searchCbsCif({ data }: { data: { query: string } }) {
  const needle = data.query.trim().toLowerCase();
  const results = tableRows("customers")
    .filter(
      (c) =>
        !needle ||
        String(c['full_name'] ?? "").toLowerCase().includes(needle) ||
        String(c['cif_number'] ?? "").toLowerCase().includes(needle) ||
        String(c['mobile'] ?? "").includes(needle) ||
        String(c['national_id'] ?? "").includes(needle),
    )
    .map((c) => ({
      cif_number: c['cif_number'] ?? `CIF${String(400000 + Math.floor(Math.random() * 99999))}`,
      full_name: c['full_name'],
      mobile: c['mobile'],
      national_id: c['national_id'] ?? null,
    }));
  return { results };
}
