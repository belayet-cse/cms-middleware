/**
 * Prototype dedupe engine. Simulates a parallel lookup in Core Banking (CBS)
 * and the Tranzware Card Management System (CMS) with in-memory registries.
 */
import { tableRows, mockId, MOCK_USER } from "./db";
import type { Row } from "./data";
import { recommendedAction, type DedupeAction, type DedupeKey } from "@/lib/cms-fields";

export type PartyInfo = {
  cif_number?: string;
  client_id?: string;
  full_name: string;
  date_of_birth: string;
  mobile: string;
  national_id: string;
  birth_certificate: string;
  tin: string;
  passport_no: string;
  account_no: string;
  email: string;
  present_address: string;
};

/** Customers known to Core Banking. */
export const CBS_REGISTRY: PartyInfo[] = [
  {
    cif_number: "00000000100302641",
    full_name: "AKTARUZZAMAN ASHIK",
    date_of_birth: "1995-01-20",
    mobile: "01634872141",
    national_id: "7329447499",
    birth_certificate: "",
    tin: "679413159621",
    passport_no: "",
    account_no: "0011340000123456",
    email: "ashik.ruetcse@gmail.com",
    present_address: "H. 9/10, Block A, Road 2/1, SOUTH BANASREE PROJECT, Khilgaon, Dhaka",
  },
  {
    cif_number: "00000000100458213",
    full_name: "MD. ARAFAT RAHMAN",
    date_of_birth: "1988-04-12",
    mobile: "01711002233",
    national_id: "1990178456321",
    birth_certificate: "20018712345678",
    tin: "412563789012",
    passport_no: "BQ0451237",
    account_no: "0011320000998877",
    email: "arafat.rahman@example.com",
    present_address: "House 42, Road 11, Banani, Dhaka 1213",
  },
  {
    cif_number: "00000000100499012",
    full_name: "SUMAIYA RAHMAN",
    date_of_birth: "1996-11-02",
    mobile: "01912334455",
    national_id: "1996774411223",
    birth_certificate: "",
    tin: "778812334455",
    passport_no: "EB0997712",
    account_no: "0011360000445566",
    email: "sumaiya.rahman@example.com",
    present_address: "Flat 3A, House 7, Uttara Sector 4, Dhaka",
  },
];

/** Clients already existing in the Card Management System. */
export const CMS_REGISTRY: PartyInfo[] = [
  {
    client_id: "919029",
    full_name: "AKTARUZZAMAN ASHIK",
    date_of_birth: "1995-01-20",
    mobile: "01634872141",
    national_id: "7329447499",
    birth_certificate: "",
    tin: "679413159621",
    passport_no: "",
    account_no: "0011340000123456",
    email: "ashik.ruetcse@gmail.com",
    present_address: "H. 9/10, Block A, Road 2/1, SOUTH BANASREE, Dhaka",
  },
  {
    client_id: "1007572",
    full_name: "MD MARUF HOSSAIN",
    date_of_birth: "1990-06-15",
    mobile: "01755667788",
    national_id: "1990553311224",
    birth_certificate: "19905533112",
    tin: "889977665544",
    passport_no: "BR1122334",
    account_no: "0011340000778899",
    email: "maruf.hossain@example.com",
    present_address: "House 12, Road 5, Mirpur DOHS, Dhaka",
  },
];

const digits = (v: string) => v.replace(/\D/g, "");

function matches(party: PartyInfo, key: DedupeKey, value: string, dob: string) {
  const v = value.trim().toLowerCase();
  if (!v) return false;
  switch (key) {
    case "nid":
      return digits(party.national_id) === digits(v) && (!dob || party.date_of_birth === dob);
    case "tin":
      return digits(party.tin) === digits(v);
    case "passport":
      return party.passport_no.toLowerCase() === v;
    case "mobile":
      return digits(party.mobile).endsWith(digits(v).slice(-10));
    case "brc":
      return digits(party.birth_certificate) === digits(v) && (!dob || party.date_of_birth === dob);
    case "account":
      return digits(party.account_no) === digits(v);
    case "name":
      return party.full_name.toLowerCase().includes(v) && (!dob || party.date_of_birth === dob);
    default:
      return false;
  }
}

export type DedupeResult = {
  cbs: PartyInfo | null;
  cms: PartyInfo | null;
  action: DedupeAction;
  searchedAt: string;
};

export function runDedupe(key: DedupeKey, value: string, dob: string): DedupeResult {
  const cbs = CBS_REGISTRY.find((p) => matches(p, key, value, dob)) ?? null;
  const cms = CMS_REGISTRY.find((p) => matches(p, key, value, dob)) ?? null;

  const log = (system: string, found: boolean) =>
    tableRows("integration_logs").unshift({
      id: mockId("i"),
      system,
      direction: "outbound",
      operation: "dedupe_search",
      endpoint: system === "CBS" ? "/cbs/v1/customers/search" : "/tranzware/clients/search",
      request_id: null,
      http_status: 200,
      success: true,
      latency_ms: 120 + Math.floor(Math.random() * 400),
      request_payload: { key, value, date_of_birth: dob || null },
      response_payload: { matched: found },
      error_message: null,
      created_at: new Date().toISOString(),
    });
  log("CBS", !!cbs);
  log("CMS", !!cms);

  return { cbs, cms, action: recommendedAction(!!cbs, !!cms), searchedAt: new Date().toISOString() };
}

function nextClientId() {
  const max = CMS_REGISTRY.reduce((m, p) => Math.max(m, Number(p.client_id ?? 0)), 1000000);
  return String(max + 1);
}

function nextCif() {
  const max = CBS_REGISTRY.reduce((m, p) => Math.max(m, Number(p.cif_number ?? 0)), 100302641);
  return String(max + 1).padStart(17, "0");
}

export type OnboardOutcome = {
  action: DedupeAction;
  cif_number: string;
  client_id: string;
  cif_created: boolean;
  client_created: boolean;
  customer_id: string;
};

/**
 * Applies the selected dedupe outcome: creates or updates the CIF in CBS and the
 * Client ID in CMS simultaneously, then records audit + integration entries.
 */
export function onboardClient(action: DedupeAction, form: Row): OnboardOutcome {
  const nowIso = new Date().toISOString();
  const cifCreate = action === "create_cif_client" || action === "create_cif_update_client";
  const clientCreate = action === "create_cif_client" || action === "create_client_update_cif";

  const party: PartyInfo = {
    full_name: String(form['full_name'] ?? ""),
    date_of_birth: String(form['date_of_birth'] ?? ""),
    mobile: String(form['mobile'] ?? ""),
    national_id: String(form['national_id'] ?? ""),
    birth_certificate: String(form['birth_certificate'] ?? ""),
    tin: String(form['tin'] ?? ""),
    passport_no: String(form['passport_no'] ?? ""),
    account_no: String(form['account_no_tk'] ?? ""),
    email: String(form['email'] ?? ""),
    present_address: [form['present_line1'], form['present_line2'], form['present_city']]
      .filter(Boolean)
      .join(", "),
  };

  let cif = String(form['cif_number'] ?? "");
  if (cifCreate || !cif) {
    cif = nextCif();
    CBS_REGISTRY.push({ ...party, cif_number: cif });
  } else {
    const idx = CBS_REGISTRY.findIndex((p) => p.cif_number === cif);
    if (idx >= 0) CBS_REGISTRY[idx] = { ...CBS_REGISTRY[idx]!, ...party, cif_number: cif };
  }

  let clientId = String(form['client_id'] ?? "");
  if (clientCreate || !clientId) {
    clientId = nextClientId();
    CMS_REGISTRY.push({ ...party, client_id: clientId });
  } else {
    const idx = CMS_REGISTRY.findIndex((p) => p.client_id === clientId);
    if (idx >= 0) CMS_REGISTRY[idx] = { ...CMS_REGISTRY[idx]!, ...party, client_id: clientId };
  }

  const customerId = mockId("c");
  tableRows("customers").unshift({
    id: customerId,
    cif_number: cif,
    cms_client_id: clientId,
    full_name: party.full_name,
    father_name: form['father_name'] ?? null,
    mother_name: form['mother_name'] ?? null,
    date_of_birth: party.date_of_birth || null,
    national_id: party.national_id || null,
    passport_no: party.passport_no || null,
    tin: party.tin || null,
    gender: String(form['sex'] ?? "").toLowerCase() || null,
    mobile: party.mobile,
    email: party.email || null,
    address_line1: form['present_line1'] ?? null,
    address_line2: form['present_line2'] ?? null,
    city: form['present_city'] ?? null,
    postal_code: form['present_post_code'] ?? null,
    country: "Bangladesh",
    cbs_sync: "synced",
    cms_sync: "synced",
    last_synced_at: nowIso,
    created_by: MOCK_USER.id,
    created_at: nowIso,
    updated_at: nowIso,
    client_details: form,
  });

  const logIntegration = (system: string, operation: string, payload: Row) =>
    tableRows("integration_logs").unshift({
      id: mockId("i"),
      system,
      direction: "outbound",
      operation,
      endpoint: system === "CBS" ? "/cbs/v1/customers" : "/tranzware/clients",
      request_id: null,
      http_status: 201,
      success: true,
      latency_ms: 200 + Math.floor(Math.random() * 500),
      request_payload: payload,
      response_payload: { cif_number: cif, client_id: clientId },
      error_message: null,
      created_at: nowIso,
    });

  logIntegration("CBS", cifCreate ? "create_cif" : "update_cif", { cif_number: cif, ...party });
  logIntegration("CMS", clientCreate ? "create_client" : "update_client", { client_id: clientId, ...party });

  tableRows("audit_logs").unshift({
    id: mockId("l"),
    actor_id: MOCK_USER.id,
    actor_name: MOCK_USER.full_name,
    action,
    entity_type: "customer",
    entity_id: customerId,
    reference_no: String(form['application_ref_no'] ?? cif),
    before_data: null,
    after_data: { cif_number: cif, client_id: clientId },
    changed_fields: Object.keys(form),
    ip_address: "10.20.4.19",
    created_at: nowIso,
  });

  return {
    action,
    cif_number: cif,
    client_id: clientId,
    cif_created: cifCreate,
    client_created: clientCreate,
    customer_id: customerId,
  };
}