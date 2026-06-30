/**
 * IDTS-35 login session helpers.
 *
 * The active login UI is the standalone login.html + login-page.js flow.
 * This module deliberately contains only reusable session helpers for UI5 code
 * that may later need to read the current user or trigger logout.
 *
 * It does not load a dialog or own the login form. Keeping it small avoids a
 * broken dependency on the removed LoginDialog.fragment.xml artifact.
 */
sap.ui.define([], function () {
    "use strict";

    var SESSION_KEY_TOKEN   = "idts_auth_token";
    var SESSION_KEY_USER    = "idts_auth_user";
    var SESSION_KEY_EXPIRES = "idts_auth_expires";
    var AUTH_BASE           = "/odata/v4/auth";

    var LoginSession = {};

    /**
     * Check whether a non-expired auth token exists in sessionStorage.
     */
    LoginSession.isAuthenticated = function () {
        var token = sessionStorage.getItem(SESSION_KEY_TOKEN);
        var expires = sessionStorage.getItem(SESSION_KEY_EXPIRES);

        if (!token) {
            return false;
        }

        if (expires) {
            var expiresAt = new Date(expires);
            if (!isNaN(expiresAt.getTime()) && expiresAt < new Date()) {
                LoginSession.clearSession();
                return false;
            }
        }

        return true;
    };

    /**
     * Return the stored Bearer token, or null when the browser tab has no session.
     */
    LoginSession.getToken = function () {
        return sessionStorage.getItem(SESSION_KEY_TOKEN);
    };

    /**
     * Return the stored safe user profile, or null when it is missing/corrupted.
     */
    LoginSession.getUser = function () {
        var user = sessionStorage.getItem(SESSION_KEY_USER);
        try {
            return user ? JSON.parse(user) : null;
        } catch (e) {
            return null;
        }
    };

    /**
     * Call AuthService.logout when a token exists, then clear browser session data.
     */
    LoginSession.logout = function () {
        var token = LoginSession.getToken();

        if (token) {
            fetch(AUTH_BASE + "/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                }
            }).catch(function () {
                // Logout must still clear local state when the network is unavailable.
            });
        }

        LoginSession.clearSession();
    };

    /**
     * Remove all IDTS auth data from the current browser tab.
     */
    LoginSession.clearSession = function () {
        sessionStorage.removeItem(SESSION_KEY_TOKEN);
        sessionStorage.removeItem(SESSION_KEY_USER);
        sessionStorage.removeItem(SESSION_KEY_EXPIRES);
    };

    return LoginSession;
});
