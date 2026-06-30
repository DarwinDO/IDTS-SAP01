/**
 * IDTS-35 Login Controller
 *
 * Handles login/logout flow against the AuthService backend (IDTS-34).
 * Token is stored in sessionStorage (cleared on tab close, not persisted to disk).
 * No password or token is written to console logs or source code.
 *
 * Backend contract (from IDTS-34):
 *   POST /odata/v4/auth/login  { email, password }
 *     → { token, tokenType:"Bearer", expiresAt, user: { ID, displayName, email, role_code, roleName } }
 *   POST /odata/v4/auth/logout  (Authorization: Bearer <token>)
 *   GET  /odata/v4/auth/me()    (Authorization: Bearer <token>)
 */
sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/Fragment",
        "sap/m/MessageToast",
        "sap/m/BusyDialog"
    ],
    function (Controller, Fragment, MessageToast, BusyDialog) {
        "use strict";

        // ------------------------------------------------------------------
        // Session storage keys  (no secret values stored here)
        // ------------------------------------------------------------------
        var SESSION_KEY_TOKEN    = "idts_auth_token";
        var SESSION_KEY_USER     = "idts_auth_user";
        var SESSION_KEY_EXPIRES  = "idts_auth_expires";

        // ------------------------------------------------------------------
        // Auth endpoint base
        // ------------------------------------------------------------------
        var AUTH_BASE = "/odata/v4/auth";

        // ------------------------------------------------------------------
        // Public static helpers used by Component.js
        // ------------------------------------------------------------------
        var LoginController = Controller.extend("idts.bugmanagementui.ext.login.LoginController", {

            // ---------------------------------------------------------------
            // Lifecycle
            // ---------------------------------------------------------------

            onInit: function () {
                this._oDialog = null;
                this._resolveLogin = null;
            },

            // ---------------------------------------------------------------
            // Dialog management
            // ---------------------------------------------------------------

            /**
             * Open the login dialog.
             * Returns a Promise that resolves when login succeeds or rejects on cancel.
             */
            openLoginDialog: function (oView) {
                var that = this;
                return new Promise(function (resolve, reject) {
                    that._resolveLogin = resolve;
                    that._rejectLogin  = reject;

                    if (!that._oDialog) {
                        Fragment.load({
                            id: "loginFrag",
                            name: "idts.bugmanagementui.ext.login.LoginDialog",
                            controller: that
                        }).then(function (oDialog) {
                            that._oDialog = oDialog;
                            if (oView) {
                                oView.addDependent(oDialog);
                            }
                            that._resetForm();
                            oDialog.open();
                        });
                    } else {
                        that._resetForm();
                        that._oDialog.open();
                    }
                });
            },

            _resetForm: function () {
                var oDialog = this._oDialog;
                if (!oDialog) { return; }
                Fragment.byId("loginFrag", "loginEmail").setValue("");
                Fragment.byId("loginFrag", "loginPassword").setValue("");
                Fragment.byId("loginFrag", "loginErrorStrip").setVisible(false);
                Fragment.byId("loginFrag", "loginErrorStrip").setText("");
                Fragment.byId("loginFrag", "loginButton").setEnabled(true);
            },

            // ---------------------------------------------------------------
            // Event handlers
            // ---------------------------------------------------------------

            onLoginSubmit: function () {
                var sEmail    = Fragment.byId("loginFrag", "loginEmail").getValue().trim();
                var sPassword = Fragment.byId("loginFrag", "loginPassword").getValue();

                if (!sEmail || !sPassword) {
                    this._showError("Please enter your email and password.");
                    return;
                }

                this._setLoading(true);
                this._callLogin(sEmail, sPassword);
            },

            onLoginCancel: function () {
                if (this._oDialog) {
                    this._oDialog.close();
                }
                if (this._rejectLogin) {
                    this._rejectLogin(new Error("Login cancelled by user."));
                }
            },

            // ---------------------------------------------------------------
            // Backend call
            // ---------------------------------------------------------------

            _callLogin: function (sEmail, sPassword) {
                var that = this;

                fetch(AUTH_BASE + "/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    // password is sent over HTTPS in production; never logged here
                    body: JSON.stringify({ email: sEmail, password: sPassword })
                })
                .then(function (oRes) {
                    if (!oRes.ok) {
                        return oRes.json().then(function (oErr) {
                            var sMsg = (oErr && oErr.error && oErr.error.message)
                                ? oErr.error.message
                                : "Login failed. Please check your credentials.";
                            throw new Error(sMsg);
                        });
                    }
                    return oRes.json();
                })
                .then(function (oData) {
                    // Unwrap OData action wrapper if present
                    var oResult = (oData && oData.value) ? oData.value : oData;
                    that._persistSession(oResult);
                    that._setLoading(false);
                    if (that._oDialog) { that._oDialog.close(); }
                    MessageToast.show("Welcome, " + oResult.user.displayName + "!");
                    if (that._resolveLogin) { that._resolveLogin(oResult); }
                })
                .catch(function (oErr) {
                    that._setLoading(false);
                    that._showError(oErr.message || "An unexpected error occurred. Please try again.");
                });
            },

            // ---------------------------------------------------------------
            // Session helpers (static-like, also called from Component.js)
            // ---------------------------------------------------------------

            _persistSession: function (oLoginResult) {
                sessionStorage.setItem(SESSION_KEY_TOKEN,   oLoginResult.token);
                sessionStorage.setItem(SESSION_KEY_USER,    JSON.stringify(oLoginResult.user));
                sessionStorage.setItem(SESSION_KEY_EXPIRES, oLoginResult.expiresAt || "");
            },

            // ---------------------------------------------------------------
            // UI helpers
            // ---------------------------------------------------------------

            _showError: function (sMsg) {
                var oStrip = Fragment.byId("loginFrag", "loginErrorStrip");
                if (oStrip) {
                    oStrip.setText(sMsg);
                    oStrip.setVisible(true);
                }
            },

            _setLoading: function (bLoading) {
                var oBtn = Fragment.byId("loginFrag", "loginButton");
                if (oBtn) { oBtn.setEnabled(!bLoading); }
            }
        });

        // ------------------------------------------------------------------
        // Static helpers exposed on the constructor so Component.js can use
        // them without instantiating the controller.
        // ------------------------------------------------------------------

        /**
         * Check whether a valid (non-expired) auth token exists in sessionStorage.
         */
        LoginController.isAuthenticated = function () {
            var sToken   = sessionStorage.getItem(SESSION_KEY_TOKEN);
            var sExpires = sessionStorage.getItem(SESSION_KEY_EXPIRES);
            if (!sToken) { return false; }
            if (sExpires) {
                var dExpires = new Date(sExpires);
                if (!isNaN(dExpires.getTime()) && dExpires < new Date()) {
                    LoginController.clearSession();
                    return false;
                }
            }
            return true;
        };

        /**
         * Return the stored Bearer token (or null if not authenticated).
         */
        LoginController.getToken = function () {
            return sessionStorage.getItem(SESSION_KEY_TOKEN);
        };

        /**
         * Return the stored user profile object (or null).
         */
        LoginController.getUser = function () {
            var sUser = sessionStorage.getItem(SESSION_KEY_USER);
            try { return sUser ? JSON.parse(sUser) : null; }
            catch (e) { return null; }
        };

        /**
         * Call the logout endpoint then clear the local session.
         */
        LoginController.logout = function () {
            var sToken = LoginController.getToken();
            if (sToken) {
                // Fire-and-forget: clear session regardless of server response
                fetch(AUTH_BASE + "/logout", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + sToken
                    }
                }).catch(function () {
                    // ignore network errors on logout
                });
            }
            LoginController.clearSession();
        };

        /**
         * Remove all IDTS auth data from sessionStorage.
         */
        LoginController.clearSession = function () {
            sessionStorage.removeItem(SESSION_KEY_TOKEN);
            sessionStorage.removeItem(SESSION_KEY_USER);
            sessionStorage.removeItem(SESSION_KEY_EXPIRES);
        };

        return LoginController;
    }
);
