# UAT-AUTH-005 manual confirmation context — 2026-09-16

The user-provided Chrome and InPrivate manual confirmations corroborated the current result after the one-time logout: reopening the controlled protected route did not expose protected Bug/profile data and required the SAP credential screen. No login was completed and no second logout was invoked.

The manual confirmations are supporting context only. They do not add account email, credentials, OTPs, tokens, cookies, provider identifiers, or raw URLs to the package. The capture report and the three current evidence images remain the canonical PASS-only image set.

The three current images do not show browser chrome or a direct post-logout route-reopen URL. Exact route continuity therefore relies on the capture report's sanitized AX/readback record together with these manual confirmations; the package does not claim that the PNG pixels alone prove that detail.
