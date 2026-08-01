# `app/router/xs-app.json` knowledge mirror

## Mental model

This file is the traffic map for the standalone SAP BTP AppRouter. AppRouter
reads the routes from top to bottom and uses the first matching route.

## Important routes

| Route/configuration | Caller | Purpose | Next dependency / side effect |
| --- | --- | --- | --- |
| `logout.logoutEndpoint` | `auth-guard.js` through the browser | Ends the AppRouter application session at `/do/logout`. | AppRouter redirects to `logoutPage`. |
| `logout.logoutPage` | AppRouter after logout | Sends the user to `/logged-out.html`. | The public route below serves static HTML without XSUAA. |
| `^/logged-out\\.html$` | Browser after logout | Shows a stable signed-out page. | The explicit sign-in link returns to the protected Fiori entry. |
| `^/odata/(.*)$` | Fiori OData model | Forwards protected OData calls to the CAP destination. | XSUAA token is forwarded to CAP. |
| `^(.*)$` | All remaining browser requests | Serves the protected HTML5 application. | XSUAA authenticates before app content is returned. |

The public logout route must remain before the catch-all route. Otherwise the
catch-all route claims the request and immediately starts XSUAA again.

## Debug order

1. In Browser Network, confirm Sign Out navigates to `/do/logout`.
2. Confirm the next response redirects to `/logged-out.html`.
3. Confirm `/logged-out.html` is returned without a new XSUAA challenge.
4. Click **Sign in with SAP BTP** and confirm the protected app route starts
   XSUAA.
5. If the app opens but IDTS rejects the user, debug `AuthService.me`, the
   HANA `Users` mapping and role collections; that is a different boundary.

## Mô hình tư duy tiếng Việt

File này là bảng định tuyến của AppRouter. Route được xét từ trên xuống. Route
public `/logged-out.html` phải đứng trước route bắt tất cả; nếu không, route bắt
tất cả sẽ yêu cầu XSUAA ngay và user có cảm giác vừa logout đã bị đăng nhập lại.
Breakpoint chính nằm ở Browser Network: `/do/logout` → `/logged-out.html` →
link quay lại Fiori → XSUAA.
