/**
 * Gợi ý học/debug: nếu Fiori load nhưng OData bị 401, kiểm tra auth-guard trước Component vì guard chạy sớm hơn.
 * IDTS App Component
 *
 * Auth gate and OData Bearer-token injection are handled in index.html
 * (a synchronous <script> block before the UI5 bootstrap) so that every
 * XHR — including the initial $metadata request — already carries the token.
 *
 * This file deliberately contains no token validation or OData header logic.
 * It does initialize the post-login profile shell after UI5 is available.
 * See: webapp/login.html  for the login page.
 * See: webapp/index.html  for the XHR interceptor and session guard.
 */
sap.ui.define(
    [
        "sap/fe/core/AppComponent",
        "idts/bugmanagementui/ext/login/ProfileShell"
    ],
    function (AppComponent, ProfileShell) {
        "use strict";
        return AppComponent.extend("idts.bugmanagementui.Component", {
            metadata: { manifest: "json" },

            init: function () {
                // UI5 gọi một lần sau khi auth guard/index bootstrap đã chạy. Base init tạo Fiori Elements app,
                // rồi ProfileShell gắn avatar/menu theo user trong session; breakpoint ở đây khi shell thiếu.
                AppComponent.prototype.init.apply(this, arguments);
                ProfileShell.init();
            }
        });
    }
);
