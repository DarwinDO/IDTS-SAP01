# Knowledge: `srv/user-admin/catalogs.js`

## English

This module owns IDTS Business Catalog administration for SAP Modules, Application Components, Defect Categories, and valid Component Category pairs. It normalizes codes, rejects unsupported fields and duplicates, locks updates, enforces ETags, validates active parents, blocks unsafe deactivation, rejects every DELETE, and records append-only success/rejection audits without request payloads or identity/provider data. Impact reads return counts only.

## Tiếng Việt

Module nay quan ly Business Catalog IDTS gom SAP Module, Application Component, Defect Category va cap Component Category hop le. Handler normalize code, reject field la/duplicate, lock update, enforce ETag, validate parent active, chan deactivate khong an toan, reject moi DELETE va ghi audit append-only success/rejection ma khong luu request payload hoac identity/provider data. Impact read chi tra count.
