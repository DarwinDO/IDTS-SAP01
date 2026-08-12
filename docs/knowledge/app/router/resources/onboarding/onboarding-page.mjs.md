# Knowledge: `app/router/resources/onboarding/onboarding-page.mjs`

The onboarding handoff deliberately uses two small AppRouter pages. The public `/onboarding/continue` page reads the signed invitation from the URL fragment, stores it only in browser `sessionStorage`, removes the fragment from the visible URL, and navigates to the XSUAA-protected `/onboarding/authenticate` page. The protected page fetches a CSRF token and POSTs the bounded invitation to `UserAdministrationService.verifySapIdentity`.

The token is never placed in a query string, referrer, application log, HTML, or persistent browser storage. Both pages use no-store caching, a no-referrer policy, a restrictive CSP, external script/style files, semantic status messages, and no password fields. Provider/CAP error bodies are not displayed; status codes map to allowlisted user messages.

Vietnamese: Trang public chi nhan token tu fragment, luu tam trong `sessionStorage`, xoa fragment roi chuyen qua route XSUAA. Trang da authenticate moi POST token bang CSRF toi CAP. UI khong hoi password/OTP/passkey va khong hien raw provider error.
