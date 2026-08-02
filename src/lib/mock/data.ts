/**
 * Prototype mock dataset. No database, no validation — everything lives in memory
 * and resets on page reload.
 */

export type Row = Record<string, any>;

export const MOCK_USER = {
  id: "u-0001",
  email: "maker.checker@mtb.com.bd",
  full_name: "Tanvir Hasan",
  employee_id: "MTB-10234",
  designation: "Officer, Cards Operations",
  branch: "Principal Branch, Dhaka",
};

const now = Date.now();
const iso = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();

export const PRODUCTS: Row[] = [
  { id: "p-1", product_code: "VCC-GLD", product_name: "MTB Visa Gold Credit", card_type: "primary_credit", scheme: "VISA", currency: "BDT", bin: "446789", min_limit: 50000, max_limit: 1000000, is_active: true, created_at: iso(50000), updated_at: iso(400) },
  { id: "p-2", product_code: "VCC-PLT", product_name: "MTB Visa Platinum Credit", card_type: "primary_credit", scheme: "VISA", currency: "BDT", bin: "446790", min_limit: 200000, max_limit: 3000000, is_active: true, created_at: iso(50000), updated_at: iso(400) },
  { id: "p-3", product_code: "MCC-SUP", product_name: "MTB Mastercard Supplementary", card_type: "supplementary_credit", scheme: "MASTERCARD", currency: "BDT", bin: "512345", min_limit: 20000, max_limit: 500000, is_active: true, created_at: iso(50000), updated_at: iso(400) },
  { id: "p-4", product_code: "BIZ-SIG", product_name: "MTB Business Signature", card_type: "business", scheme: "VISA", currency: "BDT", bin: "446791", min_limit: 500000, max_limit: 10000000, is_active: true, created_at: iso(50000), updated_at: iso(400) },
  { id: "p-5", product_code: "PRE-TRV", product_name: "MTB Prepaid Travel (USD)", card_type: "prepaid", scheme: "VISA", currency: "USD", bin: "446792", min_limit: 100, max_limit: 12000, is_active: true, created_at: iso(50000), updated_at: iso(400) },
];

export const FEE_PROFILES: Row[] = [
  { id: "f-1", profile_code: "FP-STD", profile_name: "Standard Retail", annual_fee: 2000, late_fee: 500, cash_advance_rate: 2.5, interest_rate: 20, credit_shield_premium_rate: 0.35, is_active: true, created_at: iso(50000), updated_at: iso(900) },
  { id: "f-2", profile_code: "FP-PRM", profile_name: "Premium Waiver", annual_fee: 0, late_fee: 500, cash_advance_rate: 2, interest_rate: 18, credit_shield_premium_rate: 0.3, is_active: true, created_at: iso(50000), updated_at: iso(900) },
  { id: "f-3", profile_code: "FP-BIZ", profile_name: "Corporate / Business", annual_fee: 5000, late_fee: 1000, cash_advance_rate: 2, interest_rate: 16.5, credit_shield_premium_rate: 0.25, is_active: true, created_at: iso(50000), updated_at: iso(900) },
];

export const PROFILES: Row[] = [
  { id: MOCK_USER.id, full_name: MOCK_USER.full_name, employee_id: MOCK_USER.employee_id, designation: MOCK_USER.designation, branch: MOCK_USER.branch, email: MOCK_USER.email, is_active: true, created_at: iso(60000), updated_at: iso(120) },
  { id: "u-0002", full_name: "Nusrat Jahan", employee_id: "MTB-10877", designation: "Senior Officer, Card Division", branch: "Gulshan Branch, Dhaka", email: "nusrat.jahan@mtb.com.bd", is_active: true, created_at: iso(58000), updated_at: iso(300) },
  { id: "u-0003", full_name: "Rafiqul Islam", employee_id: "MTB-09122", designation: "Head of Cards", branch: "Head Office", email: "rafiqul.islam@mtb.com.bd", is_active: true, created_at: iso(57000), updated_at: iso(800) },
  { id: "u-0004", full_name: "Sabina Yeasmin", employee_id: "MTB-11540", designation: "Officer, Internal Control", branch: "Head Office", email: "sabina.yeasmin@mtb.com.bd", is_active: true, created_at: iso(52000), updated_at: iso(1400) },
];

export const USER_ROLES: Row[] = [
  { id: "r-1", user_id: "u-0001", role: "maker", created_at: iso(60000) },
  { id: "r-2", user_id: "u-0001", role: "admin", created_at: iso(60000) },
  { id: "r-3", user_id: "u-0002", role: "checker1", created_at: iso(58000) },
  { id: "r-4", user_id: "u-0003", role: "checker2", created_at: iso(57000) },
  { id: "r-5", user_id: "u-0004", role: "auditor", created_at: iso(52000) },
];

export const CUSTOMERS: Row[] = [
  { id: "c-1", cif_number: "CIF00458213", cms_client_id: "CMS0000112", full_name: "Md. Arafat Rahman", father_name: "Md. Siddiqur Rahman", mother_name: "Rahima Begum", date_of_birth: "1988-04-12", national_id: "1990178456321", passport_no: "BQ0451237", tin: "412563789012", gender: "male", mobile: "+8801711002233", email: "arafat.rahman@example.com", address_line1: "House 42, Road 11, Banani", address_line2: "", city: "Dhaka", postal_code: "1213", country: "Bangladesh", cbs_sync: "synced", cms_sync: "synced", last_synced_at: iso(180), created_by: "u-0001", created_at: iso(2600), updated_at: iso(180) },
  { id: "c-2", cif_number: "CIF00458990", cms_client_id: "CMS0000113", full_name: "Farhana Akter", father_name: "Abdul Karim", mother_name: "Nasrin Akter", date_of_birth: "1992-09-30", national_id: "1990455213788", passport_no: null, tin: "556231447890", gender: "female", mobile: "+8801819556677", email: "farhana.akter@example.com", address_line1: "Flat 5B, Dhanmondi 27", address_line2: "", city: "Dhaka", postal_code: "1209", country: "Bangladesh", cbs_sync: "synced", cms_sync: "synced", last_synced_at: iso(420), created_by: "u-0001", created_at: iso(4300), updated_at: iso(420) },
  { id: "c-3", cif_number: "CIF00459771", cms_client_id: null, full_name: "Shafiqul Alam", father_name: "Nurul Alam", mother_name: "Hosne Ara", date_of_birth: "1979-01-22", national_id: "1979887456120", passport_no: "BX7781209", tin: "778451236677", gender: "male", mobile: "+8801933114455", email: "shafiqul.alam@example.com", address_line1: "12/A CDA Avenue", address_line2: "Nasirabad", city: "Chattogram", postal_code: "4000", country: "Bangladesh", cbs_sync: "synced", cms_sync: "pending", last_synced_at: iso(90), created_by: "u-0002", created_at: iso(900), updated_at: iso(90) },
  { id: "c-4", cif_number: "CIF00460012", cms_client_id: "CMS0000119", full_name: "Trust Textiles Ltd.", father_name: null, mother_name: null, date_of_birth: null, national_id: null, passport_no: null, tin: "990012337788", gender: null, mobile: "+8801711778899", email: "accounts@trusttextiles.com", address_line1: "Plot 7, Tejgaon I/A", address_line2: "", city: "Dhaka", postal_code: "1208", country: "Bangladesh", cbs_sync: "synced", cms_sync: "synced", last_synced_at: iso(1500), created_by: "u-0002", created_at: iso(6800), updated_at: iso(1500) },
  { id: "c-5", cif_number: null, cms_client_id: null, full_name: "Ishrat Zahan", father_name: "Kamrul Hasan", mother_name: "Sultana Razia", date_of_birth: "1996-06-18", national_id: "1996332114455", passport_no: null, tin: null, gender: "female", mobile: "+8801611223344", email: "ishrat.zahan@example.com", address_line1: "Road 3, Uttara Sector 7", address_line2: "", city: "Dhaka", postal_code: "1230", country: "Bangladesh", cbs_sync: "pending", cms_sync: "pending", last_synced_at: null, created_by: "u-0001", created_at: iso(35), updated_at: iso(35) },
];

export const CARD_REQUESTS: Row[] = [
  {
    id: "q-1", reference_no: "CR-2026-0000141", request_type: "new_onboarding", card_type: "primary_credit", status: "completed",
    customer_id: "c-1", existing_cif: null, use_existing_cif: false, applicant_name: "Md. Arafat Rahman", embossing_name: "MD ARAFAT RAHMAN",
    father_name: "Md. Siddiqur Rahman", mother_name: "Rahima Begum", date_of_birth: "1988-04-12", national_id: "1990178456321", passport_no: "BQ0451237",
    tin: "412563789012", gender: "male", mobile: "+8801711002233", email: "arafat.rahman@example.com", address_line1: "House 42, Road 11, Banani",
    address_line2: "", city: "Dhaka", postal_code: "1213", primary_card_id: null, company_name: null, product_id: "p-2", fee_profile_id: "f-2",
    requested_limit: 500000, approved_limit: 450000, payment_instruction: "none", fc_account_no: null, fc_category: "none", credit_shield: true,
    credit_shield_rate: 0.3, email_tagged: true, sms_tagged: true, generated_card_number: "4467902233114458", generated_client_id: "CMS0000112",
    generated_cif: "CIF00458213", maker_id: "u-0001", maker_remarks: "Salary account customer, 3 years relationship.", submitted_at: iso(320),
    checker_id: "u-0002", checker_remarks: "Documents verified against CBS.", checked_at: iso(300), limit_checker1_id: "u-0002",
    limit_checker1_at: iso(280), limit_checker2_id: "u-0003", limit_checker2_at: iso(180), bulk_batch_id: null, created_at: iso(360), updated_at: iso(180),
  },
  {
    id: "q-2", reference_no: "CR-2026-0000142", request_type: "new_onboarding", card_type: "primary_credit", status: "limit_pending_checker2",
    customer_id: "c-2", existing_cif: "CIF00458990", use_existing_cif: true, applicant_name: "Farhana Akter", embossing_name: "FARHANA AKTER",
    father_name: "Abdul Karim", mother_name: "Nasrin Akter", date_of_birth: "1992-09-30", national_id: "1990455213788", passport_no: null,
    tin: "556231447890", gender: "female", mobile: "+8801819556677", email: "farhana.akter@example.com", address_line1: "Flat 5B, Dhanmondi 27",
    address_line2: "", city: "Dhaka", postal_code: "1209", primary_card_id: null, company_name: null, product_id: "p-1", fee_profile_id: "f-1",
    requested_limit: 300000, approved_limit: 250000, payment_instruction: "none", fc_account_no: null, fc_category: "none", credit_shield: false,
    credit_shield_rate: null, email_tagged: true, sms_tagged: true, generated_card_number: null, generated_client_id: "CMS0000113",
    generated_cif: "CIF00458990", maker_id: "u-0001", maker_remarks: "Existing CIF reused.", submitted_at: iso(240), checker_id: "u-0002",
    checker_remarks: "Approved, limit set at BDT 250,000.", checked_at: iso(200), limit_checker1_id: "u-0002", limit_checker1_at: iso(150),
    limit_checker2_id: null, limit_checker2_at: null, bulk_batch_id: null, created_at: iso(260), updated_at: iso(150),
  },
  {
    id: "q-3", reference_no: "CR-2026-0000143", request_type: "new_onboarding", card_type: "business", status: "pending_checker",
    customer_id: "c-4", existing_cif: "CIF00460012", use_existing_cif: true, applicant_name: "Trust Textiles Ltd.", embossing_name: "TRUST TEXTILES LTD",
    father_name: null, mother_name: null, date_of_birth: null, national_id: null, passport_no: null, tin: "990012337788", gender: null,
    mobile: "+8801711778899", email: "accounts@trusttextiles.com", address_line1: "Plot 7, Tejgaon I/A", address_line2: "", city: "Dhaka",
    postal_code: "1208", primary_card_id: null, company_name: "Trust Textiles Ltd.", product_id: "p-4", fee_profile_id: "f-3",
    requested_limit: 2500000, approved_limit: null, payment_instruction: "none", fc_account_no: null, fc_category: "none", credit_shield: false,
    credit_shield_rate: null, email_tagged: true, sms_tagged: false, generated_card_number: null, generated_client_id: null, generated_cif: null,
    maker_id: "u-0001", maker_remarks: "Corporate card for procurement team.", submitted_at: iso(60), checker_id: null, checker_remarks: null,
    checked_at: null, limit_checker1_id: null, limit_checker1_at: null, limit_checker2_id: null, limit_checker2_at: null, bulk_batch_id: null,
    created_at: iso(75), updated_at: iso(60),
  },
  {
    id: "q-4", reference_no: "CR-2026-0000144", request_type: "new_onboarding", card_type: "supplementary_credit", status: "limit_pending_checker1",
    customer_id: "c-1", existing_cif: "CIF00458213", use_existing_cif: true, applicant_name: "Sumaiya Rahman", embossing_name: "SUMAIYA RAHMAN",
    father_name: "Md. Arafat Rahman", mother_name: "Rahima Begum", date_of_birth: "2000-11-05", national_id: "2000554478123", passport_no: null,
    tin: null, gender: "female", mobile: "+8801711002244", email: "sumaiya.rahman@example.com", address_line1: "House 42, Road 11, Banani",
    address_line2: "", city: "Dhaka", postal_code: "1213", primary_card_id: "k-1", company_name: null, product_id: "p-3", fee_profile_id: "f-1",
    requested_limit: 100000, approved_limit: null, payment_instruction: "none", fc_account_no: null, fc_category: "none", credit_shield: false,
    credit_shield_rate: null, email_tagged: true, sms_tagged: true, generated_card_number: null, generated_client_id: "CMS0000112",
    generated_cif: "CIF00458213", maker_id: "u-0001", maker_remarks: "Supplementary against primary card of father.", submitted_at: iso(50),
    checker_id: "u-0002", checker_remarks: "Verified relationship.", checked_at: iso(40), limit_checker1_id: null, limit_checker1_at: null,
    limit_checker2_id: null, limit_checker2_at: null, bulk_batch_id: null, created_at: iso(58), updated_at: iso(40),
  },
  {
    id: "q-5", reference_no: "CR-2026-0000145", request_type: "new_onboarding", card_type: "prepaid", status: "returned",
    customer_id: null, existing_cif: null, use_existing_cif: false, applicant_name: "Shafiqul Alam", embossing_name: "SHAFIQUL ALAM",
    father_name: "Nurul Alam", mother_name: "Hosne Ara", date_of_birth: "1979-01-22", national_id: "1979887456120", passport_no: "BX7781209",
    tin: "778451236677", gender: "male", mobile: "+8801933114455", email: "shafiqul.alam@example.com", address_line1: "12/A CDA Avenue",
    address_line2: "Nasirabad", city: "Chattogram", postal_code: "4000", primary_card_id: null, company_name: null, product_id: "p-5",
    fee_profile_id: "f-1", requested_limit: 5000, approved_limit: null, payment_instruction: "fc", fc_account_no: "FC-334455",
    fc_category: "private_travel_quota", credit_shield: false, credit_shield_rate: null, email_tagged: true, sms_tagged: true,
    generated_card_number: null, generated_client_id: null, generated_cif: null, maker_id: "u-0001",
    maker_remarks: "Travel quota endorsement requested.", submitted_at: iso(30), checker_id: "u-0002",
    checker_remarks: "Passport endorsement page missing — please attach and resubmit.", checked_at: iso(25), limit_checker1_id: null,
    limit_checker1_at: null, limit_checker2_id: null, limit_checker2_at: null, bulk_batch_id: null, created_at: iso(34), updated_at: iso(25),
  },
  {
    id: "q-6", reference_no: "CR-2026-0000146", request_type: "new_onboarding", card_type: "primary_credit", status: "draft",
    customer_id: null, existing_cif: null, use_existing_cif: false, applicant_name: "Ishrat Zahan", embossing_name: "ISHRAT ZAHAN",
    father_name: "Kamrul Hasan", mother_name: "Sultana Razia", date_of_birth: "1996-06-18", national_id: "1996332114455", passport_no: null,
    tin: null, gender: "female", mobile: "+8801611223344", email: "ishrat.zahan@example.com", address_line1: "Road 3, Uttara Sector 7",
    address_line2: "", city: "Dhaka", postal_code: "1230", primary_card_id: null, company_name: null, product_id: "p-1", fee_profile_id: "f-1",
    requested_limit: 150000, approved_limit: null, payment_instruction: "none", fc_account_no: null, fc_category: "none", credit_shield: true,
    credit_shield_rate: 0.35, email_tagged: true, sms_tagged: true, generated_card_number: null, generated_client_id: null, generated_cif: null,
    maker_id: "u-0001", maker_remarks: null, submitted_at: null, checker_id: null, checker_remarks: null, checked_at: null,
    limit_checker1_id: null, limit_checker1_at: null, limit_checker2_id: null, limit_checker2_at: null, bulk_batch_id: null,
    created_at: iso(20), updated_at: iso(12),
  },
  {
    id: "q-7", reference_no: "CR-2026-0000147", request_type: "replacement", card_type: "primary_credit", status: "rejected",
    customer_id: "c-3", existing_cif: "CIF00459771", use_existing_cif: true, applicant_name: "Shafiqul Alam", embossing_name: "SHAFIQUL ALAM",
    father_name: "Nurul Alam", mother_name: "Hosne Ara", date_of_birth: "1979-01-22", national_id: "1979887456120", passport_no: "BX7781209",
    tin: "778451236677", gender: "male", mobile: "+8801933114455", email: "shafiqul.alam@example.com", address_line1: "12/A CDA Avenue",
    address_line2: "Nasirabad", city: "Chattogram", postal_code: "4000", primary_card_id: "k-3", company_name: null, product_id: "p-1",
    fee_profile_id: "f-1", requested_limit: 200000, approved_limit: null, payment_instruction: "none", fc_account_no: null, fc_category: "none",
    credit_shield: false, credit_shield_rate: null, email_tagged: true, sms_tagged: true, generated_card_number: null, generated_client_id: null,
    generated_cif: null, maker_id: "u-0001", maker_remarks: "Card reported damaged.", submitted_at: iso(1500), checker_id: "u-0003",
    checker_remarks: "Duplicate of CR-2026-0000131 — rejected.", checked_at: iso(1440), limit_checker1_id: null, limit_checker1_at: null,
    limit_checker2_id: null, limit_checker2_at: null, bulk_batch_id: "b-1", created_at: iso(1600), updated_at: iso(1440),
  },
];

export const CARDS: Row[] = [
  { id: "k-1", card_number: "4467902233114458", masked_number: "446790******4458", card_type: "primary_credit", status: "active", customer_id: "c-1", request_id: "q-1", product_id: "p-2", fee_profile_id: "f-2", embossing_name: "MD ARAFAT RAHMAN", expiry_month: 8, expiry_year: 2029, card_limit: 450000, cash_limit: 90000, parent_card_id: null, credit_shield: true, cbs_sync: "synced", cms_sync: "synced", is_deleted: false, created_at: iso(180), updated_at: iso(170) },
  { id: "k-2", card_number: "5123457788990011", masked_number: "512345******0011", card_type: "supplementary_credit", status: "requested", customer_id: "c-1", request_id: "q-4", product_id: "p-3", fee_profile_id: "f-1", embossing_name: "SUMAIYA RAHMAN", expiry_month: 8, expiry_year: 2029, card_limit: 0, cash_limit: 0, parent_card_id: "k-1", credit_shield: false, cbs_sync: "pending", cms_sync: "pending", is_deleted: false, created_at: iso(40), updated_at: iso(40) },
  { id: "k-3", card_number: "4467891122336677", masked_number: "446789******6677", card_type: "primary_credit", status: "hotlisted", customer_id: "c-3", request_id: null, product_id: "p-1", fee_profile_id: "f-1", embossing_name: "SHAFIQUL ALAM", expiry_month: 3, expiry_year: 2028, card_limit: 200000, cash_limit: 40000, parent_card_id: null, credit_shield: false, cbs_sync: "synced", cms_sync: "synced", is_deleted: false, created_at: iso(9000), updated_at: iso(1300) },
  { id: "k-4", card_number: "4467912233445566", masked_number: "446791******5566", card_type: "business", status: "active", customer_id: "c-4", request_id: null, product_id: "p-4", fee_profile_id: "f-3", embossing_name: "TRUST TEXTILES LTD", expiry_month: 11, expiry_year: 2030, card_limit: 3000000, cash_limit: 300000, parent_card_id: null, credit_shield: false, cbs_sync: "synced", cms_sync: "synced", is_deleted: false, created_at: iso(6800), updated_at: iso(1500) },
  { id: "k-5", card_number: "4467923344556677", masked_number: "446792******6677", card_type: "prepaid", status: "inactive", customer_id: "c-2", request_id: null, product_id: "p-5", fee_profile_id: "f-1", embossing_name: "FARHANA AKTER", expiry_month: 5, expiry_year: 2027, card_limit: 3000, cash_limit: 500, parent_card_id: null, credit_shield: false, cbs_sync: "synced", cms_sync: "failed", is_deleted: false, created_at: iso(4300), updated_at: iso(2200) },
  { id: "k-6", card_number: "4467891234567890", masked_number: "446789******7890", card_type: "primary_credit", status: "blocked", customer_id: "c-2", request_id: null, product_id: "p-1", fee_profile_id: "f-1", embossing_name: "FARHANA AKTER", expiry_month: 1, expiry_year: 2027, card_limit: 250000, cash_limit: 50000, parent_card_id: null, credit_shield: true, cbs_sync: "synced", cms_sync: "synced", is_deleted: false, created_at: iso(4200), updated_at: iso(600) },
];

export const REQUEST_APPROVALS: Row[] = [
  { id: "a-1", request_id: "q-1", action: "submitted", actor_id: "u-0001", actor_role: "maker", from_status: "draft", to_status: "pending_checker", remarks: "Salary account customer, 3 years relationship.", created_at: iso(320) },
  { id: "a-2", request_id: "q-1", action: "approved", actor_id: "u-0002", actor_role: "checker1", from_status: "pending_checker", to_status: "limit_pending_checker1", remarks: "Documents verified against CBS.", created_at: iso(300) },
  { id: "a-3", request_id: "q-1", action: "limit_set", actor_id: "u-0002", actor_role: "checker1", from_status: "limit_pending_checker1", to_status: "limit_pending_checker2", remarks: "Limit proposed BDT 450,000", created_at: iso(280) },
  { id: "a-4", request_id: "q-1", action: "limit_approved", actor_id: "u-0003", actor_role: "checker2", from_status: "limit_pending_checker2", to_status: "completed", remarks: "Final approval, card issued.", created_at: iso(180) },
  { id: "a-5", request_id: "q-2", action: "submitted", actor_id: "u-0001", actor_role: "maker", from_status: "draft", to_status: "pending_checker", remarks: "Existing CIF reused.", created_at: iso(240) },
  { id: "a-6", request_id: "q-2", action: "approved", actor_id: "u-0002", actor_role: "checker1", from_status: "pending_checker", to_status: "limit_pending_checker1", remarks: null, created_at: iso(200) },
  { id: "a-7", request_id: "q-2", action: "limit_set", actor_id: "u-0002", actor_role: "checker1", from_status: "limit_pending_checker1", to_status: "limit_pending_checker2", remarks: "Approved, limit set at BDT 250,000.", created_at: iso(150) },
  { id: "a-8", request_id: "q-3", action: "submitted", actor_id: "u-0001", actor_role: "maker", from_status: "draft", to_status: "pending_checker", remarks: "Corporate card for procurement team.", created_at: iso(60) },
  { id: "a-9", request_id: "q-5", action: "submitted", actor_id: "u-0001", actor_role: "maker", from_status: "draft", to_status: "pending_checker", remarks: "Travel quota endorsement requested.", created_at: iso(30) },
  { id: "a-10", request_id: "q-5", action: "returned", actor_id: "u-0002", actor_role: "checker1", from_status: "pending_checker", to_status: "returned", remarks: "Passport endorsement page missing — please attach and resubmit.", created_at: iso(25) },
  { id: "a-11", request_id: "q-7", action: "rejected", actor_id: "u-0003", actor_role: "checker2", from_status: "pending_checker", to_status: "rejected", remarks: "Duplicate of CR-2026-0000131 — rejected.", created_at: iso(1440) },
];

export const BULK_BATCHES: Row[] = [
  { id: "b-1", file_name: "corporate-cards-jan.csv", total_rows: 48, accepted_rows: 45, rejected_rows: 3, errors: [{ row: 12, message: "Mobile number missing" }, { row: 29, message: "Unknown product code" }, { row: 40, message: "Duplicate NID" }], uploaded_by: "u-0001", created_at: iso(1600) },
  { id: "b-2", file_name: "payroll-batch-0219.csv", total_rows: 120, accepted_rows: 120, rejected_rows: 0, errors: null, uploaded_by: "u-0001", created_at: iso(700) },
  { id: "b-3", file_name: "prepaid-travel-quota.csv", total_rows: 15, accepted_rows: 13, rejected_rows: 2, errors: [{ row: 4, message: "FC account number missing" }, { row: 9, message: "Passport number missing" }], uploaded_by: "u-0002", created_at: iso(160) },
];

export const AUDIT_LOGS: Row[] = [
  { id: "l-1", actor_id: "u-0003", actor_name: "Rafiqul Islam", action: "limit_approved", entity_type: "card_request", entity_id: "q-1", reference_no: "CR-2026-0000141", before_data: { approved_limit: null }, after_data: { approved_limit: 450000 }, changed_fields: ["approved_limit", "status"], ip_address: "10.20.4.51", created_at: iso(180) },
  { id: "l-2", actor_id: "u-0002", actor_name: "Nusrat Jahan", action: "limit_set", entity_type: "card_request", entity_id: "q-2", reference_no: "CR-2026-0000142", before_data: { approved_limit: null }, after_data: { approved_limit: 250000 }, changed_fields: ["approved_limit"], ip_address: "10.20.4.33", created_at: iso(150) },
  { id: "l-3", actor_id: "u-0001", actor_name: "Tanvir Hasan", action: "submitted", entity_type: "card_request", entity_id: "q-3", reference_no: "CR-2026-0000143", before_data: { status: "draft" }, after_data: { status: "pending_checker" }, changed_fields: ["status"], ip_address: "10.20.4.19", created_at: iso(60) },
  { id: "l-4", actor_id: "u-0002", actor_name: "Nusrat Jahan", action: "returned", entity_type: "card_request", entity_id: "q-5", reference_no: "CR-2026-0000145", before_data: { status: "pending_checker" }, after_data: { status: "returned" }, changed_fields: ["status", "checker_remarks"], ip_address: "10.20.4.33", created_at: iso(25) },
  { id: "l-5", actor_id: "u-0001", actor_name: "Tanvir Hasan", action: "card_status_changed", entity_type: "card", entity_id: "k-3", reference_no: "446789******6677", before_data: { status: "active" }, after_data: { status: "hotlisted" }, changed_fields: ["status"], ip_address: "10.20.4.19", created_at: iso(1300) },
  { id: "l-6", actor_id: "u-0001", actor_name: "Tanvir Hasan", action: "bulk_upload", entity_type: "bulk_batch", entity_id: "b-3", reference_no: "prepaid-travel-quota.csv", before_data: null, after_data: { total_rows: 15, accepted_rows: 13 }, changed_fields: null, ip_address: "10.20.4.19", created_at: iso(160) },
];

export const INTEGRATION_LOGS: Row[] = [
  { id: "i-1", system: "CBS", direction: "outbound", operation: "create_cif", endpoint: "/cbs/v1/customers", request_id: "q-1", http_status: 201, success: true, latency_ms: 412, request_payload: { full_name: "Md. Arafat Rahman" }, response_payload: { cif_number: "CIF00458213" }, error_message: null, created_at: iso(310) },
  { id: "i-2", system: "CMS", direction: "outbound", operation: "create_client", endpoint: "/tranzware/clients", request_id: "q-1", http_status: 201, success: true, latency_ms: 638, request_payload: { cif: "CIF00458213" }, response_payload: { client_id: "CMS0000112" }, error_message: null, created_at: iso(300) },
  { id: "i-3", system: "CMS", direction: "outbound", operation: "issue_card", endpoint: "/tranzware/cards", request_id: "q-1", http_status: 201, success: true, latency_ms: 894, request_payload: { client_id: "CMS0000112", product: "VCC-PLT" }, response_payload: { masked: "446790******4458" }, error_message: null, created_at: iso(180) },
  { id: "i-4", system: "CBS", direction: "inbound", operation: "account_lookup", endpoint: "/cbs/v1/accounts/search", request_id: "q-3", http_status: 200, success: true, latency_ms: 221, request_payload: { tin: "990012337788" }, response_payload: { matches: 1 }, error_message: null, created_at: iso(62) },
  { id: "i-5", system: "CMS", direction: "outbound", operation: "update_limit", endpoint: "/tranzware/cards/limit", request_id: "q-2", http_status: 502, success: false, latency_ms: 3021, request_payload: { card: "446789******7890", limit: 250000 }, response_payload: null, error_message: "Upstream gateway timeout while updating card limit", created_at: iso(140) },
  { id: "i-6", system: "CMS", direction: "outbound", operation: "sync_status", endpoint: "/tranzware/cards/status", request_id: null, http_status: 200, success: true, latency_ms: 158, request_payload: { card: "446792******6677" }, response_payload: { status: "INACTIVE" }, error_message: null, created_at: iso(90) },
  { id: "i-7", system: "CBS", direction: "outbound", operation: "create_cif", endpoint: "/cbs/v1/customers", request_id: "q-5", http_status: 422, success: false, latency_ms: 502, request_payload: { nid: "1979887456120" }, response_payload: null, error_message: "Passport endorsement details incomplete", created_at: iso(28) },
];

export function seedTables(): Record<string, Row[]> {
  const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
  return {
    profiles: clone(PROFILES),
    user_roles: clone(USER_ROLES),
    card_products: clone(PRODUCTS),
    fee_profiles: clone(FEE_PROFILES),
    customers: clone(CUSTOMERS),
    card_requests: clone(CARD_REQUESTS),
    cards: clone(CARDS),
    request_approvals: clone(REQUEST_APPROVALS),
    bulk_batches: clone(BULK_BATCHES),
    audit_logs: clone(AUDIT_LOGS),
    integration_logs: clone(INTEGRATION_LOGS),
  };
}
