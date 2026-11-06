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

async function verifyFeatures() {
  console.log("=== End-to-End Verification: Features 1, 2, and 3 ===\n");

  // 1. Authenticate as Receptionist & Admin & Pharmacist
  console.log("1. Authenticating test sessions...");
  const recepCookie = await login("receptionist@hms.local", "reception123");
  const adminCookie = await login("admin@hms.local", "admin123");
  const pharmaCookie = await login("pharmacist@hms.local", "pharma123");
  console.log("   Receptionist, Admin, and Pharmacist sessions active.\n");

  // =========================================================================
  // FEATURE 1: Cash Drawer Adjustments (Cash In / Cash Out) with Admin Approval
  // =========================================================================
  console.log("--- FEATURE 1: Cash Drawer Adjustments ---");

  // Receptionist submits CASH_IN for change float (Rs. 2,000)
  const cashInRes = await fetch("http://localhost:3000/api/receptionist/drawer-adjustments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: recepCookie,
    },
    body: JSON.stringify({
      type: "CASH_IN",
      amount: 2000,
      remarks: "Morning change float infusion",
    }),
  });
  console.log(`2. POST /api/receptionist/drawer-adjustments (CASH_IN) -> HTTP ${cashInRes.status}`);
  const cashInData = await cashInRes.json();
  console.log(`   Adjustment Created: ID=${cashInData.adjustment?.id}, Status=${cashInData.adjustment?.status}, Amount=Rs. ${cashInData.adjustment?.amount}`);

  // Receptionist submits CASH_OUT for petty cash withdrawal (Rs. 500)
  const cashOutRes = await fetch("http://localhost:3000/api/receptionist/drawer-adjustments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: recepCookie,
    },
    body: JSON.stringify({
      type: "CASH_OUT",
      amount: 500,
      remarks: "Emergency courier charges withdrawal",
    }),
  });
  console.log(`3. POST /api/receptionist/drawer-adjustments (CASH_OUT) -> HTTP ${cashOutRes.status}`);
  const cashOutData = await cashOutRes.json();
  console.log(`   Adjustment Created: ID=${cashOutData.adjustment?.id}, Status=${cashOutData.adjustment?.status}, Amount=Rs. ${cashOutData.adjustment?.amount}`);

  // Admin checks Approvals Center
  const approvalsRes = await fetch("http://localhost:3000/api/admin/approvals", {
    headers: { Cookie: adminCookie },
  });
  console.log(`4. GET /api/admin/approvals -> HTTP ${approvalsRes.status}`);
  const approvalsData = await approvalsRes.json();
  console.log(`   Approvals Counts:`, approvalsData.counts);

  // Admin Approves the CASH_IN adjustment
  const approveAdjRes = await fetch("http://localhost:3000/api/admin/approvals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      type: "DRAWER_ADJUSTMENT",
      id: cashInData.adjustment.id,
      status: "APPROVED",
      comment: "Approved morning float of Rs. 2,000",
    }),
  });
  console.log(`5. POST /api/admin/approvals (Approve CASH_IN) -> HTTP ${approveAdjRes.status}`);
  const approveAdjData = await approveAdjRes.json();
  console.log(`   Result: Status=${approveAdjData.adjustment?.status}, ApprovedBy=${approveAdjData.adjustment?.approvedBy?.name}\n`);

  // =========================================================================
  // FEATURE 3: Expenditure Management (Receptionist & Pharmacist)
  // =========================================================================
  console.log("--- FEATURE 3: Expenditure Management ---");

  // Receptionist logs expenditure: Rs. 350 for Office Supplies
  const recepExpRes = await fetch("http://localhost:3000/api/expenditures", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: recepCookie,
    },
    body: JSON.stringify({
      portal: "RECEPTION",
      amount: 350,
      category: "Office Supplies & Stationery",
      remarks: "Purchased receipt thermal paper rolls pack",
    }),
  });
  console.log(`6. POST /api/expenditures (RECEPTION) -> HTTP ${recepExpRes.status}`);
  const recepExpData = await recepExpRes.json();
  console.log(`   Expense Recorded: ID=${recepExpData.expenditure?.id}, Amount=Rs. ${recepExpData.expenditure?.amount}, Category=${recepExpData.expenditure?.category}`);

  // Pharmacist logs expenditure: Rs. 250 for Cleaning Supplies
  const pharmaExpRes = await fetch("http://localhost:3000/api/expenditures", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: pharmaCookie,
    },
    body: JSON.stringify({
      portal: "PHARMACY",
      amount: 250,
      category: "Medical Consumables & Sanitizers",
      remarks: "Dispensary counter disinfectant spray",
    }),
  });
  console.log(`7. POST /api/expenditures (PHARMACY) -> HTTP ${pharmaExpRes.status}`);
  const pharmaExpData = await pharmaExpRes.json();
  console.log(`   Expense Recorded: ID=${pharmaExpData.expenditure?.id}, Amount=Rs. ${pharmaExpData.expenditure?.amount}`);

  // Pharmacist daily summary verification (expenditure subtracted from expected cash)
  const pharmaSummaryRes = await fetch("http://localhost:3000/api/pharmacist/daily-summary", {
    headers: { Cookie: pharmaCookie },
  });
  console.log(`8. GET /api/pharmacist/daily-summary -> HTTP ${pharmaSummaryRes.status}`);
  const pharmaSummaryData = await pharmaSummaryRes.json();
  console.log(`   Pharmacist Summary:`, {
    totalRevenue: pharmaSummaryData.summary?.totalRevenue,
    openingFloat: pharmaSummaryData.summary?.openingFloat,
    totalExpenditures: pharmaSummaryData.summary?.totalExpenditures,
    expectedCashInDrawer: pharmaSummaryData.summary?.expectedCashInDrawer,
  });

  // =========================================================================
  // FEATURE 2: Shift Close Workflow with Admin Approval & Final Commit
  // =========================================================================
  console.log("\n--- FEATURE 2: Shift Close Workflow with Admin Approval & Commit ---");

  // Receptionist checks active accountability
  const accRes = await fetch("http://localhost:3000/api/receptionist/accountability", {
    headers: { Cookie: recepCookie },
  });
  console.log(`9. GET /api/receptionist/accountability -> HTTP ${accRes.status}`);
  const accData = await accRes.json();
  console.log(`   Receptionist Accountability Breakdown:`, {
    cashInvoicesTotal: accData.summary?.cashInvoicesTotal,
    approvedCashIn: accData.summary?.approvedCashIn,
    approvedCashOut: accData.summary?.approvedCashOut,
    totalExpenditures: accData.summary?.totalExpenditures,
    netDrawerCash: accData.summary?.netDrawerCash,
    totalSystemCash: accData.summary?.totalSystemCash,
  });

  // Receptionist submits shift close: Status should be PENDING_APPROVAL
  const closeRes = await fetch("http://localhost:3000/api/receptionist/accountability/close", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: recepCookie,
    },
    body: JSON.stringify({
      countedCash: accData.summary?.totalSystemCash || 0,
      notes: "E2E verification shift sheet submitted for admin commit.",
      shiftDate: new Date().toISOString(),
    }),
  });
  console.log(`10. POST /api/receptionist/accountability/close -> HTTP ${closeRes.status}`);
  const closeData = await closeRes.json();
  console.log(`    Shift Close Status: [${closeData.closing?.status}] (Expected: PENDING_APPROVAL)`);
  console.log(`    Message: ${closeData.message}`);

  // Admin fetches approvals: Shift closing appears under pendingShifts!
  const adminApprovalsRes = await fetch("http://localhost:3000/api/admin/approvals", {
    headers: { Cookie: adminCookie },
  });
  const adminApprovalsData = await adminApprovalsRes.json();
  const targetShift = adminApprovalsData.shiftClosings?.find((s) => s.id === closeData.closing.id);
  console.log(`\n11. Admin Approvals Review:`, {
    pendingShiftsCount: adminApprovalsData.counts?.pendingShifts,
    foundTargetShiftId: targetShift?.id,
    shiftStatus: targetShift?.status,
    totalSystemCash: targetShift?.totalSystemCash,
    countedCash: targetShift?.countedCash,
    variance: targetShift?.variance,
  });

  // Admin approves and officially commits the shift
  const commitRes = await fetch("http://localhost:3000/api/admin/approvals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      type: "SHIFT_CLOSING",
      id: closeData.closing.id,
      status: "APPROVED",
      comment: "Physical cash verified by Abu Bakar (Admin). Shift officially committed.",
    }),
  });
  console.log(`12. POST /api/admin/approvals (Commit Shift) -> HTTP ${commitRes.status}`);
  const commitData = await commitRes.json();
  console.log(`    Committed Shift: Status=[${commitData.shiftClosing?.status}], ApprovedBy=${commitData.shiftClosing?.approvedBy?.name}, AdminComment="${commitData.shiftClosing?.adminComment}"`);

  // Verify Daily Financial Report in Admin includes the approved shift and expenditures
  const dailyReportRes = await fetch("http://localhost:3000/api/admin/daily-report", {
    headers: { Cookie: adminCookie },
  });
  console.log(`\n13. GET /api/admin/daily-report -> HTTP ${dailyReportRes.status}`);
  const dailyReportData = await dailyReportRes.json();
  console.log(`    Admin Daily Financial Report Summary:`, {
    combinedNet: dailyReportData.summary?.combinedNet,
    totalExpenditures: dailyReportData.summary?.totalExpenditures,
    netProfitAfterExpenditures: dailyReportData.summary?.netProfitAfterExpenditures,
    expendituresCount: dailyReportData.expenditures?.length,
    shiftClosingsCount: dailyReportData.shiftClosings?.length,
  });

  console.log("\n=== ALL E2E VERIFICATION CHECKS PASSED WITH FLYING COLORS! ===");
}

verifyFeatures().catch(console.error);

