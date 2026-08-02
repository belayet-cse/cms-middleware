import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { nextReference, requireAnyRole, writeAudit, type Ctx } from "./workflow.server";

const EDITABLE_FIELDS = [
  "request_type",
  "card_type",
  "existing_cif",
  "use_existing_cif",
  "applicant_name",
  "embossing_name",
  "father_name",
  "mother_name",
  "date_of_birth",
  "national_id",
  "passport_no",
  "tin",
  "gender",
  "mobile",
  "email",
  "address_line1",
  "address_line2",
  "city",
  "postal_code",
  "primary_card_id",
  "company_name",
  "product_id",
  "fee_profile_id",
  "requested_limit",
  "payment_instruction",
  "fc_account_no",
  "fc_category",
  "credit_shield",
  "credit_shield_rate",
  "customer_id",
] as const;

function sanitize(payload: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in payload) {
      const value = payload[key];
      out[key] = value === "" ? null : value;
    }
  }
  return out;
}

export async function createDraftRequest(ctx: Ctx, payload: Record<string, unknown>) {
  await requireAnyRole(ctx, ["maker", "admin"]);
  const clean = sanitize(payload);
  if (!clean["applicant_name"] || !clean["mobile"]) {
    throw new Error("Applicant name and mobile number are mandatory");
  }
  const reference = await nextReference();
  const { data, error } = await supabaseAdmin
    .from("card_requests")
    .insert({
      ...clean,
      reference_no: reference,
      status: "draft",
      maker_id: ctx.userId,
    } as never)
    .select("id, reference_no")
    .single();
  if (error) throw new Error(error.message);
  await writeAudit({
    actorId: ctx.userId,
    action: "CREATE_REQUEST",
    entityType: "card_request",
    entityId: data.id,
    referenceNo: data.reference_no,
    after: clean,
  });
  return data;
}

export async function updateDraftRequest(
  ctx: Ctx,
  id: string,
  payload: Record<string, unknown>,
) {
  const roles = await requireAnyRole(ctx, ["maker", "admin"]);
  const { data: before, error: loadErr } = await supabaseAdmin
    .from("card_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (loadErr) throw new Error(loadErr.message);
  if (!before) throw new Error("Card request not found");
  if (!["draft", "returned"].includes(before.status)) {
    throw new Error("Only draft or returned requests can be edited");
  }
  if (before.maker_id !== ctx.userId && !roles.includes("admin")) {
    throw new Error("Only the originating maker can edit this request");
  }
  const clean = sanitize(payload);
  const { error } = await supabaseAdmin
    .from("card_requests")
    .update(clean as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
  await writeAudit({
    actorId: ctx.userId,
    action: "UPDATE_REQUEST",
    entityType: "card_request",
    entityId: id,
    referenceNo: before.reference_no,
    before: Object.fromEntries(Object.keys(clean).map((k) => [k, (before as never as Record<string, unknown>)[k]])),
    after: clean,
  });
  return { id };
}

/** CIF lookup — searches the middleware customer master, then CBS. */
export async function searchCif(ctx: Ctx, query: string) {
  await requireAnyRole(ctx, ["maker", "checker1", "checker2", "admin"]);
  const term = query.trim();
  const { data, error } = await supabaseAdmin
    .from("customers")
    .select("id, cif_number, cms_client_id, full_name, mobile, email, national_id, date_of_birth")
    .or(
      `cif_number.ilike.%${term}%,national_id.ilike.%${term}%,mobile.ilike.%${term}%,full_name.ilike.%${term}%`,
    )
    .limit(20);
  if (error) throw new Error(error.message);
  return data ?? [];
}