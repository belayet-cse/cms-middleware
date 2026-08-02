import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  amendCifInCbs,
  createCifInCbs,
  createClientInCms,
  issueCardInCms,
  setLimitInCms,
  syncToCbs,
  tagContactsInCms,
  updateCardStatusInCms,
} from "./gateway.server";

export type Ctx = { supabase: SupabaseClient<never, never, never>; userId: string };
type AnyClient = { from: (table: string) => any };

export type AppRole = "admin" | "maker" | "checker1" | "checker2" | "auditor";

export async function getRoles(ctx: Ctx): Promise<AppRole[]> {
  const { data, error } = await (ctx.supabase as unknown as AnyClient)
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { role: AppRole }) => r.role);
}

export async function requireAnyRole(ctx: Ctx, allowed: AppRole[]) {
  const roles = await getRoles(ctx);
  if (!roles.some((r) => allowed.includes(r))) {
    throw new Error(`Forbidden: requires one of ${allowed.join(", ")}`);
  }
  return roles;
}

export async function actorName(userId: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();
  return data?.full_name || data?.email || userId;
}

export async function writeAudit(input: {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  referenceNo?: string | null;
  before?: unknown;
  after?: unknown;
}) {
  const changed: string[] = [];
  if (input.before && input.after && typeof input.before === "object") {
    const b = input.before as Record<string, unknown>;
    const a = input.after as Record<string, unknown>;
    for (const key of Object.keys(a)) {
      if (JSON.stringify(b[key]) !== JSON.stringify(a[key])) changed.push(key);
    }
  }
  await supabaseAdmin.from("audit_logs").insert({
    actor_id: input.actorId,
    actor_name: await actorName(input.actorId),
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    reference_no: input.referenceNo ?? null,
    before_data: (input.before ?? null) as never,
    after_data: (input.after ?? null) as never,
    changed_fields: changed.length ? changed : null,
  });
}

async function logApproval(input: {
  requestId: string;
  action: string;
  actorId: string;
  actorRole: AppRole;
  from: string;
  to: string;
  remarks?: string | null;
}) {
  await supabaseAdmin.from("request_approvals").insert({
    request_id: input.requestId,
    action: input.action as never,
    actor_id: input.actorId,
    actor_role: input.actorRole as never,
    from_status: input.from as never,
    to_status: input.to as never,
    remarks: input.remarks ?? null,
  });
}

async function loadRequest(id: string) {
  const { data, error } = await supabaseAdmin
    .from("card_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Card request not found");
  return data as Record<string, any>;
}

function pickRole(roles: AppRole[], preferred: AppRole[]): AppRole {
  return preferred.find((r) => roles.includes(r)) ?? roles[0] ?? "maker";
}

/* ---------------------------------- maker --------------------------------- */

export async function submitRequest(ctx: Ctx, id: string, remarks?: string) {
  const roles = await requireAnyRole(ctx, ["maker", "admin"]);
  const req = await loadRequest(id);
  if (!["draft", "returned"].includes(req["status"])) {
    throw new Error("Only draft or returned requests can be submitted");
  }
  if (req["maker_id"] !== ctx.userId && !roles.includes("admin")) {
    throw new Error("Only the maker who created this request can submit it");
  }
  if (!req["product_id"] || !req["fee_profile_id"]) {
    throw new Error("Product type and fee profile must be selected before submission");
  }
  const { error } = await supabaseAdmin
    .from("card_requests")
    .update({
      status: "pending_checker",
      submitted_at: new Date().toISOString(),
      maker_remarks: remarks ?? req["maker_remarks"],
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await logApproval({
    requestId: id,
    action: "submitted",
    actorId: ctx.userId,
    actorRole: pickRole(roles, ["maker", "admin"]),
    from: req["status"],
    to: "pending_checker",
    remarks: remarks ?? null,
  });
  await writeAudit({
    actorId: ctx.userId,
    action: "SUBMIT_REQUEST",
    entityType: "card_request",
    entityId: id,
    referenceNo: req["reference_no"],
    before: { status: req["status"] },
    after: { status: "pending_checker" },
  });
  return { status: "pending_checker" };
}

/* --------------------------------- checker -------------------------------- */

export async function returnOrReject(
  ctx: Ctx,
  id: string,
  decision: "returned" | "rejected",
  remarks: string,
) {
  const roles = await requireAnyRole(ctx, ["checker1", "checker2", "admin"]);
  const req = await loadRequest(id);
  if (!["pending_checker", "limit_pending_checker1", "limit_pending_checker2"].includes(req["status"])) {
    throw new Error("This request is not awaiting a checker decision");
  }
  if (req["maker_id"] === ctx.userId && !roles.includes("admin")) {
    throw new Error("Segregation of duty: the maker cannot check their own request");
  }
  const { error } = await supabaseAdmin
    .from("card_requests")
    .update({
      status: decision,
      checker_id: ctx.userId,
      checker_remarks: remarks,
      checked_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await logApproval({
    requestId: id,
    action: decision === "returned" ? "returned" : "rejected",
    actorId: ctx.userId,
    actorRole: pickRole(roles, ["checker1", "checker2", "admin"]),
    from: req["status"],
    to: decision,
    remarks,
  });
  await writeAudit({
    actorId: ctx.userId,
    action: decision === "returned" ? "RETURN_REQUEST" : "REJECT_REQUEST",
    entityType: "card_request",
    entityId: id,
    referenceNo: req["reference_no"],
    before: { status: req["status"] },
    after: { status: decision, checker_remarks: remarks },
  });
  return { status: decision };
}

/**
 * Checker approval — orchestrates CIF creation (CBS), client creation (CMS),
 * card number generation and contact tagging, then hands over to limit setup.
 */
export async function approveRequest(ctx: Ctx, id: string, remarks?: string) {
  const roles = await requireAnyRole(ctx, ["checker1", "checker2", "admin"]);
  const req = await loadRequest(id);
  if (req["status"] !== "pending_checker") throw new Error("Request is not pending checker approval");
  if (req["maker_id"] === ctx.userId && !roles.includes("admin")) {
    throw new Error("Segregation of duty: the maker cannot approve their own request");
  }

  const customerPayload = {
    full_name: req["applicant_name"],
    father_name: req["father_name"],
    mother_name: req["mother_name"],
    date_of_birth: req["date_of_birth"],
    national_id: req["national_id"],
    passport_no: req["passport_no"],
    tin: req["tin"],
    gender: req["gender"],
    mobile: req["mobile"],
    email: req["email"],
    address_line1: req["address_line1"],
    address_line2: req["address_line2"],
    city: req["city"],
    postal_code: req["postal_code"],
  };

  const isMaintenance = ["card_delete", "contact_delete"].includes(req["request_type"]);

  // 1. CIF in CBS
  const cif: string = req["use_existing_cif"] && req["existing_cif"]
    ? await amendCifInCbs(req["existing_cif"], customerPayload, id)
    : await createCifInCbs(customerPayload, id);

  // 2. Client ID in CMS
  const clientId = await createClientInCms({ cif_number: cif, ...customerPayload }, id);

  // 3. Customer master record in the middleware
  const { data: existingCustomer } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("cif_number", cif)
    .maybeSingle();

  let customerId = existingCustomer?.id ?? req["customer_id"] ?? null;
  if (customerId) {
    await supabaseAdmin
      .from("customers")
      .update({
        ...customerPayload,
        cif_number: cif,
        cms_client_id: clientId,
        cbs_sync: "synced",
        cms_sync: "synced",
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", customerId);
  } else {
    const { data: inserted, error: custErr } = await supabaseAdmin
      .from("customers")
      .insert({
        ...customerPayload,
        cif_number: cif,
        cms_client_id: clientId,
        cbs_sync: "synced",
        cms_sync: "synced",
        last_synced_at: new Date().toISOString(),
        created_by: req["maker_id"],
      })
      .select("id")
      .single();
    if (custErr) throw new Error(custErr.message);
    customerId = inserted.id;
  }

  let cardNumber: string | null = null;
  let emailTagged = false;
  let smsTagged = false;

  if (!isMaintenance) {
    const { data: product } = await supabaseAdmin
      .from("card_products")
      .select("bin, product_code")
      .eq("id", req["product_id"])
      .maybeSingle();

    // 4. Card number generation in CMS
    const issued = await issueCardInCms(
      {
        bin: product?.bin ?? "446789",
        client_id: clientId,
        product_code: product?.product_code ?? "PCC-CLS",
        embossing_name: req["embossing_name"] || req["applicant_name"],
      },
      id,
    );
    cardNumber = issued.card_number;

    // 5. Email + mobile tagging
    const tagged = await tagContactsInCms(
      { card_number: cardNumber, email: req["email"], mobile: req["mobile"] },
      id,
    );
    emailTagged = tagged.email_tagged;
    smsTagged = tagged.sms_tagged;

    const masked = `${cardNumber.slice(0, 6)}${"*".repeat(cardNumber.length - 10)}${cardNumber.slice(-4)}`;
    const { error: cardErr } = await supabaseAdmin.from("cards").insert({
      card_number: cardNumber,
      masked_number: masked,
      card_type: req["card_type"],
      status: "requested",
      customer_id: customerId,
      request_id: id,
      product_id: req["product_id"],
      fee_profile_id: req["fee_profile_id"],
      embossing_name: req["embossing_name"] || req["applicant_name"],
      expiry_month: issued.expiry_month,
      expiry_year: issued.expiry_year,
      parent_card_id: req["primary_card_id"] ?? null,
      credit_shield: req["credit_shield"],
      cms_sync: "synced",
      cbs_sync: "pending",
    });
    if (cardErr) throw new Error(cardErr.message);
  }

  const nextStatus = isMaintenance ? "completed" : "limit_pending_checker1";

  const { error } = await supabaseAdmin
    .from("card_requests")
    .update({
      status: nextStatus,
      customer_id: customerId,
      generated_cif: cif,
      generated_client_id: clientId,
      generated_card_number: cardNumber,
      email_tagged: emailTagged,
      sms_tagged: smsTagged,
      checker_id: ctx.userId,
      checker_remarks: remarks ?? null,
      checked_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await logApproval({
    requestId: id,
    action: "approved",
    actorId: ctx.userId,
    actorRole: pickRole(roles, ["checker1", "checker2", "admin"]),
    from: "pending_checker",
    to: nextStatus,
    remarks: remarks ?? null,
  });
  await writeAudit({
    actorId: ctx.userId,
    action: "APPROVE_REQUEST",
    entityType: "card_request",
    entityId: id,
    referenceNo: req["reference_no"],
    before: { status: "pending_checker" },
    after: { status: nextStatus, cif, client_id: clientId, card_number: cardNumber },
  });

  return { status: nextStatus, cif, clientId, cardNumber };
}

/* ------------------------------ limit control ----------------------------- */

export async function setCardLimit(
  ctx: Ctx,
  id: string,
  approvedLimit: number,
  cashLimitPercent: number,
  remarks?: string,
) {
  const roles = await requireAnyRole(ctx, ["checker1", "admin"]);
  const req = await loadRequest(id);
  if (req["status"] !== "limit_pending_checker1") {
    throw new Error("Request is not awaiting Checker-1 limit setup");
  }
  const { data: product } = await supabaseAdmin
    .from("card_products")
    .select("min_limit, max_limit, product_name")
    .eq("id", req["product_id"])
    .maybeSingle();
  if (product && Number(product.max_limit) > 0 && approvedLimit > Number(product.max_limit)) {
    throw new Error(`Limit exceeds the maximum for ${product.product_name}`);
  }
  if (product && approvedLimit < Number(product.min_limit)) {
    throw new Error(`Limit is below the minimum for ${product.product_name}`);
  }

  const cashLimit = Math.round((approvedLimit * cashLimitPercent) / 100);
  await supabaseAdmin
    .from("cards")
    .update({ card_limit: approvedLimit, cash_limit: cashLimit })
    .eq("request_id", id);

  const { error } = await supabaseAdmin
    .from("card_requests")
    .update({
      status: "limit_pending_checker2",
      approved_limit: approvedLimit,
      limit_checker1_id: ctx.userId,
      limit_checker1_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await logApproval({
    requestId: id,
    action: "limit_set",
    actorId: ctx.userId,
    actorRole: pickRole(roles, ["checker1", "admin"]),
    from: "limit_pending_checker1",
    to: "limit_pending_checker2",
    remarks: remarks ?? `Limit proposed: ${approvedLimit}`,
  });
  await writeAudit({
    actorId: ctx.userId,
    action: "SET_CARD_LIMIT",
    entityType: "card_request",
    entityId: id,
    referenceNo: req["reference_no"],
    before: { approved_limit: req["approved_limit"] },
    after: { approved_limit: approvedLimit, cash_limit: cashLimit },
  });
  return { status: "limit_pending_checker2", approvedLimit, cashLimit };
}

export async function approveCardLimit(ctx: Ctx, id: string, remarks?: string) {
  const roles = await requireAnyRole(ctx, ["checker2", "admin"]);
  const req = await loadRequest(id);
  if (req["status"] !== "limit_pending_checker2") {
    throw new Error("Request is not awaiting Checker-2 limit approval");
  }
  if (req["limit_checker1_id"] === ctx.userId && !roles.includes("admin")) {
    throw new Error("Dual control: Checker-2 must be different from Checker-1");
  }

  const { data: card } = await supabaseAdmin
    .from("cards")
    .select("*")
    .eq("request_id", id)
    .maybeSingle();

  if (card) {
    await setLimitInCms(
      {
        card_number: card.card_number,
        card_limit: card.card_limit,
        cash_limit: card.cash_limit,
        credit_shield: req["credit_shield"],
        credit_shield_rate: req["credit_shield_rate"],
        payment_instruction: req["payment_instruction"],
        fc_account_no: req["fc_account_no"],
        fc_category: req["fc_category"],
      },
      id,
    );
    await updateCardStatusInCms({ card_number: card.card_number, status: "active" }, id);
    await syncToCbs(
      "syncCardToCbs",
      {
        cif_number: req["generated_cif"],
        client_id: req["generated_client_id"],
        card_number: card.card_number,
        card_limit: card.card_limit,
        card_type: req["card_type"],
      },
      id,
    );
    await supabaseAdmin
      .from("cards")
      .update({ status: "active", cbs_sync: "synced", cms_sync: "synced" })
      .eq("id", card.id);
  }

  const { error } = await supabaseAdmin
    .from("card_requests")
    .update({
      status: "completed",
      limit_checker2_id: ctx.userId,
      limit_checker2_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await logApproval({
    requestId: id,
    action: "limit_approved",
    actorId: ctx.userId,
    actorRole: pickRole(roles, ["checker2", "admin"]),
    from: "limit_pending_checker2",
    to: "completed",
    remarks: remarks ?? null,
  });
  await writeAudit({
    actorId: ctx.userId,
    action: "APPROVE_CARD_LIMIT",
    entityType: "card_request",
    entityId: id,
    referenceNo: req["reference_no"],
    before: { status: "limit_pending_checker2" },
    after: { status: "completed", approved_limit: req["approved_limit"] },
  });
  return { status: "completed" };
}

/* ----------------------------- card maintenance --------------------------- */

export async function changeCardStatus(
  ctx: Ctx,
  cardId: string,
  status: string,
  remarks?: string,
) {
  await requireAnyRole(ctx, ["checker1", "checker2", "admin"]);
  const { data: card, error: loadErr } = await supabaseAdmin
    .from("cards")
    .select("*")
    .eq("id", cardId)
    .maybeSingle();
  if (loadErr) throw new Error(loadErr.message);
  if (!card) throw new Error("Card not found");

  await updateCardStatusInCms({ card_number: card.card_number, status }, card.request_id);
  await supabaseAdmin
    .from("cards")
    .update({ status: status as never, is_deleted: status === "closed" ? true : card.is_deleted })
    .eq("id", cardId);
  await writeAudit({
    actorId: ctx.userId,
    action: "CHANGE_CARD_STATUS",
    entityType: "card",
    entityId: cardId,
    referenceNo: card.masked_number,
    before: { status: card.status },
    after: { status, remarks: remarks ?? null },
  });
  return { status };
}

/* ------------------------------- user admin ------------------------------- */

export async function setUserRoles(ctx: Ctx, targetUserId: string, roles: AppRole[]) {
  await requireAnyRole(ctx, ["admin"]);
  const { data: before } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", targetUserId);
  await supabaseAdmin.from("user_roles").delete().eq("user_id", targetUserId);
  if (roles.length) {
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert(roles.map((role) => ({ user_id: targetUserId, role: role as never })));
    if (error) throw new Error(error.message);
  }
  await writeAudit({
    actorId: ctx.userId,
    action: "SET_USER_ROLES",
    entityType: "user_roles",
    entityId: targetUserId,
    before: { roles: (before ?? []).map((r) => r.role) },
    after: { roles },
  });
  return { roles };
}

/* ------------------------------ bulk upload ------------------------------- */

export type BulkRow = {
  applicant_name: string;
  mobile: string;
  email?: string | null;
  national_id?: string | null;
  card_type: string;
  product_code: string;
  fee_profile_code: string;
  requested_limit?: number | null;
  existing_cif?: string | null;
};

export async function bulkCreateRequests(ctx: Ctx, fileName: string, rows: BulkRow[]) {
  await requireAnyRole(ctx, ["maker", "admin"]);
  const { data: products } = await supabaseAdmin.from("card_products").select("id, product_code");
  const { data: fees } = await supabaseAdmin.from("fee_profiles").select("id, profile_code");
  const productMap = new Map((products ?? []).map((p) => [p.product_code, p.id]));
  const feeMap = new Map((fees ?? []).map((f) => [f.profile_code, f.id]));

  const errors: { row: number; message: string }[] = [];
  const { data: batch, error: batchErr } = await supabaseAdmin
    .from("bulk_batches")
    .insert({ file_name: fileName, total_rows: rows.length, uploaded_by: ctx.userId })
    .select("id")
    .single();
  if (batchErr) throw new Error(batchErr.message);

  let accepted = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const productId = productMap.get(row.product_code);
    const feeId = feeMap.get(row.fee_profile_code);
    if (!row.applicant_name || !row.mobile) {
      errors.push({ row: i + 1, message: "Applicant name and mobile are mandatory" });
      continue;
    }
    if (!productId) {
      errors.push({ row: i + 1, message: `Unknown product code ${row.product_code}` });
      continue;
    }
    if (!feeId) {
      errors.push({ row: i + 1, message: `Unknown fee profile code ${row.fee_profile_code}` });
      continue;
    }
    const reference = await nextReference();
    const { error } = await supabaseAdmin.from("card_requests").insert({
      reference_no: reference,
      request_type: "new_onboarding",
      card_type: row.card_type as never,
      status: "draft",
      applicant_name: row.applicant_name,
      embossing_name: row.applicant_name.toUpperCase().slice(0, 26),
      mobile: row.mobile,
      email: row.email ?? null,
      national_id: row.national_id ?? null,
      existing_cif: row.existing_cif ?? null,
      use_existing_cif: Boolean(row.existing_cif),
      product_id: productId,
      fee_profile_id: feeId,
      requested_limit: row.requested_limit ?? 0,
      maker_id: ctx.userId,
      bulk_batch_id: batch.id,
    });
    if (error) errors.push({ row: i + 1, message: error.message });
    else accepted++;
  }

  await supabaseAdmin
    .from("bulk_batches")
    .update({
      accepted_rows: accepted,
      rejected_rows: errors.length,
      errors: (errors.length ? errors : null) as never,
    })
    .eq("id", batch.id);

  await writeAudit({
    actorId: ctx.userId,
    action: "BULK_UPLOAD",
    entityType: "bulk_batch",
    entityId: batch.id,
    referenceNo: fileName,
    after: { total: rows.length, accepted, rejected: errors.length },
  });

  return { batchId: batch.id, accepted, rejected: errors.length, errors };
}

export async function nextReference() {
  const { data, error } = await supabaseAdmin.rpc("next_card_request_reference" as never);
  if (!error && typeof data === "string") return data;
  return `CR-${new Date().getFullYear()}-${Date.now().toString().slice(-7)}`;
}