export type MtbCard = {
  name: string;
  scheme: "VISA" | "MASTERCARD" | "UNIONPAY";
  tier: string;
  blurb: string;
  image: string;
};

/** MTB credit card line-up, mirroring mutualtrustbank.com/cards/credit-card/. */
export const MTB_CREDIT_CARDS: MtbCard[] = [
  {
    name: "MTB UnionPay Diamond Credit Card",
    scheme: "UNIONPAY",
    tier: "Diamond",
    blurb: "Top-tier UnionPay proposition with global lounge and dining privileges.",
    image:
      "https://www.mutualtrustbank.com/wp-content/uploads/2025/05/mtb-unionpay-diamond-credit-card-face.png",
  },
  {
    name: "MTB Classic Credit Card",
    scheme: "VISA",
    tier: "Classic",
    blurb: "Entry-level chip-and-PIN card for everyday retail spending.",
    image:
      "https://www.mutualtrustbank.com/wp-content/uploads/2021/10/Visa-Classic-Credit-Card-2021-update.png",
  },
  {
    name: "MTB Gold Credit Card",
    scheme: "MASTERCARD",
    tier: "Gold",
    blurb: "Mid-segment card with higher limits and instalment purchase support.",
    image:
      "https://www.mutualtrustbank.com/wp-content/uploads/2026/01/MTB-mastercard-gold-credit-card.jpg",
  },
  {
    name: "MTB Mastercard Titanium Credit Card",
    scheme: "MASTERCARD",
    tier: "Titanium",
    blurb: "Dual-interface EMV card with contactless and FlexiPay eligibility.",
    image:
      "https://www.mutualtrustbank.com/wp-content/uploads/2020/07/MTB_credit_mastercard_titanium.png",
  },
  {
    name: "MTB Mastercard World Credit Card",
    scheme: "MASTERCARD",
    tier: "World",
    blurb: "Premium travel card with worldwide acceptance and concierge benefits.",
    image:
      "https://www.mutualtrustbank.com/wp-content/uploads/2026/01/mtb-mastercard-world-credit-card-26.jpg",
  },
  {
    name: "MTB UnionPay Platinum Credit Card",
    scheme: "UNIONPAY",
    tier: "Platinum",
    blurb: "UnionPay platinum card tuned for regional travel and e-commerce.",
    image: "https://www.mutualtrustbank.com/wp-content/uploads/2020/04/Credit-Card.png",
  },
  {
    name: "MTB VISA Platinum Credit Card",
    scheme: "VISA",
    tier: "Platinum",
    blurb: "Platinum privileges with MRewardz points and companion dining.",
    image:
      "https://www.mutualtrustbank.com/wp-content/uploads/2026/01/mtb-visa-platinum-credit-card-26.jpg",
  },
  {
    name: "MTB Visa Signature Credit Card",
    scheme: "VISA",
    tier: "Signature",
    blurb: "Signature tier for high-value clients with the highest limit band.",
    image:
      "https://www.mutualtrustbank.com/wp-content/uploads/2025/09/mtb-visa-signatire-card-new-25.jpg",
  },
];
