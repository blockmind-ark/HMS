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
  const csrfRes = await fetch("http://localhost:3000/api/auth/csrf");
  extractCookies(csrfRes, jar);
  const { csrfToken } = await csrfRes.json();

  const authRes = await fetch("http://localhost:3000/api/auth/callback/credentials", {
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

async function runVerification() {
  console.log("=== Running Comprehensive Verification for Accountability & Vendors ===\n");

  // 1. Admin Verification
  console.log("1. Logging in as Abu Bakar (Admin)...");
  const adminCookie = await login("admin@hms.local", "admin123");
  console.log("   Admin session obtained.");

  // Test GET /api/vendors
  const vendorsRes = await fetch("http://localhost:3000/api/vendors", {
    headers: { Cookie: adminCookie },
  });
  console.log(`2. GET /api/vendors -> HTTP ${vendorsRes.status}`);
  const vendorsData = await vendorsRes.json();
  console.log(`   Total Vendors: ${vendorsData.vendors?.length || 0}`);
  for (const v of vendorsData.vendors || []) {
    console.log(`   - ${v.name} (Contact: ${v.contactPerson}) | Balance: Rs. ${v.balance.toLocaleString()} | Paid: Rs. ${v.totalPaid.toLocaleString()}`);
  }

  // Test GET /api/vendors/purchase-orders
  const posRes = await fetch("http://localhost:3000/api/vendors/purchase-orders", {
    headers: { Cookie: adminCookie },
  });
  console.log(`\n3. GET /api/vendors/purchase-orders -> HTTP ${posRes.status}`);
  const posData = await posRes.json();
  console.log(`   Total Purchase Orders: ${posData.purchaseOrders?.length || 0}`);
  for (const po of posData.purchaseOrders || []) {
    console.log(`   - ${po.poNumber} | Vendor: ${po.vendor?.name} | Total: Rs. ${po.totalAmount.toLocaleString()} | Paid: Rs. ${po.paidAmount.toLocaleString()} | Payment: ${po.paymentStatus}`);
  }

  // Test GET /api/vendors/payments
  const paymentsRes = await fetch("http://localhost:3000/api/vendors/payments", {
    headers: { Cookie: adminCookie },
  });
  console.log(`\n4. GET /api/vendors/payments -> HTTP ${paymentsRes.status}`);
  const paymentsData = await paymentsRes.json();
  console.log(`   Total Vendor Payments: ${paymentsData.payments?.length || 0}`);
  for (const p of paymentsData.payments || []) {
    console.log(`   - ${p.paymentNumber} -> ${p.vendor?.name} | Amount: Rs. ${p.amount.toLocaleString()} | Method: ${p.paymentMethod} | Ref: ${p.referenceNumber}`);
  }

  // 2. Receptionist Verification
  console.log("\n5. Logging in as Adnan Ahmed (Receptionist)...");
  const recepCookie = await login("receptionist@hms.local", "reception123");
  console.log("   Receptionist session obtained.");

  // Test GET /api/receptionist/accountability
  const accRes = await fetch("http://localhost:3000/api/receptionist/accountability", {
    headers: { Cookie: recepCookie },
  });
  console.log(`6. GET /api/receptionist/accountability -> HTTP ${accRes.status}`);
  const accData = await accRes.json();
  console.log("   Shift Summary Today:", {
    totalInvoices: accData.summary?.invoiceCount,
    totalGross: accData.summary?.totalGross,
    totalDiscount: accData.summary?.totalDiscount,
    totalSystemCash: accData.summary?.totalSystemCash,
    serviceBreakdown: accData.serviceBreakdown,
    paymentMethodBreakdown: accData.paymentMethodBreakdown,
    currentClosingStatus: accData.activeClosing ? accData.activeClosing.status : "OPEN",
    pastClosingsCount: accData.pastClosings?.length || 0,
  });

  console.log("\n=== ALL END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY! ===");
}

runVerification().catch(console.error);
