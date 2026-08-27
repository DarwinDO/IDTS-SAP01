# eslint.notification.config.mjs — focused N2 lint fallback

## English

The existing app-wide Fiori ESLint configuration currently cannot load because its installed plugin imports `@babel/eslint-parser` as a development-only package that is absent from the exact lock tree. N2 must not install or mutate dependencies merely to hide that baseline tooling problem.

This focused flat config uses the `@eslint/js` package already present in the root locked dependency tree and applies its recommended JavaScript rules only to the new notification modules and changed `Component.js`. It declares only the browser/UI5 globals those files use. It does not replace, weaken or claim to repair the app-wide Fiori config; that baseline remains separately reproducible. The package `lint` script points to this config so N2 code receives a real syntax/unused/undefined-variable gate in local and CI root-workspace installs.

Owner: DonHV. When the Fiori plugin packaging is repaired in an approved dependency gate, remove this fallback and return the script to the shared Fiori config after proving equal or stronger coverage. Check `package.json`, both notification modules and CI before editing.

N3 Task 8 adds `webapp/ext/sections/BugCollaboration.js` to this exact fallback scope. This is deliberately a file-level extension of the existing locked fallback, not a dependency change or a second lint system.

## Tiếng Việt

Config Fiori ESLint toàn app hiện không load được vì plugin đã cài import `@babel/eslint-parser` như package chỉ dùng lúc phát triển nhưng package đó không có trong cây dependency lock chính xác. N2 không được tự install hay đổi dependency chỉ để che lỗi tooling baseline.

Flat config tập trung này dùng `@eslint/js` đã có trong dependency tree root được lock và áp dụng rule JavaScript recommended chỉ cho module notification mới cùng `Component.js` đã đổi. Nó chỉ khai báo global browser/UI5 mà các file đó dùng. Nó không thay thế, nới lỏng hay tuyên bố sửa config Fiori toàn app; lỗi baseline vẫn tái hiện riêng. Script `lint` của package trỏ tới config này để code N2 có gate thật về syntax/unused/undefined variable trong local và CI workspace root.

Owner: DonHV. Khi packaging plugin Fiori được sửa trong gate dependency đã duyệt, bỏ fallback và đưa script về config Fiori chung sau khi chứng minh coverage bằng hoặc mạnh hơn. Kiểm cùng `package.json`, hai module notification và CI.

N3 Task 8 thêm `webapp/ext/sections/BugCollaboration.js` vào đúng scope fallback này. Đây chỉ là mở rộng theo file của fallback đã lock, không đổi dependency hay tạo lint system thứ hai.
