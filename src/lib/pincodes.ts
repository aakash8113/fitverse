/**
 * Serviceable pincodes for Fitverse deliveries (Vadodara, Gujarat).
 * Key   = 6-digit pincode string
 * Value = human-readable area name shown to the user
 */
export const SERVICEABLE_PINCODES: Record<string, string> = {
  "390001": "Raopura, Mandvi, Baranpura, Khanderao Market",
  "390002": "Fategunj, Pratapgunj, Sayajigunj, MS University",
  "390003": "Gorwa, Panchvati",
  "390004": "Pratapnagar, Danteshwar",
  "390005": "Jawaharnagar",
  "390006": "Fatepura, Warasia",
  "390007": "Alkapuri, Race Course, Akota",
  "390008": "Sama, EME",
  "390009": "Tarsali, Sharadnagar",
  "390010": "Vadsar, Makarpura GIDC",
  "390011": "Manjalpur",
  "390012": "Atladara, Tandalja, Vasna Road",
  "390013": "Maneja",
  "390014": "Makarpura, Jambua",
  "390015": "Fertilizer Nagar",
  "390017": "Wadi, Panigate",
  "390018": "Karelibaug, Sangam",
  "390019": "Ajwa Road, Sayajipura",
  "390020": "Akota (South)",
  "390021": "Gotri Road, Harinagar",
  "390022": "Harni, Airport Area",
  "390023": "Subhanpura, Ellora Park",
  "390024": "New Sama Road, Chhani Road",
  "390025": "Waghodia Road (City side), Soma Talav",
  "391760": "Parul University, Limda, Waghodia Village area",
  "391101": "Sevasi, Bhayli (Western growth)",
  "391410": "Bhayli, Bill, Chapad",
  "391310": "Bajwa, Karachiya",
  "391740": "Chhani Village, Dashrath, Dumad",
  "391243": "Por, Itola",
  "391330": "Angadh, Ankodia",
};

/** Returns the area name if the pincode is serviceable, otherwise null. */
export function getPincodeArea(pincode: string): string | null {
  return SERVICEABLE_PINCODES[pincode.trim()] ?? null;
}

/** Returns true if we deliver to this pincode. */
export function isServiceable(pincode: string): boolean {
  return (pincode?.trim() ?? '') in SERVICEABLE_PINCODES;
}
