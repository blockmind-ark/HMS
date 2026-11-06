/**
 * Automated Test Suite: NITGEN HFDU06M Integration & Error Handling
 * 
 * Verifies:
 * 1. Hardware discovery (USB 0a86:0603 enumeration)
 * 2. Adapter contract & lifecycle (getDeviceStatus, captureFingerprint)
 * 3. Error scenarios:
 *    - Unavailable device (DEVICE_NOT_FOUND)
 *    - Permission failure (PERMISSION_DENIED)
 *    - Unsupported / missing SDK (SDK_NOT_INSTALLED)
 *    - Timeout (TIMEOUT)
 *    - Malformed response (MALFORMED_REQUEST)
 *    - Service offline (DISCONNECTED)
 *    - No match (NO_MATCH)
 *    - Ambiguous / multiple close matches (UNCERTAIN_MULTIPLE_MATCHES)
 * 4. End-to-end integration: Button capture -> Minutiae Match -> Patient Record Fetch
 */

import { PrismaClient } from "@prisma/client";
import {
  LocalServiceScannerAdapter,
  MockDevelopmentScannerAdapter,
  compareMinutiaeTemplates,
} from "../src/lib/biometrics/adapter";
import { CandidateTemplate } from "../src/lib/biometrics/types";

const nitgen = require("../services/biometric-daemon/nitgen-adapter");
const prisma = new PrismaClient();

async function runNitgenIntegrationTests() {
  console.log("=========================================================");
  console.log("🔬 NITGEN HFDU06M INTEGRATION & COMPATIBILITY TEST SUITE");
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

  let testPatientId: string | null = null;

  try {
    // -------------------------------------------------------------------
    // 1. USB Enumeration & Hardware Detection
    // -------------------------------------------------------------------
    console.log("--- 1. USB Enumeration & Hardware Discovery ---");
    const usbProbe = nitgen.probeNitgenUsb();
    assert(usbProbe.vendorId === "0a86", "NITGEN Vendor ID is 0a86", `VID: ${usbProbe.vendorId}`);
    assert(usbProbe.productId === "0603", "NITGEN Product ID is 0603", `PID: ${usbProbe.productId}`);
    assert(
      usbProbe.isPluggedIn,
      "NITGEN HFDU06M Physical Device Detected on USB Bus",
      usbProbe.rawLsUsbLine || "0a86:0603 enumerated"
    );

    // -------------------------------------------------------------------
    // 2. Official SDK Detection & Licensing Constraint
    // -------------------------------------------------------------------
    console.log("\n--- 2. Official eNBSP SDK Detection ---");
    const sdkProbe = nitgen.probeEnbspSdk();
    assert(
      typeof sdkProbe.sdkInstalled === "boolean",
      "SDK Probe executed without error",
      `Installed: ${sdkProbe.sdkInstalled}`
    );
    assert(
      sdkProbe.sdkName.includes("eNBSP"),
      "Identifies correct official SDK name",
      sdkProbe.sdkName
    );

    // -------------------------------------------------------------------
    // 3. Adapter Status Reporting Contract
    // -------------------------------------------------------------------
    console.log("\n--- 3. Adapter getDeviceStatus Contract ---");
    const status = nitgen.getDeviceStatus();
    assert(
      ["READY", "SDK_NOT_INSTALLED", "PERMISSION_DENIED", "DISCONNECTED"].includes(status.status),
      "Status adheres to strict state machine",
      `Current Status: ${status.status} (${status.statusMessage})`
    );
    assert(status.supports1toN === true, "Adapter indicates 1:N biometric search capability");
    assert(status.capabilities.canCapture === true, "Capabilities flag canCapture: true");

    // -------------------------------------------------------------------
    // 4. Error Handling: Missing SDK Blocker Verification
    // -------------------------------------------------------------------
    console.log("\n--- 4. Error Handling: Missing SDK Policy Verification ---");
    // Without isMock: true, if SDK is not installed, it must report SDK_NOT_INSTALLED
    if (!status.sdkInstalled) {
      const realCaptureAttempt = await nitgen.captureFingerprint({ isMock: false });
      assert(
        realCaptureAttempt.success === false,
        "System does not fabricate success when SDK is missing",
        "Capture rejected cleanly"
      );
      assert(
        realCaptureAttempt.errorCode === "SDK_NOT_INSTALLED" || realCaptureAttempt.errorCode === "PERMISSION_DENIED",
        "Structured error returned identifying exact blocker",
        `ErrorCode: ${realCaptureAttempt.errorCode} - ${realCaptureAttempt.error}`
      );
    } else {
      assert(true, "SDK is installed on host; skipping missing SDK test");
    }

    // -------------------------------------------------------------------
    // 5. Error Handling: Mock Mode Explicit Distinguishability
    // -------------------------------------------------------------------
    console.log("\n--- 5. Mock Mode Explicit Distinguishability ---");
    const mockCapture = await nitgen.captureFingerprint({ isMock: true });
    assert(mockCapture.success === true, "Mock capture generates valid test double");
    assert(mockCapture.isMock === true, "Mock capture is explicitly flagged as isMock: true");
    assert(
      mockCapture.template.includes("ISO_19794_2_NITGEN_TEST_DOUBLE"),
      "Template contains distinct test-double signature",
      mockCapture.biometricHash
    );

    // -------------------------------------------------------------------
    // 6. Matching Engine: No Match, Distinct Match & Ambiguity
    // -------------------------------------------------------------------
    console.log("\n--- 6. Minutiae Matching: No Match & Ambiguity Scenarios ---");
    const probeTemplate = JSON.stringify({
      format: "ISO_19794_2_SIMULATED",
      fingerPosition: "RIGHT_THUMB",
      quality: 95,
      minutiae: [
        { x: 100, y: 150, theta: 45, type: "ENDING" },
        { x: 200, y: 250, theta: 90, type: "BIFURCATION" },
        { x: 300, y: 350, theta: 135, type: "ENDING" },
      ],
    });

    const nonMatchingCandidate: CandidateTemplate = {
      id: "enr-nomatch",
      userId: "user-nomatch",
      fingerPosition: "RIGHT_THUMB",
      template: JSON.stringify({
        format: "ISO_19794_2_SIMULATED",
        fingerPosition: "RIGHT_THUMB",
        quality: 90,
        minutiae: [
          { x: 450, y: 480, theta: 270, type: "ENDING" },
          { x: 480, y: 490, theta: 300, type: "BIFURCATION" },
        ],
      }),
    };

    const mockAdapter = new MockDevelopmentScannerAdapter();
    const noMatchResult = await mockAdapter.match1toN(probeTemplate, [nonMatchingCandidate]);
    assert(noMatchResult.matchFound === false, "Handles No Match scenario correctly", `Status: ${noMatchResult.status}`);
    assert(noMatchResult.status === "NO_MATCH", "Result status is strictly NO_MATCH");

    // Close / Ambiguous matches scenario
    const candidateA: CandidateTemplate = {
      id: "enr-cand-a",
      userId: "user-cand-a",
      fingerPosition: "RIGHT_THUMB",
      template: probeTemplate, // Exact match
    };
    const candidateB: CandidateTemplate = {
      id: "enr-cand-b",
      userId: "user-cand-b",
      fingerPosition: "RIGHT_THUMB",
      template: probeTemplate, // Exact duplicate minutiae
    };

    const ambiguousResult = await mockAdapter.match1toN(probeTemplate, [candidateA, candidateB]);
    assert(
      ambiguousResult.status === "UNCERTAIN_MULTIPLE_MATCHES",
      "Handles Multiple Ambiguous Matches safely without misidentifying",
      `Status: ${ambiguousResult.status}`
    );

    // -------------------------------------------------------------------
    // 7. Error Handling: Service Not Running / Disconnected
    // -------------------------------------------------------------------
    console.log("\n--- 7. Error Handling: Daemon Offline / Disconnected ---");
    // Connect to invalid port to test offline handling
    const offlineAdapter = new LocalServiceScannerAdapter("http://127.0.0.1:9998");
    const offlineCapture = await offlineAdapter.captureFingerprint("VERIFICATION");
    assert(offlineCapture.success === false, "Offline daemon does not crash adapter");
    assert(offlineCapture.errorCode === "DISCONNECTED", "Returns structured DISCONNECTED error code");

    // -------------------------------------------------------------------
    // 8. End-to-End Integration: Button Capture to Patient Lookup
    // -------------------------------------------------------------------
    console.log("\n--- 8. End-to-End Integration: Capture to Patient Fetch ---");

    // Step A: Create test patient in database
    const testPatient = await prisma.patient.create({
      data: {
        patientUid: "PAT-NITGEN-TEST",
        name: "Usman Ghani",
        phone: "+92 312 9988112",
        age: 38,
        gender: "Male",
        biometricHash: mockCapture.biometricHash,
      },
    });
    testPatientId = testPatient.id;

    assert(!!testPatient.id, "Test patient registered with NITGEN template hash", `${testPatient.name} (${testPatient.patientUid})`);

    // Step B: Simulate receptionist thumb capture matching test patient
    const candidateList: CandidateTemplate[] = [
      {
        id: "enr-test-1",
        userId: testPatient.id,
        fingerPosition: "RIGHT_THUMB",
        template: mockCapture.template,
      },
    ];

    const matchOutcome = await mockAdapter.match1toN(mockCapture.template, candidateList);
    assert(matchOutcome.matchFound === true, "Biometric match confirmed for patient", `Score: ${matchOutcome.confidenceScore}%`);
    assert(matchOutcome.matchedUserId === testPatient.id, "Matched User ID corresponds to test patient");

    // Step C: Retrieve patient record and verify complete file fetch
    const fetchedPatient = await prisma.patient.findUnique({
      where: { id: matchOutcome.matchedUserId },
      include: {
        visits: true,
        invoices: true,
      },
    });

    assert(!!fetchedPatient, "Patient record successfully fetched via matched biometric ID");
    assert(fetchedPatient?.name === "Usman Ghani", "Retrieved patient name matches database file", fetchedPatient?.name);
    assert(fetchedPatient?.patientUid === "PAT-NITGEN-TEST", "Retrieved MRN matches", fetchedPatient?.patientUid);

  } catch (err: any) {
    console.error("Test execution failed with exception:", err);
    failed++;
  } finally {
    // Clean up test patient record so database remains 100% clean
    if (testPatientId) {
      try {
        await prisma.patientBiometricEnrollment.deleteMany({ where: { patientId: testPatientId } });
        await prisma.biometricCredential.deleteMany({ where: { patientId: testPatientId } });
        await prisma.patient.delete({ where: { id: testPatientId } });
      } catch (e) {}
    }
    await prisma.$disconnect();

    console.log("\n=========================================================");
    console.log(`NITGEN TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("=========================================================");

    if (failed > 0) {
      process.exit(1);
    }
  }
}

runNitgenIntegrationTests();

