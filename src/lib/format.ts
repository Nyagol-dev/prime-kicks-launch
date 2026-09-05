export function ksh(amount: number): string {
  return `Ksh ${amount.toLocaleString("en-KE")}`;
}

export const BRAND = {
  name: "Prime Kicks KE",
  tagline: "Step In. Stand Out. Step Different.",
  phone: "0798718785",
  whatsapp: "254798718785",
  social: "prime_kicks_ke",
  pickup: "Platinum Plaza, 3rd Floor, Shop 305, Nairobi, Kenya",
} as const;
