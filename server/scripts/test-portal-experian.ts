import { createApp } from "../src/app.js";

async function test() {
  const app = await createApp();
  const server = app.listen(9876, async () => {
    try {
      console.log("Testing /api/digitap-portal/fetch-data with mobile 7908096603 and OTP 123456...");
      const res = await fetch("http://127.0.0.1:9876/api/digitap-portal/fetch-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: "7908096603",
          otp: "123456",
          bypassOtp: true,
          env: "uat"
        })
      });
      const data = await res.json();
      console.log("Response HTTP:", res.status);
      console.log("Success:", data.success);
      console.log("Experian Status:", data.experian?.status);
      console.log("Experian Score:", data.experian?.score);
      console.log("Score Band:", data.experian?.scoreBand);
      console.log("Total Outstanding:", data.experian?.totalOutstanding);
      console.log("Tradelines Count:", data.experian?.tradelines?.length);
      console.log("Applicant:", JSON.stringify(data.experian?.applicantDetails));
      server.close();
      process.exit(0);
    } catch (err) {
      console.error("Test error:", err);
      server.close();
      process.exit(1);
    }
  });
}

test();
