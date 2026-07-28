# IDTS-113 Native Attachment Picker Attempt

Date: 2026-07-28

Baseline Git SHA: `9e53434b4a5a600681ab27027f05906316179708`

Environment: SAP BTP Cloud Foundry `dev`

Result: `BLOCKED — Chrome upload permission`

## Test scope

The authenticated DonHV Project Manager session opened the protected Fiori
Object Page for `BUG-0018` and navigated to `Evidence / Attachments`.

The selected fixture was:

- File name: `idts113-native-picker-smoke.txt`
- MIME type: `text/plain`
- Size: 220 bytes
- SHA-256:
  `756B99B8BF5F0F8E76470CAA6DC07FAC16AB3B9A3769D133EF8FAE4CAB06C92D`

## Actual result

1. The `Upload Evidence` control was enabled.
2. The Chrome bridge captured the native file chooser.
3. The file input accepted `.txt`, `.pdf`, `.png`, `.jpg` and `.jpeg` types and
   was not disabled.
4. The bridge rejected `fileChooser.setFiles(...)` with `Not allowed`.
5. A settled DOM readback still displayed
   `No evidence files uploaded yet`.

No browser upload request reached CAP. No HANA attachment metadata or S3 object
was created by this attempt.

## Interpretation

This result is a browser test-harness permission blocker, not evidence of a
product upload failure. It must not be recorded as a native-picker PASS.

The production-bound storage adapter remains independently accepted by Cloud
Foundry task `idts113-s3-smoke-210420`:

- S3 upload: PASS.
- HANA metadata persistence: PASS.
- Download and SHA-256 readback: PASS.
- Object existence before delete: PASS.
- HANA metadata and S3 object cleanup: PASS.

Restart persistence was separately verified by Cloud Foundry tasks 18–20:
metadata and binary bytes survived application restart with the same SHA-256,
then both were removed successfully.

## Remaining action

Allow the Chrome plugin to upload the selected local fixture, then rerun the
same Object Page sequence:

1. upload;
2. HANA/S3 readback;
3. Object Page reload;
4. download and SHA-256 comparison;
5. delete;
6. final HANA/S3 absence check.

No credential, token, database URL, service key, private recipient, or provider
secret is present in this evidence.
