# Digitap enablement report — KYC Validation Suite v4.91

Probed: 2026-09-24T08:23:29.469Z · env **UAT** · client **07625809** · host `https://svcdemo.digitap.work`

Synthetic payloads only (format-valid, non-existent records) — no real profile touched,
no customer data sent. One call per endpoint.

| endpoint | path | HTTP | result_code | verdict | latency | note |
|---|---|---|---|---|---|---|
| pan_basic_v1 | `/validation/kyc/v1/pan_basic` | 200 | 103 | enabled | 5765ms | No record found for the given input |
| pan_basic_v2 | `/validation/kyc/v2/pan_basic` | 200 | 103 | enabled | 2815ms | No record found for the given input |
| pan_details | `/validation/kyc/v1/pan_details` | 200 | 103 | enabled | 640ms | No record found for the given input |
| pan_details_bc | `/validation/kyc/v1/pan_details_bc` | 412 | — | not_enabled | 188ms | PAN Status Check is not Enabled. Please contact support/RM |
| pan_details_plus | `/validation/kyc/v1/pan_details_plus` | 200 | 103 | enabled | 12229ms | No record found for the given input |
| pan_206ab | `/validation/kyc/v1/form206ab_compliance_status` | 200 | 102 | enabled | 822ms | Invalid ID number or combination of inputs |
| pan_itr | `/validation/kyc/v1/itr_basic` | 200 | 109 | enabled | 6203ms | No ITR filing records found for the PAN for the search period |
| pan_to_name | `/validation/kyc/v1/pan_to_name` | 200 | 103 | enabled | 1653ms | No record found for the given input |
| pan_to_fname | `/validation/kyc/v1/pan_to_fname` | 503 | — | unexpected | 4482ms | Source is busy or unavailable. Try again later |
| pan_profile | `/validation/kyc/v1/pan_profile` | 503 | — | unexpected | 26ms | — |
| pan_account_linkage | `/validation/misc/v1/pan-account-linkage` | 503 | — | unexpected | 20ms | — |
| voter | `/validation/kyc/v1/voter` | 200 | 103 | enabled | 7261ms | No record found for the given input |
| passport | `/validation/kyc/v1/passport` | 200 | 103 | enabled | 4938ms | No Records Found for the Given ID or Combination of Inputs |
| pan_aadhaar_link | `/validation/kyc/v1/pan_aadhaar_link` | 200 | 103 | enabled | 8622ms | — |
| pan_to_masked_aadhaar | `/validation/kyc/v1/pan_to_masked_aadhaar` | 200 | 102 | enabled | 4345ms | Invalid ID Number or Combination of Inputs |
| aadhaar_to_masked_pan | `/validation/kyc/v1/aadhaar_to_masked_pan` | 200 | 101 | enabled | 3682ms | — |
| aadhaar_to_unmasked_pan | `/validation/kyc/v1/aadhaar_to_unmasked_pan` | 401 | — | auth_failed | 201ms | Client Authentication Failed |
| dl | `/validation/kyc/v1/dl` | 200 | 103 | enabled | 4648ms | No record found for the given input |
| dl_plus | `/validation/kyc/v1/dl_plus` | 200 | 102 | enabled | 1859ms | Invalid ID number or combination of inputs |
| udid | `/validation/kyc/v1/kyc_udid_verification` | 401 | — | auth_failed | 4014ms | Client Authentication Failed |
| experian | `/validation/misc/v1/mobile-name-lookup` | 200 | 103 | enabled | 2586ms | No linked name found |
| mnv_otp | `/validation/misc/v1/mobile-name-lookup` | 200 | 103 | enabled | 3361ms | No linked name found |
| mnv_silent | `/validation/misc/v1/mobile-name-lookup` | 200 | 103 | enabled | 3359ms | No linked name found |
| mnv_report | `/validation/misc/v1/mobile-name-lookup` | 200 | 103 | enabled | 3341ms | No linked name found |

**Enabled: 18/24** — HTTP 200 + result 101/102/103 = credentials OK + product enabled.

Legend: 401 = wrong credentials for this env · 403 = whitelist the server egress IP with
Digitap · 412 = ask your RM to enable the product · 400 = endpoint reachable, check payload.