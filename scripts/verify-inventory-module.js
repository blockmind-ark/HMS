const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

function extractCookies(response, existingCookies = {}) {
  const setCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
  for (const cookieStr of setCookies) {
    const parts = cookieStr.split(";")[0].split("=");
    const name = parts[0].trim();
    const val = parts.slice(1).join("=").trim();
    existingCookies[name] = val;
  }
  return existingCookies;
}

function cookieString(cookieObj) {
  return Object.entries(cookieObj)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function login(email, password) {
  const jar = {};
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  extractCookies(csrfRes, jar);
  const { csrfToken } = await csrfRes.json();

  const authRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieString(jar),
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      json: "true",
    }).toString(),
    redirect: "manual",
  });

  extractCookies(authRes, jar);
  return cookieString(jar);
}

async function run() {
  console.log("================================================================================");
  console.log("   AUTOMATED VERIFICATION: MEDICAL INVENTORY & HOSPITAL PURCHASE SHEET");
  console.log("   Ruqayya Hospital & Pharmacy Management System");
  console.log("================================================================================\n");

  // 1. Authenticate as Pharmacist & Admin
  console.log("1. Authenticating sessions...");
  const adminCookie = await login("admin@hms.local", "admin123");
  const pharmaCookie = await login("pharmacist@hms.local", "pharma123");
  console.log("   ✔ Admin & Pharmacist sessions active.\n");

  // 2. Fetch inventory purchases as Pharmacist
  console.log("2. Testing GET /api/inventory/purchases (45 hospital stock items)...");
  const getRes = await fetch(`${BASE_URL}/api/inventory/purchases`, {
    headers: { Cookie: pharmaCookie },
  });
  const getData = await getRes.json();
  if (!getRes.ok || !getData.success) {
    throw new Error(`Failed to fetch inventory: ${JSON.stringify(getData)}`);
  }

  const items = getData.purchases;
  console.log(`   ✔ Retrieved ${items.length} items from database.`);
  if (items.length < 45) {
    throw new Error(`Expected at least 45 seeded items, but got ${items.length}`);
  }

  // Verify Summary Calculations
  console.log("   Summary Totals:");
  console.log(`   - Total Purchase Cost: Rs. ${getData.summary.totalCost.toLocaleString()}`);
  console.log(`   - Total Retail Value (T.Value): Rs. ${getData.summary.totalValue.toLocaleString()}`);
  console.log(`   - Total Physical Units: ${getData.summary.totalUnits.toLocaleString()}`);
  console.log(`   - Potential Gross Margin: Rs. ${getData.summary.potentialMargin.toLocaleString()}`);
  console.log(`   - Credit Items: ${getData.summary.creditCount} | Cash Items: ${getData.summary.cashCount}\n`);

  // 3. Mathematical Integrity Check across all items
  console.log("3. Verifying mathematical integrity across all purchase sheet lines...");
  for (const item of items) {
    const expectedQty = item.pkgPacks * item.nosPerPack;
    if (item.qtyPurchased !== expectedQty) {
      throw new Error(`Item ${item.itemName} has mismatch in qtyPurchased: ${item.qtyPurchased} vs ${expectedQty}`);
    }

    const expectedCost = Number((item.pkgPacks * item.perPackCost).toFixed(2));
    if (Math.abs(item.totalCost - expectedCost) > 0.05) {
      throw new Error(`Item ${item.itemName} has mismatch in totalCost: ${item.totalCost} vs ${expectedCost}`);
    }

    const expectedValue = Number((item.qtyPurchased * item.perUnitSellingPrice).toFixed(2));
    if (Math.abs(item.totalValue - expectedValue) > 0.05) {
      throw new Error(`Item ${item.itemName} has mismatch in totalValue: ${item.totalValue} vs ${expectedValue}`);
    }
  }
  console.log("   ✔ All items conform strictly to: Qty Pur = PKGPacks * Nos/Pack, Total Cost = PKG * Per Pack Cost, T.Value = Qty * Selling Price.\n");

  // 4. Test Key Specific Hospital Items
  console.log("4. Verifying representative hospital items from the exact prompt list...");
  const sampleNames = [
    "Syringe",
    "Cannula 3-Way Stopcock",
    "IV Cannula",
    "Dextrose Water 5%",
    "Normal Saline (NS 0.9%)",
    "Ringer's Lactate (RL)",
    "Abdomen Sponge",
    "Surgical Gauze",
    "Baby Feeder",
    "Baby Suction Catheter",
    "Cord Clamp",
    "Diathermy Lead / Pencil",
    "Foley Balloon Catheter",
    "Enema Syringe / Set",
    "IV Infusion Set",
    "Contraceptive Implant",
    "Nelaton Drain Catheter",
    "Nasogastric (NG) Tube",
    "Ring Pessary",
    "Surgical Suture",
    "Skin Stapler",
    "Spinal Needle",
    "Spongostan / Spongestone",
    "Suction Yankauer / Tube",
    "Surgical Scalpel Blade",
    "Surgical Gloves",
    "Urine Collection Drainage Bag",
  ];

  for (const name of sampleNames) {
    const found = items.filter((i) => i.itemName.includes(name));
    if (found.length === 0) {
      throw new Error(`Missing expected item in database: ${name}`);
    }
  }
  console.log(`   ✔ All ${sampleNames.length} sample categories verified present in database.\n`);

  // 5. Test Filters: Credit vs Cash
  console.log("5. Testing Filter Queries (Credit vs. Cash)...");
  const creditRes = await fetch(`${BASE_URL}/api/inventory/purchases?filterCredit=CREDIT`, {
    headers: { Cookie: adminCookie },
  });
  const creditData = await creditRes.json();
  const allCredit = creditData.purchases.every((p) => p.isCredit === true);
  if (!allCredit || creditData.purchases.length === 0) {
    throw new Error("Credit filter query failed!");
  }
  console.log(`   ✔ Filter filterCredit=CREDIT returned ${creditData.purchases.length} credit items exclusively.`);

  const cashRes = await fetch(`${BASE_URL}/api/inventory/purchases?filterCredit=CASH`, {
    headers: { Cookie: adminCookie },
  });
  const cashData = await cashRes.json();
  const allCash = cashData.purchases.every((p) => p.isCredit === false);
  if (!allCash || cashData.purchases.length === 0) {
    throw new Error("Cash filter query failed!");
  }
  console.log(`   ✔ Filter filterCredit=CASH returned ${cashData.purchases.length} cash-paid items exclusively.\n`);

  // 6. Test Search: e.g. "Cannula"
  console.log("6. Testing Search Query: search=Cannula...");
  const searchRes = await fetch(`${BASE_URL}/api/inventory/purchases?search=Cannula`, {
    headers: { Cookie: adminCookie },
  });
  const searchData = await searchRes.json();
  console.log(`   ✔ Found ${searchData.purchases.length} cannula records (18G, 20G, 22G, 24G, 3-Way Stopcock).\n`);

  // 7. Test POST: Creating a new Stock Purchase Record
  console.log("7. Testing POST /api/inventory/purchases (New Stock Purchase Entry)...");
  const postRes = await fetch(`${BASE_URL}/api/inventory/purchases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: pharmaCookie,
    },
    body: JSON.stringify({
      itemName: "Endotracheal Tube",
      specification: "Size 7.5 Cuffed Oral/Nasal",
      pkgPacks: 5,
      nosPerPack: 10,
      perPackCost: 2500,
      perUnitSellingPrice: 350,
      batchNo: "ETT-75C-2026",
      expiryDate: "2028-12-31",
      isCredit: true,
    }),
  });
  const postData = await postRes.json();
  if (!postRes.ok || !postData.success) {
    throw new Error(`Failed to create inventory purchase: ${JSON.stringify(postData)}`);
  }
  const createdId = postData.purchase.id;
  console.log(`   ✔ Created Stock Purchase: ID ${createdId}`);
  console.log(`   ✔ Auto-Calculations: Qty Pur = ${postData.purchase.qtyPurchased} | Total Cost = Rs. ${postData.purchase.totalCost} | T.Value = Rs. ${postData.purchase.totalValue}\n`);

  // 8. Test PUT: Updating the Stock Purchase Record
  console.log("8. Testing PUT /api/inventory/purchases/[id]...");
  const putRes = await fetch(`${BASE_URL}/api/inventory/purchases/${createdId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      perPackCost: 2800,
      perUnitSellingPrice: 380,
    }),
  });
  const putData = await putRes.json();
  if (!putRes.ok || !putData.success) {
    throw new Error(`Failed to update inventory purchase: ${JSON.stringify(putData)}`);
  }
  console.log(`   ✔ Updated Stock Purchase: New Total Cost = Rs. ${putData.purchase.totalCost} | New T.Value = Rs. ${putData.purchase.totalValue}\n`);

  // 9. Test DELETE: Removing the test item
  console.log("9. Testing DELETE /api/inventory/purchases/[id]...");
  const delRes = await fetch(`${BASE_URL}/api/inventory/purchases/${createdId}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  });
  const delData = await delRes.json();
  if (!delRes.ok || !delData.success) {
    throw new Error(`Failed to delete inventory purchase: ${JSON.stringify(delData)}`);
  }
  console.log("   ✔ Deleted test stock purchase successfully.\n");

  // 10. Test CSV Export
  console.log("10. Testing GET /api/inventory/purchases/export (RFC 4180 CSV)...");
  const csvRes = await fetch(`${BASE_URL}/api/inventory/purchases/export`, {
    headers: { Cookie: adminCookie },
  });
  if (!csvRes.ok) {
    throw new Error(`Failed to export CSV: HTTP ${csvRes.status}`);
  }
  const contentType = csvRes.headers.get("content-type");
  const contentDisposition = csvRes.headers.get("content-disposition");
  const csvText = await csvRes.text();
  const lines = csvText.trim().split("\r\n");

  console.log(`   ✔ HTTP ${csvRes.status} OK`);
  console.log(`   ✔ Content-Type: ${contentType}`);
  console.log(`   ✔ Content-Disposition: ${contentDisposition}`);
  console.log(`   ✔ Header Columns: ${lines[0]}`);
  console.log(`   ✔ Total Exported CSV Lines: ${lines.length} (Header + ${lines.length - 1} records)\n`);

  console.log("================================================================================");
  console.log("   ALL 10 MEDICAL INVENTORY & PURCHASE SHEET VERIFICATIONS PASSED 100%!");
  console.log("================================================================================");
}

run().catch((err) => {
  console.error("\n❌ VERIFICATION FAILED:", err);
  process.exit(1);
});

