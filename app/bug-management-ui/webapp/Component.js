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
        "sap/ui/model/json/JSONModel",
        "idts/bugmanagementui/ext/login/LoginController",
        "idts/bugmanagementui/ext/login/ProfileShell",
        "idts/bugmanagementui/ext/notification/NotificationShell"
    ],
    function (AppComponent, JSONModel, LoginSession, ProfileShell, NotificationShell) {
        "use strict";
        return AppComponent.extend("idts.bugmanagementui.Component", {
            metadata: { manifest: "json" },

            init: function () {
                var user = LoginSession.getUser();
                var sessionModel = new JSONModel({
                    canCreateBug: Boolean(user && user.role_code === "TESTER"),
                    canAdministerUsers: Boolean(user && user.canAdministerUsers === true)
                });

                // Bind toolbar authorization UX to observable session state.
                // CAP remains the authoritative authorization boundary.
                this.setModel(sessionModel, "session");
                // UI5 gọi một lần sau khi auth guard/index bootstrap đã chạy. Base init tạo Fiori Elements app,
                // rồi ProfileShell gắn avatar/menu theo user trong session; breakpoint ở đây khi shell thiếu.
                AppComponent.prototype.init.apply(this, arguments);
                ProfileShell.init();
                this._notificationShell = NotificationShell.init(this);
            },

            exit: function () {
                // Timer/listener inbox thuộc vòng đời component, không sống qua logout/destroy.
                if (this._notificationShell) {
                    this._notificationShell.destroy();
                    this._notificationShell = null;
                }
                AppComponent.prototype.exit.apply(this, arguments);
            }
        });
    }
);
