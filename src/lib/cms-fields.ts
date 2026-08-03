/**
 * CMS / CBS client field dictionary — derived from the Tranzware CMS
 * "Private customer" screens (General, Addresses, Contacts, Registration,
 * Employment, User pages 1-11) and the developed middleware onboarding form.
 * Prototype only: option lists are representative, not exhaustive.
 */

export type FieldType = "text" | "number" | "date" | "select" | "checkbox" | "textarea";

export type FieldDef = {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: readonly string[];
  placeholder?: string;
  hint?: string;
  cms?: string; // CMS tab / page the value is written to
  wide?: boolean;
};

export type SectionDef = {
  id: string;
  title: string;
  caption: string;
  fields: FieldDef[];
};

export const OPT = {
  prefix: ["Mr.", "Mrs.", "Ms.", "Dr.", "MD.(52)", "Md.", "Engr."],
  title: ["Mr.", "Mrs.", "Ms.", "Dr.", "Prof."],
  sex: ["Male", "Female", "Other"],
  maritalStatus: ["Single", "Married", "Divorced", "Widowed"],
  nationality: ["BANGLADESH", "INDIA", "PAKISTAN", "NEPAL", "SRI LANKA", "OTHER"],
  country: ["BANGLADESH (50)", "INDIA", "UNITED KINGDOM", "USA", "OTHER"],
  resident: ["Resident", "Non-Resident"],
  division: ["DHAKA", "CHATTOGRAM", "RAJSHAHI", "KHULNA", "BARISHAL", "SYLHET", "RANGPUR", "MYMENSINGH"],
  district: ["DHAKA", "GAZIPUR", "CHATTOGRAM", "CHAPAI NAWABGANJ", "KHULNA", "SYLHET", "RANGPUR"],
  thana: ["KHILGAON", "GULSHAN", "DHANMONDI", "MOTIJHEEL", "CHAPAI NAWABGANJ SADAR", "KOTWALI"],
  region: ["DHAKA", "CHATTOGRAM", "RAJSHAHI", "KHULNA", "SYLHET"],
  occupation: ["Service (Private)", "Service (Government)", "Business", "Self Employed", "Housewife", "Student", "Retired"],
  sbs2: ["Service Holder(911000)", "Business(912000)", "Housewife(913000)", "Student(914000)"],
  kycRisk: ["01", "02", "03", "04", "05"],
  branch: [
    "MTB Tower Branch",
    "Principal Branch, Dhaka",
    "Gulshan Branch, Dhaka",
    "Dhanmondi Branch",
    "Agrabad Branch, Chattogram",
  ],
  taxZone: ["Zone-1, Dhaka", "Zone-4, Dhaka", "Zone-8, Dhaka", "Zone-1, Chattogram", "Zone-2, Rajshahi"],
  yearlyIncome: ["Below 300,000", "300,001 - 600,000", "600,001 - 1,200,000", "1,200,001 - 2,500,000", "Above 2,500,000"],
  routing: ["145274188 · MTB Tower", "145260435 · Principal", "145261722 · Gulshan", "145150324 · Agrabad"],
  accounts: ["0011340000123456 · Current", "0011320000998877 · Savings", "0011360000445566 · SND"],
  receiveCardFrom: ["Card Division, Head Office", "Branch", "Courier to Present Address", "Courier to Office"],
  sectorCode: ["Private Sector (Domestic)", "Public Sector", "Financial Institution", "Autonomous Body"],
  securityCode: ["Unsecured", "Lien on FDR", "Lien on Scheme Deposit", "Cash Covered"],
  applicationCode: ["Walk-in", "Sales Channel", "Digital Application", "Employee Banking"],
  rmDse: ["DSE-1042", "DSE-1187", "RM-2201", "RM-2288"],
  referringDivision: ["Card Division", "Retail Banking", "SME Banking", "Corporate Banking", "Privilege Banking"],
  sourcingChannel: ["Branch", "Direct Sales", "Digital / Website", "Corporate Tie-up", "Employee Referral"],
  customerSensitivity: ["Normal", "Sensitive", "PEP", "Staff"],
  corporateCompany: ["Not applicable", "MTB Group", "Beximco Ltd.", "Square Group", "Trust Textiles Ltd."],
  campaignCode: ["Not applicable", "CMP-EID-2026", "CMP-TRAVEL-2026", "CMP-SALARY-2026"],
  relationship: ["Spouse", "Son", "Daughter", "Father", "Mother", "Brother", "Sister"],
  ownershipOfCar: ["Own", "Family Owned", "Company Provided", "None"],
  otherCreditCards: ["No", "Yes — one bank", "Yes — multiple banks"],
  communicationAddress: ["Present Address", "Permanent Address", "Business Address"],
  lienType: ["Not applicable", "FDR", "Scheme Deposit", "Cash"],
  clientType: ["Private (Individual)", "Corporate", "Staff", "Prepaid Holder", "Supplementary"],
  clientStatus: ["Active", "Inactive", "Blocked", "Closed", "Pending"],
  currency: ["BDT (050)", "USD (840)", "EUR (978)", "GBP (826)"],
  language: ["English", "Bengali"],
  institution: ["MTB-CARDS-01", "MTB-CARDS-02"],
  clientCategory: ["Retail", "Payroll", "Privilege", "Islamic", "SME"],
  clientGroup: ["Default group", "Staff group", "Corporate group", "Campaign group"],
  statementCycle: ["Cycle 1 — 5th", "Cycle 2 — 15th", "Cycle 3 — 20th", "Cycle 4 — 25th"],
  statementMode: ["E-Statement", "Printed — Present Address", "Printed — Office", "Both"],
  deliveryMode: ["Branch pickup", "Courier", "Hand delivery", "Registered post"],
  blockCode: ["No block", "Temporary block", "Permanent block", "Fraud block"],
  riskCategory: ["Low", "Medium", "High"],
  yesNo: ["Yes", "No"],
  serviceGroup: ["Standard services", "Premium services", "Corporate services"],
  tariff: ["Retail tariff", "Staff tariff", "Corporate tariff", "Privilege tariff"],
  documentStatus: ["Complete", "Partially received", "Pending", "Waived"],
} as const;

/** CBS CIF + CMS Client ID capture, grouped exactly like the working screens. */
export const CLIENT_SECTIONS: SectionDef[] = [
  {
    id: "general",
    title: "General",
    caption: "CMS General tab · CBS CIF header",
    fields: [
      { name: "application_ref_no", label: "Application Ref. No.", required: true, cms: "General" },
      { name: "prefix", label: "Prefix / Title", type: "select", options: OPT.prefix, cms: "General" },
      { name: "first_name", label: "First Name", required: true, cms: "General" },
      { name: "middle_name", label: "Middle Name", cms: "General" },
      { name: "last_name", label: "Last Name", cms: "General" },
      { name: "full_name", label: "Full Name (CMS Name)", required: true, cms: "General", wide: true },
      { name: "name_transliteration", label: "Name Transliteration", required: true, cms: "General", wide: true },
      { name: "sex", label: "Sex / Gender", type: "select", options: OPT.sex, required: true, cms: "General" },
      { name: "date_of_birth", label: "Date of Birth", type: "date", required: true, cms: "General" },
      { name: "age", label: "Age", type: "number", required: true, cms: "General" },
      { name: "place_of_birth", label: "Place of Birth", required: true, cms: "General" },
      { name: "nationality", label: "Nationality", type: "select", options: OPT.nationality, required: true, cms: "General" },
      { name: "country", label: "Country", type: "select", options: OPT.country, required: true, cms: "General" },
      { name: "marital_status", label: "Marital Status", type: "select", options: OPT.maritalStatus, required: true, cms: "General" },
      { name: "spouse_prefix", label: "Spouse Prefix", type: "select", options: OPT.prefix, cms: "User p2" },
      { name: "spouse_name", label: "Spouse Name", cms: "User p2" },
      { name: "father_prefix", label: "Father's Name Prefix", type: "select", options: OPT.prefix, cms: "User p1" },
      { name: "father_name", label: "Father's Name", required: true, cms: "User p1" },
      { name: "mother_prefix", label: "Mother's Name Prefix", type: "select", options: OPT.prefix, cms: "User p1" },
      { name: "mother_name", label: "Mother's Name", required: true, cms: "User p1" },
    ],
  },
  {
    id: "identification",
    title: "Identification",
    caption: "CMS Registration & User page 2 · dedupe keys",
    fields: [
      { name: "nid_verified", label: "NID Verified", type: "select", options: ["Yes — VERIFIED", "No"], required: true, cms: "Registration" },
      { name: "national_id", label: "National ID (10/13/17 digit)", required: true, cms: "User p2" },
      { name: "national_id_10", label: "National ID (10 digit)", cms: "User p2" },
      { name: "birth_certificate", label: "Birth Certificate No. (BRC)", cms: "User p11" },
      { name: "personal_code", label: "Personal Code", required: true, cms: "Registration" },
      { name: "resident", label: "Resident status", type: "select", options: OPT.resident, required: true, cms: "Registration" },
      { name: "passport_no", label: "Passport No.", cms: "User p4" },
      { name: "pp_issue_date", label: "Passport Issue Date", type: "date", cms: "User p4" },
      { name: "pp_expiry_date", label: "Passport Expiry Date", type: "date", cms: "User p4" },
      { name: "pp_place_of_issue", label: "Place of Issue", cms: "User p4" },
      { name: "endorse_pp", label: "Endorse PP", cms: "User p4" },
      { name: "global_endorsement_limit", label: "Global Endorsement Limit", type: "number", cms: "User p4" },
      { name: "endorsement_expiry_date", label: "Endorsement Expiry Date", type: "date", cms: "User p4" },
    ],
  },
  {
    id: "contacts",
    title: "Contacts",
    caption: "CMS Contacts tab",
    fields: [
      { name: "mobile", label: "Mobile Phone (11 digit)", required: true, cms: "Contacts" },
      { name: "alt_mobile", label: "Alternate Mobile Number", cms: "Contacts" },
      { name: "email", label: "E-mail", required: true, cms: "Contacts" },
      { name: "telephone", label: "Telephone", cms: "Contacts" },
      { name: "fax", label: "FAX", cms: "Contacts" },
      { name: "correspondence_country", label: "Correspondence Country", type: "select", options: OPT.country, required: true, cms: "Contacts" },
      { name: "correspondence_region", label: "Correspondence Region", type: "select", options: OPT.region, required: true, cms: "Contacts" },
      { name: "correspondence_zip", label: "Correspondence ZIP Code", cms: "Contacts" },
      { name: "correspondence_address", label: "Correspondence Address", required: true, wide: true, cms: "Contacts" },
      { name: "communication_address", label: "Communication Address", type: "select", options: OPT.communicationAddress, required: true, cms: "Contacts" },
      { name: "e_statement", label: "E-Statement", type: "checkbox", cms: "User p9" },
    ],
  },
  {
    id: "present_address",
    title: "Present Address",
    caption: "CMS Addresses · customer residence",
    fields: [
      { name: "present_line1", label: "Address Line 1", required: true, wide: true },
      { name: "present_line2", label: "Address Line 2", wide: true },
      { name: "present_division", label: "Division", type: "select", options: OPT.division, required: true },
      { name: "present_district", label: "District", type: "select", options: OPT.district, required: true },
      { name: "present_thana", label: "Thana", type: "select", options: OPT.thana, required: true },
      { name: "present_city", label: "City", required: true },
      { name: "present_street", label: "Street" },
      { name: "present_house", label: "House" },
      { name: "present_flat", label: "Flat" },
      { name: "present_post_code", label: "Post Code / ZIP", required: true },
    ],
  },
  {
    id: "permanent_address",
    title: "Permanent Address",
    caption: "CMS Addresses · customer registration · User p1 (Permanent Address 1-3)",
    fields: [
      { name: "permanent_line1", label: "Permanent Address 1", required: true, wide: true },
      { name: "permanent_line2", label: "Permanent Address 2", required: true, wide: true },
      { name: "permanent_line3", label: "Permanent Address 3", wide: true },
      { name: "permanent_division", label: "Division", type: "select", options: OPT.division, required: true },
      { name: "permanent_district", label: "District", type: "select", options: OPT.district, required: true },
      { name: "permanent_thana", label: "Thana", type: "select", options: OPT.thana, required: true },
      { name: "permanent_city", label: "City", required: true },
      { name: "permanent_post_code", label: "Post Code / ZIP", required: true },
    ],
  },
  {
    id: "employment",
    title: "Employment & Business Address",
    caption: "CMS Employment tab",
    fields: [
      { name: "same_as_present", label: "Business address same as Present", type: "checkbox" },
      { name: "same_as_permanent", label: "Business address same as Permanent", type: "checkbox" },
      { name: "company", label: "Company / Organization", required: true, wide: true },
      { name: "designation_department", label: "Designation / Department", required: true, wide: true },
      { name: "employee_no", label: "Employee No." },
      { name: "position", label: "Position" },
      { name: "office_phone", label: "Office Phone" },
      { name: "employed_since", label: "Employed Since", type: "date" },
      { name: "previous_employment", label: "Previous Employment", wide: true },
      { name: "business_line1", label: "Business Address Line 1", required: true, wide: true },
      { name: "business_line2", label: "Business Address Line 2", wide: true },
      { name: "business_division", label: "Division", type: "select", options: OPT.division },
      { name: "business_district", label: "District", type: "select", options: OPT.district },
      { name: "business_thana", label: "Thana", type: "select", options: OPT.thana },
      { name: "occupation", label: "Occupation", type: "select", options: OPT.occupation, required: true },
      { name: "profession", label: "Profession", cms: "User p3" },
      { name: "sector_code", label: "Sector Code", type: "select", options: OPT.sectorCode, required: true, cms: "User p6" },
      { name: "sbs2_code", label: "SBS2 Code", type: "select", options: OPT.sbs2, required: true },
    ],
  },
  {
    id: "tax",
    title: "Tax & Income",
    caption: "CMS User page 2 & 3",
    fields: [
      { name: "tin", label: "e-TIN (16 digit)", required: true, cms: "User p2" },
      { name: "tax_circle", label: "Tax Circle", required: true, cms: "User p2" },
      { name: "tax_zone", label: "Taxes Zone", type: "select", options: OPT.taxZone, required: true, cms: "User p2" },
      { name: "tax_assessment_year", label: "Tax Assessment Year", cms: "User p2" },
      { name: "serial_return_register", label: "Serial in Return Register", cms: "User p2" },
      { name: "return_submission_date", label: "Return Submission Date", type: "date", cms: "User p2" },
      { name: "monthly_income", label: "Monthly Income", type: "number", required: true },
      { name: "yearly_income", label: "Yearly Income", type: "select", options: OPT.yearlyIncome, cms: "User p3" },
      { name: "kyc_risk_score", label: "KYC Risk Score", type: "select", options: OPT.kycRisk, required: true },
    ],
  },
  {
    id: "banking",
    title: "Payment Instruction & Bank",
    caption: "CMS User page 3 & 4",
    fields: [
      { name: "cc_payment_instruction_tk", label: "Credit Card Payment Instruction (TK)", cms: "User p3" },
      { name: "account_no_tk", label: "Account Number (TK)", type: "select", options: OPT.accounts, cms: "User p3" },
      { name: "cc_payment_instruction_fc", label: "Credit Card Payment Instruction ($)", cms: "User p3" },
      { name: "account_no_fc", label: "Account Number ($)", cms: "User p4" },
      { name: "bank_account_name", label: "Bank Account Name", cms: "User p4", wide: true },
      { name: "bank_name", label: "Bank Name", cms: "User p4" },
      { name: "branch_name", label: "Branch Name", cms: "User p4" },
      { name: "branch_routing_no", label: "Branch Routing No.", type: "select", options: OPT.routing, required: true, cms: "User p4" },
      { name: "reference_account", label: "Reference Account", cms: "User p7" },
      { name: "approved_fc_rate", label: "Approved $ Rate for FC Card", type: "number", cms: "User p10" },
    ],
  },
  {
    id: "card_admin",
    title: "Card Administration",
    caption: "CMS User pages 6, 7 & 10",
    fields: [
      { name: "name_on_card", label: "Name on Card", required: true, wide: true },
      { name: "rm_dse_code", label: "RM / DSE Code", type: "select", options: OPT.rmDse, required: true, cms: "User p6" },
      { name: "referral_code", label: "Referral Code", cms: "User p6" },
      { name: "credit_card_file_no", label: "Credit Card File Number", required: true, cms: "User p6" },
      { name: "receive_card_from", label: "Receive Card From", type: "select", options: OPT.receiveCardFrom, required: true, cms: "User p6" },
      { name: "receive_card_branch", label: "Branch Name to Receive Card", type: "select", options: OPT.branch, cms: "User p6" },
      { name: "branch_code", label: "CIF Booking Branch", type: "select", options: OPT.branch, required: true },
      { name: "security_code", label: "Security Code", type: "select", options: OPT.securityCode, required: true, cms: "User p7" },
      { name: "crm_for_cib", label: "CRM for CIB", cms: "User p7" },
      { name: "ownership_of_car", label: "Ownership of Car", type: "select", options: OPT.ownershipOfCar, cms: "User p7" },
      { name: "other_credit_cards", label: "Other Credit Cards", type: "select", options: OPT.otherCreditCards, cms: "User p7" },
      { name: "application_code", label: "Application Code", type: "select", options: OPT.applicationCode, cms: "User p7" },
      { name: "application_receive_date", label: "Application Receive Date @ Cards", type: "date", cms: "User p7" },
      { name: "application_accepted_date", label: "Application Accepted Date from CM", type: "date", cms: "User p7" },
      { name: "referring_division", label: "Referring Division", type: "select", options: OPT.referringDivision, cms: "User p10" },
      { name: "sourcing_channel", label: "Sourcing Channel", type: "select", options: OPT.sourcingChannel, required: true, cms: "User p10" },
      { name: "customer_sensitivity", label: "Customer Sensitivity", type: "select", options: OPT.customerSensitivity, cms: "User p10" },
      { name: "corporate_company", label: "Corporate Company", type: "select", options: OPT.corporateCompany, cms: "User p10" },
      { name: "campaign_code", label: "Campaign Code", type: "select", options: OPT.campaignCode, cms: "User p10" },
      { name: "lien_amount", label: "Lien Amount", type: "number", cms: "User p10" },
      { name: "lien_type", label: "Lien Type", type: "select", options: OPT.lienType, cms: "User p10" },
    ],
  },
  {
    id: "nominee",
    title: "Nominee & PA",
    caption: "CMS User page 9",
    fields: [
      { name: "nominee_name", label: "MPP Nominee Name", cms: "User p9" },
      { name: "nominee_relationship", label: "Relationship with Nominee", type: "select", options: OPT.relationship, cms: "User p9" },
      { name: "nominee_dob", label: "Nominee Date of Birth", type: "date", cms: "User p9" },
      { name: "pa_referred_by", label: "PA Referred By", cms: "User p9" },
      { name: "pa_proposed_by", label: "PA Proposed By", cms: "User p9" },
      { name: "cepp_com_id", label: "CEPP COM ID", cms: "User p9" },
      { name: "saarc", label: "SAARC endorsement", type: "checkbox", cms: "User p9" },
      { name: "non_saarc", label: "NON-SAARC endorsement", type: "checkbox", cms: "User p9" },
      { name: "passport_renewal_date", label: "Passport Renewal Date", type: "date", cms: "User p9" },
    ],
  },
  {
    id: "cms_data",
    title: "CMS Data",
    caption:
      "Remaining Tranzware CMS screen fields not covered above — client record header, servicing, statement, delivery, block and audit attributes",
    fields: [
      // Client record header
      { name: "cms_client_id", label: "CMS Client ID", cms: "Client", hint: "Generated by CMS" },
      { name: "cms_cif_number", label: "CBS CIF Number", cms: "Client" },
      { name: "cms_client_type", label: "Client Type", type: "select", options: OPT.clientType, required: true, cms: "Client" },
      { name: "cms_client_status", label: "Client Status", type: "select", options: OPT.clientStatus, required: true, cms: "Client" },
      { name: "cms_institution_id", label: "Institution ID", type: "select", options: OPT.institution, required: true, cms: "Client" },
      { name: "cms_agent_branch", label: "Agent / Servicing Branch", type: "select", options: OPT.branch, required: true, cms: "Client" },
      { name: "cms_client_category", label: "Client Category", type: "select", options: OPT.clientCategory, cms: "Client" },
      { name: "cms_client_group", label: "Client Group", type: "select", options: OPT.clientGroup, cms: "Client" },
      { name: "cms_base_currency", label: "Base Currency", type: "select", options: OPT.currency, required: true, cms: "Client" },
      { name: "cms_language", label: "Correspondence Language", type: "select", options: OPT.language, cms: "Client" },
      { name: "cms_registration_date", label: "Registration Date", type: "date", cms: "Registration" },
      { name: "cms_relationship_start", label: "Relationship Start Date", type: "date", cms: "Registration" },
      { name: "cms_external_ref", label: "External Reference No.", cms: "Registration" },

      // Servicing & tariff
      { name: "cms_service_group", label: "Service Group", type: "select", options: OPT.serviceGroup, cms: "Services" },
      { name: "cms_tariff_plan", label: "Tariff / Fee Plan", type: "select", options: OPT.tariff, cms: "Services" },
      { name: "cms_vip_flag", label: "VIP Client", type: "select", options: OPT.yesNo, cms: "Services" },
      { name: "cms_sms_alert", label: "SMS Alert Service", type: "checkbox", cms: "Services" },
      { name: "cms_internet_banking", label: "Internet / App Banking Access", type: "checkbox", cms: "Services" },
      { name: "cms_ecom_enabled", label: "E-commerce Transactions Enabled", type: "checkbox", cms: "Services" },
      { name: "cms_intl_usage", label: "International Usage Enabled", type: "checkbox", cms: "Services" },
      { name: "cms_contactless", label: "Contactless Enabled", type: "checkbox", cms: "Services" },

      // Statement & delivery
      { name: "cms_statement_cycle", label: "Statement Cycle", type: "select", options: OPT.statementCycle, cms: "Statement" },
      { name: "cms_statement_mode", label: "Statement Delivery Mode", type: "select", options: OPT.statementMode, cms: "Statement" },
      { name: "cms_statement_address", label: "Statement Address", type: "select", options: OPT.communicationAddress, cms: "Statement" },
      { name: "cms_card_delivery_mode", label: "Card Delivery Mode", type: "select", options: OPT.deliveryMode, cms: "Delivery" },
      { name: "cms_pin_delivery_mode", label: "PIN Delivery Mode", type: "select", options: OPT.deliveryMode, cms: "Delivery" },
      { name: "cms_delivery_contact", label: "Delivery Contact Person", cms: "Delivery" },
      { name: "cms_delivery_instruction", label: "Delivery Instruction", wide: true, cms: "Delivery" },

      // Risk, block & compliance
      { name: "cms_risk_category", label: "Risk Category", type: "select", options: OPT.riskCategory, cms: "Compliance" },
      { name: "cms_pep_flag", label: "PEP / Sanction Screening Cleared", type: "checkbox", cms: "Compliance" },
      { name: "cms_fatca_flag", label: "FATCA Declaration Received", type: "checkbox", cms: "Compliance" },
      { name: "cms_document_status", label: "Document Status", type: "select", options: OPT.documentStatus, cms: "Compliance" },
      { name: "cms_kyc_review_date", label: "Next KYC Review Date", type: "date", cms: "Compliance" },
      { name: "cms_block_code", label: "Block Code", type: "select", options: OPT.blockCode, cms: "Blocking" },
      { name: "cms_block_reason", label: "Block Reason", wide: true, cms: "Blocking" },
      { name: "cms_block_date", label: "Block Date", type: "date", cms: "Blocking" },

      // Audit / maker-checker trail
      { name: "cms_maker_id", label: "Maker ID", cms: "Audit" },
      { name: "cms_checker_id", label: "Checker ID", cms: "Audit" },
      { name: "cms_created_at", label: "Record Created On", type: "date", cms: "Audit" },
      { name: "cms_modified_at", label: "Record Last Modified On", type: "date", cms: "Audit" },
      { name: "cms_remarks", label: "CMS Remarks / Notes", wide: true, cms: "Audit" },
    ],
  },
];

export const DEDUPE_KEYS = [
  { value: "nid", label: "NID", hint: "10 / 13 / 17 digit", maxLength: 17 },
  { value: "tin", label: "e-TIN", hint: "16 digit", maxLength: 16 },
  { value: "passport", label: "Passport", hint: "8 digit", maxLength: 9 },
  { value: "mobile", label: "Mobile", hint: "11 digit", maxLength: 14 },
  { value: "brc", label: "Birth Certificate", hint: "16 digit + DOB", maxLength: 17 },
  { value: "account", label: "A/C No.", hint: "16 digit", maxLength: 17 },
  { value: "name", label: "Name", hint: "up to 120 char + DOB", maxLength: 120 },
] as const;

export type DedupeKey = (typeof DEDUPE_KEYS)[number]["value"];

export const DEDUPE_ACTIONS = [
  { value: "create_cif_client", label: "Create CIF & Client ID", when: "Not found in CBS and not found in CMS" },
  { value: "create_cif_update_client", label: "Create CIF & Update Client ID", when: "Found in CMS only" },
  { value: "create_client_update_cif", label: "Create Client ID & Update CIF", when: "Found in CBS only" },
  { value: "update_cif_client", label: "Update CIF & Client ID", when: "Found in both CBS and CMS" },
] as const;

export type DedupeAction = (typeof DEDUPE_ACTIONS)[number]["value"];

export function recommendedAction(hasCbs: boolean, hasCms: boolean): DedupeAction {
  if (hasCbs && hasCms) return "update_cif_client";
  if (hasCbs) return "create_client_update_cif";
  if (hasCms) return "create_cif_update_client";
  return "create_cif_client";
}