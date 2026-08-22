# Knowledge: `scripts/qa/test-user-onboarding-programmatic.js`

## English / Tiếng Việt

The standard onboarding fixture keeps its existing recovery behavior: a normal `PROVISION` retry rotates the operation correlation while the request correlation remains unchanged. Gate 3B applies request/operation correlation rebinding only to `LINK_EXISTING`, so unrelated provisioning recovery semantics are not changed. Runtime execution still requires the locked CAP dependency.

Fixture onboarding chuẩn giữ nguyên recovery behavior: retry `PROVISION` thường rotate correlation operation nhưng correlation request không đổi. Gate 3B chỉ bind lại correlation request/operation cho `LINK_EXISTING`, nên recovery provisioning khác không đổi semantics. Runtime vẫn cần dependency CAP locked.
