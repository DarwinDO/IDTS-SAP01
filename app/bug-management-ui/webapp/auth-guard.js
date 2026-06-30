/**
 * IDTS Auth Guard – loaded by index.html BEFORE the UI5 bootstrap.
 *
 * Runs synchronously as the very first script so that:
 *   1. Unauthenticated users are redirected to login.html immediately.
 *   2. The XMLHttpRequest interceptor is installed before any OData XHR fires
 *      (including the first $metadata request from the Fiori Elements V4 model).
 *
 * Token lifecycle:
 *   - Set by login.html after a successful POST /odata/v4/auth/login.
 *   - Stored in sessionStorage (never persisted to disk; cleared on tab close).
 *   - Never written to console or source code.
 *
 * Logout: call window.idtsLogout() from the browser console during development.
 */
(function () {
    "use strict";

    var TOKEN_KEY   = "idts_auth_token";
    var USER_KEY    = "idts_auth_user";
    var EXPIRES_KEY = "idts_auth_expires";

    // ── 1. Redirect to login page if no token ──────────────────────────────
    var token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
        var base = window.location.pathname.replace(/\/index\.html(\?.*)?$/, "");
        window.location.replace(base + "/login.html");
        return; // stop script execution; browser will navigate away
    }

    // ── 2. XHR interceptor: inject Bearer token on every OData V4 request ──
    // Installed BEFORE the UI5 bootstrap so the very first $metadata XHR
    // already carries the Authorization header.
    var _open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
        this.__idtsUrl = url ? String(url) : "";
        _open.apply(this, arguments);
    };

    var _send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function () {
        var url = this.__idtsUrl || "";
        if (url.indexOf("/odata/v4/") !== -1) {
            var t = sessionStorage.getItem(TOKEN_KEY);
            if (t) {
                try { this.setRequestHeader("Authorization", "Bearer " + t); }
                catch (e) { /* already sent – ignore */ }
            }
        }
        _send.apply(this, arguments);
    };

    // ── 3. Logout helper ───────────────────────────────────────────────────
    window.idtsLogout = function () {
        var t = sessionStorage.getItem(TOKEN_KEY);
        if (t) {
            fetch("/odata/v4/auth/logout", {
                method:  "POST",
                headers: {
                    "Content-Type":  "application/json",
                    "Authorization": "Bearer " + t
                }
            }).catch(function () { /* ignore network errors on logout */ });
        }
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(EXPIRES_KEY);
        var base = window.location.pathname.replace(/\/index\.html(\?.*)?$/, "");
        window.location.replace(base + "/login.html");
    };
})();
