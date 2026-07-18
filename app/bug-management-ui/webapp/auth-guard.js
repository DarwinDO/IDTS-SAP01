/**
 * Gợi ý học/debug: file này chạy trước UI5; đặt breakpoint ở bước đọc token và gắn Authorization khi app bị trả 401.
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
 * IDTS-53 profile shell:
 *   - This guard exposes safe session helpers.
 *   - The SAPUI5 profile menu itself is rendered later by ext/login/ProfileShell.
 */
(function () {
    "use strict";

    var TOKEN_KEY   = "idts_auth_token";
    var USER_KEY    = "idts_auth_user";
    var EXPIRES_KEY = "idts_auth_expires";

    // ── 1. Redirect to login page if no token ──────────────────────────────
    var token = sessionStorage.getItem(TOKEN_KEY);
    // index.html vừa nạp file này. Không có token thì dừng bootstrap Fiori và chuyển sang login.html.
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
        // Lưu URL khi UI5 mở XHR, để send() biết request nào là OData của IDTS.
        this.__idtsUrl = url ? String(url) : "";
        _open.apply(this, arguments);
    };

    var _send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function () {
        // UI5 gọi send() cho $metadata và dữ liệu. Chỉ OData mới được gắn Bearer token;
        // sau đó request tiếp tục sang CAP auth middleware. Breakpoint ở đây khi Network thiếu header.
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
        // ProfileShell gọi: báo logout cho AuthService nhưng luôn xóa session local kể cả mạng lỗi.
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

    // ── 4. Safe session helper for the SAPUI5 profile shell ─────────────────
    window.idtsCurrentUser = function () {
        // ProfileShell dùng helper này thay vì tự parse sessionStorage ở nhiều nơi.
        return readStoredUser();
    };

    function readStoredUser() {
        // JSON hỏng được coi như không có user; không throw để làm trắng toàn bộ Fiori shell.
        var raw = sessionStorage.getItem(USER_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

})();
