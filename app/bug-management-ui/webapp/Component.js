/**
 * IDTS App Component
 *
 * Auth gate and OData Bearer-token injection are handled in index.html
 * (a synchronous <script> block before the UI5 bootstrap) so that every
 * XHR — including the initial $metadata request — already carries the token.
 *
 * This file deliberately contains no auth logic.
 * See: webapp/login.html  for the login page.
 * See: webapp/index.html  for the XHR interceptor and session guard.
 */
sap.ui.define(
    ["sap/fe/core/AppComponent"],
    function (AppComponent) {
        "use strict";
        return AppComponent.extend("idts.bugmanagementui.Component", {
            metadata: { manifest: "json" }
        });
    }
);