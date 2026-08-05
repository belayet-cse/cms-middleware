export type MtbCard = {
  slug: string;
  name: string;
  scheme: "VISA" | "MASTERCARD" | "UNIONPAY";
  tier: string;
  blurb: string;
  image: string;
  features: string[];
  eligibility: string[];
  limitBand: string;
};

/** MTB credit card line-up, mirroring mutualtrustbank.com/cards/credit-card/. */
export const MTB_CREDIT_CARDS: MtbCard[] = [
  {
    slug: "unionpay-diamond",
    name: "MTB UnionPay Diamond Credit Card",
    scheme: "UNIONPAY",
    tier: "Diamond",
    blurb: "Top-tier UnionPay proposition with global lounge and dining privileges.",
    image: "https://www.mutualtrustbank.com/wp-content/uploads/2025/05/mtb-unionpay-diamond-credit-card-face.png",
    limitBand: "BDT 1,000,000 – 2,000,000",
    features: [
      "Unlimited domestic and selected international lounge access",
      "Concierge desk for travel, dining and hotel bookings",
      "Highest MRewardz earn rate on overseas spend",
      "Complimentary travel insurance cover",
      "Dual-currency (BDT / USD) usage with endorsement",
    ],
    eligibility: [
      "Monthly income BDT 200,000 and above",
      "Age 25–65 years for principal applicants",
      "Minimum 3 years of continuous employment or business",
      "Satisfactory CIB report and clean repayment history",
      "Valid NID, e-TIN and passport for the USD limit",
    ],
  },
  {
    slug: "classic",
    name: "MTB Classic Credit Card",
    scheme: "VISA",
    tier: "Classic",
    blurb: "Entry-level chip-and-PIN card for everyday retail spending.",
    image: "https://www.mutualtrustbank.com/wp-content/uploads/2021/10/Visa-Classic-Credit-Card-2021-update.png",
    limitBand: "BDT 25,000 – 100,000",
    features: [
      "EMV chip-and-PIN security on every transaction",
      "Up to 45 days interest-free credit period",
      "Free supplementary card for immediate family",
      "FlexiPay instalment on selected merchants",
      "SMS and email alerts on each posting",
    ],
    eligibility: [
      "Monthly income from BDT 25,000",
      "Age 21–65 years for principal applicants",
      "Minimum 1 year of employment or business",
      "Valid NID and e-TIN",
      "Satisfactory CIB report",
    ],
  },
  {
    slug: "gold",
    name: "MTB Gold Credit Card",
    scheme: "MASTERCARD",
    tier: "Gold",
    blurb: "Mid-segment card with higher limits and instalment purchase support.",
    image: "https://www.mutualtrustbank.com/wp-content/uploads/2026/01/MTB-mastercard-gold-credit-card.jpg",
    limitBand: "BDT 100,000 – 300,000",
    features: [
      "Higher limit band than Classic with the same fee structure",
      "0% interest EMI at partner outlets",
      "Buy-one-get-one dining offers at selected restaurants",
      "Cash advance facility at MTB and partner ATMs",
      "Auto-debit settlement from an MTB account",
    ],
    eligibility: [
      "Monthly income from BDT 40,000",
      "Age 21–65 years for principal applicants",
      "Minimum 1 year of employment or business",
      "Valid NID and e-TIN",
      "Satisfactory CIB report",
    ],
  },
  {
    slug: "mastercard-titanium",
    name: "MTB Mastercard Titanium Credit Card",
    scheme: "MASTERCARD",
    tier: "Titanium",
    blurb: "Dual-interface EMV card with contactless and FlexiPay eligibility.",
    image: "https://www.mutualtrustbank.com/wp-content/uploads/2020/07/MTB_credit_mastercard_titanium.png",
    limitBand: "BDT 200,000 – 500,000",
    features: [
      "Contactless tap-and-pay on dual-interface EMV chip",
      "FlexiPay instalment conversion on large purchases",
      "Priority customer service desk",
      "Balance transfer at a reduced rate",
      "Global acceptance on the Mastercard network",
    ],
    eligibility: [
      "Monthly income from BDT 60,000",
      "Age 21–65 years for principal applicants",
      "Minimum 2 years of employment or business",
      "Valid NID and e-TIN",
      "Satisfactory CIB report",
    ],
  },
  {
    slug: "mastercard-world",
    name: "MTB Mastercard World Credit Card",
    scheme: "MASTERCARD",
    tier: "World",
    blurb: "Premium travel card with worldwide acceptance and concierge benefits.",
    image: "https://www.mutualtrustbank.com/wp-content/uploads/2026/01/mtb-mastercard-world-credit-card-26.jpg",
    limitBand: "BDT 800,000 – 1,500,000",
    features: [
      "Worldwide airport lounge access programme",
      "24/7 World concierge and travel assistance",
      "Enhanced MRewardz accrual on travel and dining",
      "Purchase protection on eligible transactions",
      "Dual-currency limit for international travel",
    ],
    eligibility: [
      "Monthly income BDT 150,000 and above",
      "Age 25–65 years for principal applicants",
      "Minimum 3 years of employment or business",
      "Valid NID, e-TIN and passport",
      "Satisfactory CIB report",
    ],
  },
  {
    slug: "unionpay-platinum",
    name: "MTB UnionPay Platinum Credit Card",
    scheme: "UNIONPAY",
    tier: "Platinum",
    blurb: "UnionPay platinum card tuned for regional travel and e-commerce.",
    image: "https://www.mutualtrustbank.com/wp-content/uploads/2020/04/Credit-Card.png",
    limitBand: "BDT 300,000 – 700,000",
    features: [
      "Wide acceptance across China and East Asia",
      "Discounts at UnionPay partner merchants",
      "Secure 3-D Secure online checkout",
      "Regional lounge privileges",
      "Dual-currency usage for travel",
    ],
    eligibility: [
      "Monthly income from BDT 80,000",
      "Age 21–65 years for principal applicants",
      "Minimum 2 years of employment or business",
      "Valid NID, e-TIN and passport for USD limit",
      "Satisfactory CIB report",
    ],
  },
  {
    slug: "visa-platinum",
    name: "MTB VISA Platinum Credit Card",
    scheme: "VISA",
    tier: "Platinum",
    blurb: "Platinum privileges with MRewardz points and companion dining.",
    image: "https://www.mutualtrustbank.com/wp-content/uploads/2026/01/mtb-visa-platinum-credit-card-26.jpg",
    limitBand: "BDT 400,000 – 800,000",
    features: [
      "MRewardz points on every eligible transaction",
      "Companion dining and lifestyle offers",
      "Domestic lounge access at selected airports",
      "FlexiPay instalment and balance transfer",
      "Free supplementary cards for family",
    ],
    eligibility: [
      "Monthly income from BDT 100,000",
      "Age 21–65 years for principal applicants",
      "Minimum 2 years of employment or business",
      "Valid NID and e-TIN",
      "Satisfactory CIB report",
    ],
  },
  {
    slug: "visa-signature",
    name: "MTB Visa Signature Credit Card",
    scheme: "VISA",
    tier: "Signature",
    blurb: "Signature tier for high-value clients with the highest limit band.",
    image: "https://www.mutualtrustbank.com/wp-content/uploads/2025/09/mtb-visa-signatire-card-new-25.jpg",
    limitBand: "BDT 1,500,000 and above",
    features: [
      "Highest limit band in the MTB Visa line-up",
      "Visa Signature global concierge service",
      "Unlimited lounge visits under the Visa programme",
      "Premium hotel and airline partner offers",
      "Dedicated relationship service desk",
    ],
    eligibility: [
      "Monthly income BDT 250,000 and above",
      "Age 25–65 years for principal applicants",
      "Minimum 3 years of employment or business",
      "Valid NID, e-TIN and passport",
      "Excellent CIB record with no classified exposure",
    ],
  },
];

export function getMtbCard(slug: string): MtbCard | undefined {
  return MTB_CREDIT_CARDS.find((c) => c.slug === slug);
}
