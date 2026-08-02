/**
 * Tranzware CMS / CBS gateway adapter.
 *
 * The real Tranzware CMS + CBS endpoints are not wired yet, so every call runs
 * in simulation mode with the exact request/response envelope the live service
 * will use. Set CMS_BASE_URL / CBS_BASE_URL (plus CMS_API_KEY) to switch to
 * live calls — nothing else in the middleware changes.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type GatewaySystem = "CMS" | "CBS";

type CallOptions = {
  system: GatewaySystem;
  operation: string;
  path: string;
  payload: Record<string, unknown>;
  requestId?: string | null;
  simulate: () => Record<string, unknown>;
};

function baseUrl(system: GatewaySystem) {
  return system === "CMS" ? process.env["CMS_BASE_URL"] : process.env["CBS_BASE_URL"];
}

export function isLiveMode(system: GatewaySystem) {
  return Boolean(baseUrl(system));
}

async function call<T extends Record<string, unknown>>(opts: CallOptions): Promise<T> {
  const started = Date.now();
  const root = baseUrl(opts.system);
  const endpoint = root ? `${root.replace(/\/$/, "")}${opts.path}` : `simulated:${opts.path}`;
  let response: Record<string, unknown>;
  let httpStatus = 200;
  let success = true;
  let errorMessage: string | null = null;

  try {
    if (root) {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(process.env["CMS_API_KEY"] ? { "x-api-key": process.env["CMS_API_KEY"]! } : {}),
        },
        body: JSON.stringify(opts.payload),
      });
      httpStatus = res.status;
      const text = await res.text();
      response = text ? (JSON.parse(text) as Record<string, unknown>) : {};
      if (!res.ok) {
        success = false;
        errorMessage = `${opts.system} ${opts.operation} failed [${res.status}]: ${text}`;
      }
    } else {
      response = opts.simulate();
    }
  } catch (error) {
    success = false;
    httpStatus = 0;
    response = {};
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  await supabaseAdmin.from("integration_logs").insert({
    system: opts.system,
    direction: "outbound",
    operation: opts.operation,
    endpoint,
    request_id: opts.requestId ?? null,
    http_status: httpStatus,
    success,
    latency_ms: Date.now() - started,
    request_payload: opts.payload as never,
    response_payload: response as never,
    error_message: errorMessage,
  });

  if (!success) throw new Error(errorMessage ?? `${opts.system} ${opts.operation} failed`);
  return response as T;
}

function luhnComplete(prefix: string, length = 16) {
  let body = prefix;
  while (body.length < length - 1) body += Math.floor(Math.random() * 10).toString();
  let sum = 0;
  let double = true;
  for (let i = body.length - 1; i >= 0; i--) {
    let digit = Number(body[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    double = !double;
    sum += digit;
  }
  return body + ((10 - (sum % 10)) % 10).toString();
}

function serial(prefix: string) {
  return `${prefix}${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
}

export async function createCifInCbs(
  customer: Record<string, unknown>,
  requestId?: string | null,
) {
  const res = await call<{ cif_number: string }>({
    system: "CBS",
    operation: "createCif",
    path: "/cbs/v1/customers",
    payload: customer,
    requestId,
    simulate: () => ({ cif_number: serial("CIF"), status: "CREATED" }),
  });
  return res.cif_number;
}

export async function amendCifInCbs(
  cif: string,
  customer: Record<string, unknown>,
  requestId?: string | null,
) {
  await call({
    system: "CBS",
    operation: "amendCif",
    path: `/cbs/v1/customers/${cif}`,
    payload: customer,
    requestId,
    simulate: () => ({ cif_number: cif, status: "UPDATED" }),
  });
  return cif;
}

export async function createClientInCms(
  payload: Record<string, unknown>,
  requestId?: string | null,
) {
  const res = await call<{ client_id: string }>({
    system: "CMS",
    operation: "createClient",
    path: "/cms/v1/clients",
    payload,
    requestId,
    simulate: () => ({ client_id: serial("CL"), status: "CREATED" }),
  });
  return res.client_id;
}

export async function issueCardInCms(
  payload: { bin: string; client_id: string; product_code: string; embossing_name: string },
  requestId?: string | null,
) {
  const res = await call<{ card_number: string; expiry_month: number; expiry_year: number }>({
    system: "CMS",
    operation: "issueCard",
    path: "/cms/v1/cards",
    payload,
    requestId,
    simulate: () => {
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 5);
      return {
        card_number: luhnComplete(payload.bin),
        expiry_month: expiry.getMonth() + 1,
        expiry_year: expiry.getFullYear(),
      };
    },
  });
  return res;
}

export async function tagContactsInCms(
  payload: { card_number: string; email?: string | null; mobile?: string | null },
  requestId?: string | null,
) {
  await call({
    system: "CMS",
    operation: "tagContacts",
    path: `/cms/v1/cards/${payload.card_number}/contacts`,
    payload,
    requestId,
    simulate: () => ({
      email_tagged: Boolean(payload.email),
      sms_tagged: Boolean(payload.mobile),
    }),
  });
  return { email_tagged: Boolean(payload.email), sms_tagged: Boolean(payload.mobile) };
}

export async function setLimitInCms(
  payload: Record<string, unknown>,
  requestId?: string | null,
) {
  await call({
    system: "CMS",
    operation: "setCardLimit",
    path: `/cms/v1/cards/${payload["card_number"]}/limits`,
    payload,
    requestId,
    simulate: () => ({ status: "LIMIT_APPLIED" }),
  });
}

export async function updateCardStatusInCms(
  payload: { card_number: string; status: string },
  requestId?: string | null,
) {
  await call({
    system: "CMS",
    operation: "updateCardStatus",
    path: `/cms/v1/cards/${payload.card_number}/status`,
    payload,
    requestId,
    simulate: () => ({ status: payload.status.toUpperCase() }),
  });
}

export async function syncToCbs(
  operation: string,
  payload: Record<string, unknown>,
  requestId?: string | null,
) {
  await call({
    system: "CBS",
    operation,
    path: "/cbs/v1/card-sync",
    payload,
    requestId,
    simulate: () => ({ status: "SYNCED" }),
  });
}