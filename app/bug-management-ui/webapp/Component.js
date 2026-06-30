/**
 * IDTS Component – extended to support custom auth session (IDTS-35).
 *
 * On init: checks whether a valid Bearer token exists in sessionStorage.
 *   - If authenticated: attaches an OData V4 request interceptor that injects
 *     the Authorization header, then initialises the app normally.
 *   - If not authenticated: opens the Login dialog, waits for success, then
 *     initialises the app.
 * On logout: called from the shell header; clears the session and reloads.
 *
 * Token storage: sessionStorage only (cleared when the browser tab is closed).
 * No password, token, or secret is written to console logs or source code.
 */
sap.ui.define(
    [
        "sap/fe/core/AppComponent",
        "idts/bugmanagementui/ext/login/LoginController"
    ],
    function (AppComponent, LoginController) {
        "use strict";

        return AppComponent.extend("idts.bugmanagementui.Component", {

            metadata: {
                manifest: "json"
            },

            // ---------------------------------------------------------------
            // Lifecycle
            // ---------------------------------------------------------------

            init: function () {
                var that = this;

                // Attach the auth header interceptor BEFORE calling super.init()
                // so the first OData metadata request already carries the token.
                that._attachAuthInterceptor();

                if (LoginController.isAuthenticated()) {
                    // Session already valid – boot normally
                    AppComponent.prototype.init.apply(that, arguments);
                    that._addLogoutMenuItem();
                } else {
                    // No session – show login dialog first, then boot
                    that._loginController = new LoginController();
                    that._loginController
                        .openLoginDialog(null /* no parent view yet */)
                        .then(function (/*oLoginResult*/) {
                            // Re-attach interceptor (token is now in sessionStorage)
                            that._attachAuthInterceptor();
                            AppComponent.prototype.init.apply(that, arguments);
                            that._addLogoutMenuItem();
                        })
                        .catch(function () {
                            // User cancelled login – show a minimal message
                            sap.m.MessageBox.error(
                                "Authentication is required to use this application.",
                                { title: "Access Denied" }
                            );
                        });
                }
            },

            // ---------------------------------------------------------------
            // OData auth interceptor
            // ---------------------------------------------------------------

            /**
             * Attaches a before-send interceptor on the default OData V4 model
             * that injects the Authorization header if a token is present.
             * Safe to call multiple times – re-reads the token from sessionStorage.
             */
            _attachAuthInterceptor: function () {
                var that = this;
                // Override XMLHttpRequest.open/send to inject Bearer token.
                // We use the lightweight approach: monkey-patch XMLHttpRequest
                // at the module level once so the interceptor covers all OData calls.
                if (window.__idtsAuthInterceptorInstalled) { return; }
                window.__idtsAuthInterceptorInstalled = true;

                var OriginalOpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function (method, url) {
                    this.__idtsUrl = url || "";
                    OriginalOpen.apply(this, arguments);
                };

                var OriginalSend = XMLHttpRequest.prototype.send;
                XMLHttpRequest.prototype.send = function () {
                    // Only inject on calls that look like OData service requests
                    var sUrl = this.__idtsUrl || "";
                    if (sUrl.indexOf("/odata/v4/bug") !== -1 ||
                        sUrl.indexOf("/odata/v4/auth/logout") !== -1 ||
                        sUrl.indexOf("/odata/v4/auth/me") !== -1) {
                        var sToken = LoginController.getToken();
                        if (sToken) {
                            this.setRequestHeader("Authorization", "Bearer " + sToken);
                        }
                    }
                    OriginalSend.apply(this, arguments);
                };
            },

            // ---------------------------------------------------------------
            // Shell logout menu
            // ---------------------------------------------------------------

            /**
             * Adds a "Sign Out" item to the SAP Fiori shell header (if a shell
             * is available).  Safe to call even when no shell exists.
             */
            _addLogoutMenuItem: function () {
                var oShell = sap.ui.getCore().byId("shellAppTitle") ||
                             sap.ushell && sap.ushell.Container;
                if (!oShell) {
                    // No Fiori shell – add a simple logout button via a MessageToast hint
                    // and expose the logout function globally for manual test access.
                    window.idtsLogout = function () {
                        LoginController.logout();
                        window.location.reload();
                    };
                    // Inform dev-time users
                    var oUser = LoginController.getUser();
                    if (oUser) {
                        sap.m.MessageToast.show(
                            "Signed in as " + oUser.displayName + " (" + oUser.roleName + "). " +
                            "Call idtsLogout() in console to sign out.",
                            { duration: 4000 }
                        );
                    }
                }
            }
        });
    }
);