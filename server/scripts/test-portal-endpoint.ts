import { createApp } from "../src/app.js";

async function testEndpoint() {
  console.log("=== Testing Digitap Test Portal Endpoint ===");
  const app = await createApp();
  const server = app.listen(8799, async () => {
    try {
      console.log("Server listening on port 8799");
      const res = await fetch("http://127.0.0.1:8799/api/digitap-portal/fetch-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: "9820123456",
          bypassOtp: true,
          pan: "BZXPM1234F"
        })
      });

      const data = await res.json();
      console.log("HTTP Status:", res.status);
      console.log("Response Success:", data.success);
      console.log("Subscriber Resolved:", data.identity?.subscriberName);
      console.log("Carrier:", data.identity?.carrier);
      console.log("Masked Aadhaar:", data.aadhaar?.maskedAadhaar);
      console.log("Aadhaar Linked to PAN:", data.aadhaar?.aadhaarLinkedToPan);
      console.log("PAN Status:", data.pan?.status);
      console.log("Experian Score:", data.experian?.score, `(${data.experian?.scoreBand})`);
      console.log("Active Accounts:", data.experian?.activeAccounts);
      console.log("Tradelines Count:", data.experian?.tradelines?.length);
      console.log("Raw Envelopes Keys:", Object.keys(data.rawEnvelopes || {}));
      console.log("=== Endpoint Test Complete ===");
    } catch (err) {
      console.error("Test failed:", err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

testEndpoint().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
