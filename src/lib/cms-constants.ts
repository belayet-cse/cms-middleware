export const CARD_TYPES = [
  { value: "primary_credit", label: "Primary Credit Card" },
  { value: "supplementary_credit", label: "Supplementary Credit Card" },
  { value: "business", label: "Business Card" },
  { value: "prepaid", label: "Prepaid Card" },
] as const;

export const REQUEST_TYPES = [
  { value: "new_onboarding", label: "New Onboarding" },
  { value: "amendment", label: "Data Amendment" },
  { value: "replacement", label: "Card Replacement" },
  { value: "renewal", label: "Card Renewal" },
  { value: "card_delete", label: "Card Delete" },
  { value: "contact_delete", label: "Contact Delete" },
] as const;

export const PAYMENT_INSTRUCTIONS = [
  { value: "none", label: "Not applicable" },
  { value: "fc", label: "FC" },
  { value: "erq", label: "ERQ" },
  { value: "rfcd", label: "RFCD" },
] as const;

export const FC_CATEGORIES = [
  { value: "none", label: "Not applicable" },
  { value: "private_travel_quota", label: "Private Travel Quota" },
  { value: "erq", label: "ERQ" },
  { value: "fc", label: "FC" },
  { value: "rfcd", label: "RFCD" },
  { value: "other", label: "Other" },
] as const;

export const ROLES = [
  { value: "admin", label: "Administrator", hint: "Full control, setup and user management" },
  { value: "maker", label: "Maker", hint: "Creates and submits card bookings" },
  { value: "checker1", label: "Checker-1", hint: "Verifies bookings and sets card limits" },
  { value: "checker2", label: "Checker-2", hint: "Final limit approval" },
  { value: "auditor", label: "Auditor", hint: "Read-only access to audit trail" },
] as const;

export const REQUEST_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_checker: "Pending Checker",
  returned: "Returned to Maker",
  rejected: "Rejected",
  approved: "Approved",
  limit_pending_checker1: "Limit Setup — Checker-1",
  limit_pending_checker2: "Limit Approval — Checker-2",
  completed: "Completed & Synced",
};

export const CARD_STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  active: "Active",
  inactive: "Inactive",
  blocked: "Blocked",
  hotlisted: "Hotlisted",
  closed: "Closed",
  expired: "Expired",
};

export function labelOf(
  list: readonly { value: string; label: string }[],
  value: string | null | undefined,
): string {
  return list.find((i) => i.value === value)?.label ?? "—";
}

export function maskCard(cardNumber: string): string {
  if (cardNumber.length < 10) return cardNumber;
  return `${cardNumber.slice(0, 6)}${"*".repeat(cardNumber.length - 10)}${cardNumber.slice(-4)}`;
}

export function formatAmount(value: number | string | null | undefined, currency = "BDT") {
  const n = Number(value ?? 0);
  return `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}