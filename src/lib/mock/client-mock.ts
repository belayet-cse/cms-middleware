/**
 * Prototype mock values for the CIF & Client ID screen. Every CMS field gets a
 * plausible demo value so all sections render populated, exactly like a
 * retrieved client record. No validation, no persistence.
 */
import type { FieldDef, SectionDef } from "@/lib/cms-fields";

const VALUES: Record<string, string> = {
  application_ref_no: "APP-2026-000418",
  first_name: "AKTARUZZAMAN",
  middle_name: "",
  last_name: "ASHIK",
  full_name: "AKTARUZZAMAN ASHIK",
  name_transliteration: "AKTARUZZAMAN ASHIK",
  name_on_card: "AKTARUZZAMAN ASHIK",
  date_of_birth: "1995-01-20",
  age: "31",
  place_of_birth: "Dhaka",
  spouse_name: "NUSRAT JAHAN",
  father_name: "MD. ABDUL MANNAN",
  mother_name: "MOSA. RAHIMA BEGUM",
  national_id: "7329447499",
  national_id_10: "7329447499",
  birth_certificate: "19952691234567890",
  personal_code: "7329447499",
  passport_no: "EB0997712",
  pp_issue_date: "2021-03-14",
  pp_expiry_date: "2031-03-13",
  pp_place_of_issue: "Dhaka",
  global_endorsement_limit: "12000",
  endorsement_expiry_date: "2027-12-31",
  passport_renewal_date: "2031-01-31",
  mobile: "01634872141",
  alt_mobile: "01711002233",
  email: "ashik.ruetcse@gmail.com",
  telephone: "029882211",
  fax: "029882212",
  correspondence_country: "BANGLADESH (50)",
  correspondence_region: "Dhaka",
  correspondence_zip: "1219",
  correspondence_address: "H. 9/10, Block A, Road 2/1, South Banasree Project, Khilgaon, Dhaka",
  present_line1: "H. 9/10, Block A, Road 2/1",
  present_line2: "South Banasree Project, Khilgaon",
  present_division: "Dhaka",
  present_district: "Dhaka",
  present_thana: "Khilgaon",
  present_city: "Dhaka",
  present_street: "Road 2/1",
  present_house: "9/10",
  present_flat: "B-4",
  present_post_code: "1219",
  permanent_line1: "Village: Baniachang",
  permanent_line2: "Post: Baniachang Bazar",
  permanent_line3: "Habiganj Sadar",
  permanent_division: "Sylhet",
  permanent_district: "Habiganj",
  permanent_thana: "Baniachang",
  permanent_city: "Habiganj",
  permanent_post_code: "3350",
  company: "Mutual Trust Bank PLC",
  designation_department: "Senior Officer, Card Division",
  employee_no: "MTB-10877",
  position: "Senior Officer",
  office_phone: "0255668877",
  employed_since: "2019-07-01",
  previous_employment: "Brac Bank PLC (2016–2019)",
  business_line1: "MTB Centre, 26 Gulshan Avenue",
  business_line2: "Plot 5, Block SE(D), Gulshan 1",
  business_division: "Dhaka",
  business_district: "Dhaka",
  business_thana: "Gulshan",
  tin: "679413159621",
  tax_circle: "Circle-152",
  tax_zone: "Zone-08, Dhaka",
  tax_assessment_year: "2025-2026",
  serial_return_register: "SR-2025-114872",
  return_submission_date: "2025-11-28",
  monthly_income: "125000",
  yearly_income: "1500000",
  kyc_risk_score: "9",
  account_no_tk: "0011340000123456",
  account_no_fc: "FC-0011340000998",
  bank_account_name: "AKTARUZZAMAN ASHIK",
  bank_name: "Mutual Trust Bank PLC",
  branch_name: "Principal Branch, Dhaka",
  branch_routing_no: "145263558",
  reference_account: "0011340000123456",
  approved_fc_rate: "121.50",
  rm_dse_code: "DSE-2214",
  referral_code: "REF-88120",
  credit_card_file_no: "CCF-2026-000418",
  receive_card_branch: "Principal Branch, Dhaka",
  branch_code: "0011",
  security_code: "MOTHER'S MAIDEN NAME",
  application_code: "APPL-000418",
  application_receive_date: "2026-07-28",
  application_accepted_date: "2026-07-30",
  referring_division: "Retail Banking Division",
  corporate_company: "N/A",
  campaign_code: "CMP-EID-2026",
  lien_amount: "0",
  lien_type: "None",
  nominee_name: "NUSRAT JAHAN",
  nominee_relationship: "Spouse",
  nominee_dob: "1997-05-11",
  pa_referred_by: "MTB-10234 · Tanvir Hasan",
  pa_proposed_by: "MTB-09122 · Rafiqul Islam",
  cepp_com_id: "CEPP-4471",
  cms_client_id: "919029",
  cms_cif_number: "00000000100302641",
  cms_institution_id: "MTB-001",
  cms_agent_branch: "0011 — Principal Branch",
  cms_external_ref: "CR-2026-0000148",
  cms_registration_date: "2026-07-30",
  cms_relationship_start: "2019-08-12",
  cms_service_group: "RETAIL-STD",
  cms_tariff_plan: "TP-GOLD-01",
  cms_delivery_contact: "01634872141",
  cms_delivery_instruction: "Hand over to cardholder at branch after NID verification.",
  cms_kyc_review_date: "2027-07-30",
  cms_block_code: "",
  cms_block_reason: "",
  cms_block_date: "",
  cms_maker_id: "MTB-10234 · Tanvir Hasan",
  cms_checker_id: "MTB-10877 · Nusrat Jahan",
  cms_created_at: "2026-07-30T10:24:00",
  cms_modified_at: "2026-08-03T05:12:00",
  cms_remarks: "Client record synchronised with CBS. No adverse dedupe match.",
};

const TRUE_CHECKBOXES = new Set([
  "nid_verified",
  "e_statement",
  "same_as_present",
  "endorse_pp",
  "cms_sms_alert",
  "cms_internet_banking",
  "cms_ecom_enabled",
  "cms_contactless",
  "crm_for_cib",
  "saarc",
]);

function fallback(field: FieldDef): string | boolean {
  if (field.type === "checkbox") return TRUE_CHECKBOXES.has(field.name);
  if (field.type === "select") return field.options?.[0] ?? "";
  if (field.type === "date") return "2026-07-30";
  if (field.type === "number") return "0";
  return field.placeholder ?? "";
}

/** Mock value for a single CMS client field. */
export function mockFieldValue(field: FieldDef): string | boolean {
  if (field.type === "checkbox") return TRUE_CHECKBOXES.has(field.name);
  const preset = VALUES[field.name];
  if (preset !== undefined) return preset;
  return fallback(field);
}

/** A fully populated mock client record across every section. */
export function mockClientRecord(sections: readonly SectionDef[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const section of sections) {
    for (const field of section.fields) out[field.name] = mockFieldValue(field);
  }
  return out;
}
