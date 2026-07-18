/**
 * Gợi ý học/debug: form login thật nằm ở login-page.js; module này chỉ cung cấp API đọc/xóa session cho UI5 code.
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
        // Caller như dashboard-page dùng kết quả boolean này trước khi đọc profile hoặc gọi OData.
        // Token hết hạn gây side effect clearSession(); breakpoint ở đây khi user bị logout bất ngờ.
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
        // Trả token cho fetch OData; không log, decode hoặc quyết định role ở client.
        return sessionStorage.getItem(SESSION_KEY_TOKEN);
    };

    /**
     * Return the stored safe user profile, or null when it is missing/corrupted.
     */
    LoginSession.getUser = function () {
        // Trả safe profile đã được AuthService cấp lúc login; JSON hỏng trả null để caller xử lý.
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
        // Profile/menu gọi: POST AuthService.logout rồi xóa session local, kể cả provider/network lỗi.
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
        // Xóa ba khóa cùng lúc; refresh sau đó sẽ bị auth-guard chuyển về login.
        sessionStorage.removeItem(SESSION_KEY_TOKEN);
        sessionStorage.removeItem(SESSION_KEY_USER);
        sessionStorage.removeItem(SESSION_KEY_EXPIRES);
    };

    return LoginSession;
});
