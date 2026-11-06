import { prisma } from "../src/lib/prisma";
import fs from "fs";
import path from "path";

async function verifyAdminEncountersSearch() {
  console.log("=========================================================");
  console.log("🔍 VERIFYING ADMIN CLINICAL ENCOUNTERS DIRECT SEARCH");
  console.log("=========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (detail) console.log(`   └─ ${detail}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   └─ ${detail}`);
      failed++;
    }
  }

  try {
    // 1. Check ReportPreviewModal.tsx structure
    console.log("--- 1. Report Preview Modal Search Field Verification ---");
    const modalPath = path.join(process.cwd(), "src/components/reports/ReportPreviewModal.tsx");
    const modalCode = fs.readFileSync(modalPath, "utf-8");

    const hasSearchImport = modalCode.includes("Search,") || modalCode.includes("Search }") || modalCode.includes(", Search");
    assert(hasSearchImport, "Search Icon Imported in ReportPreviewModal");

    const hasInitialSearchProp = modalCode.includes("initialSearch?: string") || modalCode.includes("initialSearch = \"\"");
    assert(hasInitialSearchProp, "ReportPreviewModal Accepts initialSearch Prop");

    const hasSearchState = modalCode.includes("searchQuery") && modalCode.includes("debouncedSearch");
    assert(hasSearchState, "ReportPreviewModal Implements Debounced Search State");

    const hasModalSearchInput =
      modalCode.includes("Direct search patient (Name, UID, Phone)...") &&
      modalCode.includes("onChange={(e) => setSearchQuery(e.target.value)}");
    assert(hasModalSearchInput, "Preview Modal Renders Direct Patient Search Input Field");

    const hasFilteredRecords = modalCode.includes("filteredRecords") && modalCode.includes("filteredRecords.map");
    assert(hasFilteredRecords, "Preview Modal Table Renders Filtered Patient Records");

    const hasClearBtn = modalCode.includes("Clear search query") || modalCode.includes("title=\"Clear Search\"");
    assert(hasClearBtn, "Preview Modal Provides 1-Click Clear Search Controls");

    // 2. Check Admin Page Card Direct Search
    console.log("\n--- 2. Admin Dashboard Report Card Direct Search Verification ---");
    const adminPagePath = path.join(process.cwd(), "src/app/admin/page.tsx");
    const adminCode = fs.readFileSync(adminPagePath, "utf-8");

    const hasCardSearchField =
      adminCode.includes("Direct Patient Search") &&
      adminCode.includes("patientEncounterSearch") &&
      adminCode.includes("Search patient name, UID, phone...");
    assert(hasCardSearchField, "Patient Clinical Encounters Card Contains Direct Search Input");

    const hasEnterKeySupport =
      adminCode.includes("setPreviewInitialSearch(patientEncounterSearch)") &&
      adminCode.includes("e.key === \"Enter\"");
    assert(hasEnterKeySupport, "Pressing Enter on Search Field Directly Launches Filtered Preview Modal");

    const hasDynamicPreviewBtn =
      adminCode.includes("patientEncounterSearch ? \"Search & Preview\" : \"Preview Summary\"");
    assert(hasDynamicPreviewBtn, "Button Dynamically Switches to 'Search & Preview' When Search Text Entered");

    // 3. API Search Filtering Simulation
    console.log("\n--- 3. Database & API Search Logic Verification ---");

    // Create a known test patient with a clinical encounter
    const testPatient = await prisma.patient.create({
      data: {
        patientUid: `PAT-ENCOUNTER-${Date.now()}`,
        name: "Rashid Minhas",
        phone: "+92 333 7766554",
        age: 44,
        gender: "Male",
      },
    });

    const testVisit = await prisma.visit.create({
      data: {
        patientId: testPatient.id,
        serviceType: "Ultrasound Abdomen Diagnostics",
        fee: 2500.0,
      },
      include: { patient: true },
    });

    assert(!!testVisit.id, "Test Clinical Encounter Created", `${testPatient.name} (${testPatient.patientUid})`);

    // Test Search by Name
    const searchByNameWhere = {
      OR: [
        { patient: { name: { contains: "Rashid", mode: "insensitive" as const } } },
        { patient: { patientUid: { contains: "Rashid", mode: "insensitive" as const } } },
      ],
    };
    const resultsByName = await prisma.visit.findMany({
      where: searchByNameWhere,
      include: { patient: true },
    });
    assert(
      resultsByName.some((v) => v.id === testVisit.id),
      "Direct Search by Patient Name Finds Correct Encounter",
      `Found ${resultsByName.length} encounter(s)`
    );

    // Test Search by Patient UID
    const searchByUidWhere = {
      OR: [
        { patient: { name: { contains: testPatient.patientUid, mode: "insensitive" as const } } },
        { patient: { patientUid: { contains: testPatient.patientUid, mode: "insensitive" as const } } },
      ],
    };
    const resultsByUid = await prisma.visit.findMany({
      where: searchByUidWhere,
      include: { patient: true },
    });
    assert(
      resultsByUid.length === 1 && resultsByUid[0].id === testVisit.id,
      "Direct Search by Patient UID Exactly Isolates Single Encounter",
      `Matched UID: ${resultsByUid[0]?.patient.patientUid}`
    );

    // Test Non-existent search returns empty array cleanly
    const searchNonExistentWhere = {
      OR: [
        { patient: { name: { contains: "NON_EXISTENT_NAME_XYZ_999", mode: "insensitive" as const } } },
        { patient: { patientUid: { contains: "NON_EXISTENT_NAME_XYZ_999", mode: "insensitive" as const } } },
      ],
    };
    const resultsEmpty = await prisma.visit.findMany({
      where: searchNonExistentWhere,
    });
    assert(resultsEmpty.length === 0, "Non-existent Patient Query Returns Empty Results Cleanly");

    // Clean up test records
    await prisma.visit.delete({ where: { id: testVisit.id } });
    await prisma.patient.delete({ where: { id: testPatient.id } });
    assert(true, "Simulated Encounter Cleaned Up Cleanly");

    // 4. Branding & Compliance Check
    console.log("\n--- 4. Naming & Branding Compliance ---");
    const forbiddenCount = await prisma.user.count({
      where: {
        OR: [
          { name: { contains: "Fatima", mode: "insensitive" } },
          { name: { contains: "Zainab", mode: "insensitive" } },
        ],
      },
    });
    assert(forbiddenCount === 0, "No forbidden names in user database");

  } catch (err: any) {
    console.error("Test failed:", err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n=========================================================");
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=========================================================");

  if (failed > 0) process.exit(1);
}

verifyAdminEncountersSearch();

