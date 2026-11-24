/**
 * RFC 4180 Compliant CSV Parser
 * Handles commas, quoted values, escaped quotes (""), newlines (\r\n, \n), and trims BOM.
 */
export function parseCSV(text: string): string[][] {
  // Strip UTF-8 BOM if present
  const cleanText = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  while (i < cleanText.length) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = "";
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i += 2;
        } else {
          i++;
        }
        currentRow.push(currentField.trim());
        currentField = "";
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        currentField = "";
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Handle final field and row
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Intelligent header mapper to match flexible CSV headers
 */
export interface HeaderMapping {
  nameIdx: number;
  categoryIdx: number;
  sellingPriceIdx: number;
  quantityIdx: number;
  purchasePriceIdx: number;
  thresholdIdx: number;
  perOffIdx: number;
  batchNoIdx: number;
  expiryDateIdx: number;
  creditStatusIdx: number;
}

export function detectHeaders(rawHeaders: string[]): {
  mapping: HeaderMapping;
  missingRequired: string[];
} {
  const normalized = rawHeaders.map((h) =>
    h.toLowerCase().replace(/["']/g, "").replace(/\s+/g, " ").trim()
  );

  const findIndex = (patterns: string[]): number => {
    return normalized.findIndex((header) =>
      patterns.some((p) => header === p || header.includes(p))
    );
  };

  const nameIdx = findIndex([
    "item / product name",
    "medicine name",
    "item name",
    "product name",
    "brand name",
    "medicine",
    "item",
    "name",
  ]);

  const categoryIdx = findIndex([
    "form / potency / specification",
    "specification",
    "generic name",
    "category",
    "generic",
    "form",
  ]);

  const sellingPriceIdx = findIndex([
    "per tab / unit selling price",
    "selling price (rs.)",
    "selling price",
    "retail price",
    "unit price",
    "selling",
    "price",
  ]);

  const quantityIdx = findIndex([
    "qty pur",
    "quantity",
    "total stock",
    "qty",
    "stock",
    "units",
  ]);

  const purchasePriceIdx = findIndex([
    "per tab / unit cost",
    "purchase price (rs.)",
    "purchase price",
    "purchase cost",
    "per pack cost",
    "total cost",
    "cost",
  ]);

  const thresholdIdx = findIndex([
    "low-stock threshold",
    "low stock threshold",
    "alert threshold",
    "threshold",
    "alert",
  ]);

  const perOffIdx = findIndex([
    "per off (%)",
    "per off",
    "peroff",
    "discount %",
    "discount",
  ]);

  const batchNoIdx = findIndex([
    "batch no",
    "batch number",
    "batch",
    "lot",
  ]);

  const expiryDateIdx = findIndex([
    "expiry date",
    "expiry",
    "exp date",
    "exp",
  ]);

  const creditStatusIdx = findIndex([
    "credit status",
    "is credit",
    "credit",
  ]);

  const missingRequired: string[] = [];
  if (nameIdx === -1) missingRequired.push("Medicine / Item Name (e.g. 'Name', 'Item / Product Name')");
  if (categoryIdx === -1) missingRequired.push("Category / Specification (e.g. 'Category', 'Form / Potency / Specification')");
  if (sellingPriceIdx === -1) missingRequired.push("Selling Price (e.g. 'Price', 'Selling Price', 'Per Tab / Unit Selling Price')");
  if (quantityIdx === -1) missingRequired.push("Quantity (QTY) (e.g. 'Quantity', 'QTY', 'Qty Pur', 'Stock')");

  return {
    mapping: {
      nameIdx,
      categoryIdx,
      sellingPriceIdx,
      quantityIdx,
      purchasePriceIdx,
      thresholdIdx,
      perOffIdx,
      batchNoIdx,
      expiryDateIdx,
      creditStatusIdx,
    },
    missingRequired,
  };
}
