export function resolveMedicineCategory(itemName: string, spec: string = "", customCategory: string = ""): string {
  if (customCategory && customCategory.trim().length > 0 && customCategory.toLowerCase() !== "general") {
    return customCategory.trim();
  }

  const text = `${itemName} ${spec}`.toLowerCase();
  if (text.includes("tab") || text.includes("cap") || text.includes("tablet") || text.includes("capsule")) {
    return "Tablets & Capsules";
  }
  if (
    text.includes("susp") ||
    text.includes("syrup") ||
    text.includes("120ml") ||
    text.includes("60ml") ||
    text.includes("liquid") ||
    text.includes("elixir") ||
    text.includes("solution")
  ) {
    return "Syrups & Suspensions";
  }
  if (text.includes("inj") || text.includes("ampoule") || text.includes("infusion") || text.includes("vial")) {
    return "Injections & Ampoules";
  }
  if (text.includes("cream") || text.includes("gel") || text.includes("ointment") || text.includes("lotion")) {
    return "Creams & Ointments";
  }
  if (text.includes("inhaler") || text.includes("resp") || text.includes("nebul")) {
    return "Inhalers & Respiratory";
  }
  if (text.includes("sachet") || text.includes("powder")) {
    return "Sachets & Nutritional";
  }
  if (text.includes("drop")) return "Eye & Ear Drops";
  return "General Medicines";
}
