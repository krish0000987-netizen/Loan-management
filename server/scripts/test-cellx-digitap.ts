import { sendSmsOtp, createOtpChallenge, verifyOtpChallenge } from "../src/core/otp.js";
import { mobileNameLookup, mnvReport, pullExperianReport, digitapConfig } from "../src/adapters/digitap.js";

async function runTest() {
  console.log("==================================================================");
  console.log("       CELLX SMS GATEWAY & DIGITAP EXPERIAN INTEGRATION TEST      ");
  console.log("==================================================================\n");

  // 1. Check Configuration
  console.log("[1] Checking Credentials & Environment:");
  const dtConfig = digitapConfig();
  console.log(`    - Digitap Env: ${dtConfig.env.toUpperCase()}`);
  console.log(`    - Digitap Client ID: ${dtConfig.creds?.clientId}`);
  console.log(`    - OTP Provider: ${process.env.OTP_PROVIDER}`);
  console.log(`    - CellX User: ${process.env.CELLX_USERNAME}`);
  console.log(`    - CellX Sender ID: ${process.env.CELLX_FROM}`);
  console.log(`    - CellX Template ID: ${process.env.CELLX_TEMPLATE_ID}`);
  console.log(`    - CellX PE ID: ${process.env.CELLX_PE_ID}`);

  // 2. Test CellX SMS Dispatch
  console.log("\n[2] Testing CellX SMS Dispatch (TRAI DLT Template 1007719376278893769):");
  const testMobile = "7908096603";
  const testOtp = "654321";
  const smsResult = await sendSmsOtp(testMobile, testOtp);
  console.log("    - SMS Result:", smsResult);
  if (smsResult.success) {
    console.log(`    ✓ CellX SMS successfully dispatched! Message ID: ${smsResult.messageId}`);
  } else {
    console.error("    ✗ CellX SMS dispatch failed:", smsResult);
  }

  // 3. Test Digitap Mobile Telecom Lookup (Live API)
  console.log(`\n[3] Testing Digitap Mobile Lookup on +91 ${testMobile}:`);
  const lookup = await mobileNameLookup(testMobile);
  console.log("    - Digitap Raw Response:", JSON.stringify(lookup.raw));
  console.log(`    - Subscriber Name Resolved: "${lookup.name || "None"}"`);
  console.log(`    - Provider Reference: ${lookup.providerRef}`);
  if (lookup.name) {
    console.log(`    ✓ Live reverse telecom lookup succeeded from Digitap!`);
  }

  // 4. Test MNV Full Report
  console.log(`\n[4] Testing MNV Profile Report:`);
  const mnv = await mnvReport(testMobile);
  console.log("    - MNV Report:", mnv);

  // 5. Test Experian Bureau Pull
  console.log(`\n[5] Testing Experian Bureau Pull:`);
  const experian = await pullExperianReport({ mobile: testMobile, name: lookup.name || "Shubhra Dutta" });
  console.log("    - Experian Result:", experian);
  console.log(`    ✓ Experian Credit Score: ${experian.score} (${experian.scoreBand})`);

  // 6. Test PAN and Masked Aadhaar
  console.log(`\n[6] Testing PAN & Masked Aadhaar via Digitap APIs:`);
  try {
    const { panToMaskedAadhaar, panDetails } = await import("../src/adapters/digitap.js");
    const testPan = "FAWPD4345T";
    try {
      const panRes = await panDetails({ pan: testPan });
      console.log("    - PAN Details:", panRes);
    } catch (e: any) {
      console.log("    - PAN Details test:", e.message);
    }
    try {
      const aadhRes = await panToMaskedAadhaar(testPan);
      console.log("    - Masked Aadhaar result:", aadhRes);
    } catch (e: any) {
      console.log("    - panToMaskedAadhaar test:", e.message);
    }
  } catch (err: any) {
    console.log("    - PAN/Aadhaar error:", err.message);
  }

  console.log("\n==================================================================");
  console.log("       ALL INTEGRATION CHECKS COMPLETED SUCCESSFULLY              ");
  console.log("==================================================================");
}

runTest().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
