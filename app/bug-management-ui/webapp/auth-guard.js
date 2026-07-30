/**
 * IDTS browser authentication bridge.
 *
 * Local and Render keep the custom bearer-token session. SAP BTP uses the
 * AppRouter/XSUAA session cookie and forwards the JWT to CAP. The browser
 * decides between the two modes without exposing or decoding a platform token:
 * an existing IDTS token selects custom mode; otherwise AuthService.me is
 * probed through the authenticated AppRouter route.
 */
(function () {
    "use strict";

    var TOKEN_KEY = "idts_auth_token";
    var USER_KEY = "idts_auth_user";
    var EXPIRES_KEY = "idts_auth_expires";
    var AUTH_ME = "/odata/v4/auth/me()";

    var token = sessionStorage.getItem(TOKEN_KEY);
    window.__IDTS_AUTH_MODE__ = token ? "custom" : "xsuaa";

    if (token) {
        installBearerInterceptor();
        window.idtsAuthReady = Promise.resolve(readStoredUser());
    } else {
        window.idtsAuthReady = loadBtpUser();
    }

    window.idtsLogout = function () {
        if (window.__IDTS_AUTH_MODE__ === "xsuaa") {
            clearBrowserSession();
            window.location.replace("/do/logout");
            return;
        }

        var currentToken = sessionStorage.getItem(TOKEN_KEY);
        if (currentToken) {
            fetch("/odata/v4/auth/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + currentToken
                }
            }).catch(function () {
                // Logout must still clear the browser session when the network fails.
            });
        }

        clearBrowserSession();
        redirectToCustomLogin();
    };

    window.idtsCurrentUser = function () {
        return readStoredUser();
    };

    function loadBtpUser() {
        return fetch(AUTH_ME, {
            method: "GET",
            credentials: "same-origin",
            headers: { "Accept": "application/json" }
        })
            .then(function (response) {
                if (!response.ok) {
                    var error = new Error("Authentication is required.");
                    error.status = response.status;
                    throw error;
                }
                return response.json();
            })
            .then(function (payload) {
                var user = payload && payload.value ? payload.value : payload;
                if (!user || !user.ID || !user.role_code) {
                    throw new Error("The signed-in profile is unavailable.");
                }
                sessionStorage.setItem(USER_KEY, JSON.stringify(user));
                sessionStorage.removeItem(EXPIRES_KEY);
                return user;
            })
            .catch(function (error) {
                if (error && error.status === 401) {
                    redirectToCustomLogin();
                } else {
                    showSafeAccessError();
                }
                throw error;
            });
    }

    function installBearerInterceptor() {
        var originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (method, url) {
            this.__idtsUrl = url ? String(url) : "";
            originalOpen.apply(this, arguments);
        };

        var originalSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function () {
            if ((this.__idtsUrl || "").indexOf("/odata/v4/") !== -1) {
                var currentToken = sessionStorage.getItem(TOKEN_KEY);
                if (currentToken) {
                    try {
                        this.setRequestHeader("Authorization", "Bearer " + currentToken);
                    } catch (error) {
                        // The request may already have been sent; CAP remains the authority.
                    }
                }
            }
            originalSend.apply(this, arguments);
        };
    }

    function readStoredUser() {
        var raw = sessionStorage.getItem(USER_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (error) {
            return null;
        }
    }

    function clearBrowserSession() {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(EXPIRES_KEY);
    }

    function redirectToCustomLogin() {
        window.__IDTS_AUTH_MODE__ = "custom";
        var base = window.location.pathname
            .replace(/\/(?:index|dashboard)\.html$/, "")
            .replace(/\/$/, "");
        window.location.replace(base + "/login.html");
    }

    function showSafeAccessError() {
        function render() {
            var host = document.getElementById("idtsAuthError");
            if (!host) return;
            host.textContent = "Your account cannot access IDTS. Please contact the project administrator.";
            host.hidden = false;
        }

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", render, { once: true });
        } else {
            render();
        }
    }
}());
