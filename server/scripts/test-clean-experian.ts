import { pullExperianReport } from "../src/adapters/digitap.js";

async function run() {
  const targetMobile = process.argv[2] || "7908096603";
  const targetOtp = process.argv[3] || "123456";
  const targetName = process.argv[4] || "Shubhra Dutta";

  console.log(`=======================================================`);
  console.log(` DIGITAP CREDIT ANALYTICS v2.7 - EXPERIAN LIVE TEST   `);
  console.log(` Target Mobile: +91 ${targetMobile}                    `);
  console.log(` OTP Provided:  ${targetOtp}                          `);
  console.log(` Name:          ${targetName}                         `);
  console.log(`=======================================================\n`);

  const res = await pullExperianReport({
    mobile: targetMobile,
    otp: targetOtp,
    name: targetName,
    env: "uat"
  });

  console.log("Status:", res.status);
  console.log("Experian Score:", res.score ? `${res.score} / 900 (${res.scoreBand})` : "None");
  console.log("Total Outstanding:", res.totalOutstanding ? `₹${res.totalOutstanding.toLocaleString("en-IN")}` : "0");
  console.log("Active Accounts:", res.activeAccounts);
  console.log("Tradelines Count:", res.tradelines?.length || 0);
  console.log("Applicant:", res.applicantDetails?.fullName, "| PAN:", res.applicantDetails?.pan, "| DOB:", res.applicantDetails?.dob);
  if (res.tradelines && res.tradelines.length > 0) {
    console.log("\nTradelines:");
    for (const tl of res.tradelines) {
      console.log(` - [${tl.status}] ${tl.lender} (${tl.accountType}) | Sanction: ₹${tl.sanctionedAmount.toLocaleString("en-IN")} | Bal: ₹${tl.currentBalance.toLocaleString("en-IN")} | Acct: ${tl.accountNumber}`);
    }
  }
  console.log("\nFull Normalized Result:\n", JSON.stringify(res, null, 2));
}

run().catch(console.error);

