/** Claim type options shown in the wizard, filtered by policy category. */
export const CLAIM_TYPE_OPTIONS = [
  {
    id: "accident",
    label: "Accident",
    description: "Collision or road incident involving your vehicle",
    categories: ["auto"],
  },
  {
    id: "damage",
    label: "Damage",
    description: "Physical damage to property, vehicle, pet, or belongings",
    categories: ["home", "auto", "pet", "others"],
  },
  {
    id: "theft",
    label: "Theft",
    description: "Stolen vehicle, belongings, or property",
    categories: ["home", "auto", "others"],
  },
  {
    id: "medical",
    label: "Medical",
    description: "Health treatment, hospitalization, or medical expenses",
    categories: ["life"],
  },
  {
    id: "pet_care",
    label: "Pet care",
    description: "Veterinary treatment or pet-related incident",
    categories: ["pet"],
  },
  {
    id: "other",
    label: "Other",
    description: "Another claim type not listed above",
    categories: ["home", "auto", "life", "pet", "others"],
  },
] as const;

export function claimTypesForPolicyCategory(category: string | undefined) {
  const slug = category ?? "others";
  return CLAIM_TYPE_OPTIONS.filter((type) => type.categories.includes(slug as never));
}

export function attachmentLooksLikeCnic(fileName: string): boolean {
  return /cnic|nic|identity|id[-_\s]?card|national/i.test(fileName);
}

export function pendingFilesIncludeCnic(
  files: { file: File }[]
): boolean {
  return files.some((pf) => attachmentLooksLikeCnic(pf.file.name));
}
