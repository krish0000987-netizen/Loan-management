import { test, before } from "node:test";
import assert from "node:assert/strict";
import { normalizeMobile, isValidIndianMobile, maskMobile, createOtpChallenge, verifyOtpChallenge, hashOtp } from "../core/otp.js";
import { createSchema } from "../db/schema.js";
import { run } from "../db/connection.js";

before(async () => {
  await createSchema();
  await run("INSERT OR IGNORE INTO tenants (id, code, name) VALUES (1, 'default', 'Default Tenant')");
  await run("DELETE FROM otp_challenges");
});

test("OTP formatting: normalize, validate, mask", () => {
  assert.equal(normalizeMobile("+919876543210"), "9876543210");
  assert.equal(normalizeMobile("919876543210"), "9876543210");
  assert.equal(normalizeMobile("09876543210"), "9876543210");
  assert.equal(normalizeMobile(" 98765 43210 "), "9876543210");

  assert.equal(isValidIndianMobile("9876543210"), true);
  assert.equal(isValidIndianMobile("8876543210"), true);
  assert.equal(isValidIndianMobile("7876543210"), true);
  assert.equal(isValidIndianMobile("6876543210"), true);
  assert.equal(isValidIndianMobile("5876543210"), false); // Invalid Indian mobile start digit
  assert.equal(isValidIndianMobile("98765"), false); // Too short

  assert.equal(maskMobile("9876543210"), "******3210");
});

test("OTP challenge creation & hashing", async () => {
  const token = `otp_test_${Date.now()}`;
  const challenge = await createOtpChallenge(1, token, "9876543210");

  assert.equal(challenge.journeyToken, token);
  assert.equal(challenge.maskedMobile, "******3210");
  assert.equal(challenge.expiresIn, 300);
  assert.ok(challenge.demoOtp); // In test/demo mode, demoOtp is available
});

test("OTP verification: success, wrong OTP, and attempt lockout", async () => {
  const token = `otp_verify_test_${Date.now()}`;
  const challenge = await createOtpChallenge(1, token, "9811111111");
  const validOtp = challenge.demoOtp || "123456";

  // Wrong OTP attempt
  const wrongRes = await verifyOtpChallenge(1, token, "000000");
  assert.equal(wrongRes.verified, false);
  assert.match(wrongRes.reason || "", /attempt/i);

  // Correct OTP
  const correctRes = await verifyOtpChallenge(1, token, validOtp);
  assert.equal(correctRes.verified, true);
  assert.equal(correctRes.mobile, "9811111111");

  // Re-verification of already verified challenge fails
  const reuseRes = await verifyOtpChallenge(1, token, validOtp);
  assert.equal(reuseRes.verified, false);
  assert.match(reuseRes.reason || "", /already been verified/i);
});

test("OTP resend cooldown is enforced", async () => {
  const token1 = `cooldown_1_${Date.now()}`;
  const mobile = "9822222222";
  await createOtpChallenge(1, token1, mobile);

  // Immediate retry should be rate-limited
  const token2 = `cooldown_2_${Date.now()}`;
  await assert.rejects(
    async () => {
      await createOtpChallenge(1, token2, mobile);
    },
    /Please wait \d+s before requesting a new OTP/
  );
});
