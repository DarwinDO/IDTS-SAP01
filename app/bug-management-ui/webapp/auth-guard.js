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
    var XSUAA_RECOVERY_KEY = "idts_xsuaa_recovery";
    var AUTH_ME = "/odata/v4/auth/me()";
    var AUTH_TIMEOUT_MS = 15000;

    var token = sessionStorage.getItem(TOKEN_KEY);
    window.__IDTS_AUTH_MODE__ = token ? "custom" : "xsuaa";

    if (token) {
        installBearerInterceptor();
        window.idtsAuthReady = Promise.resolve(readStoredUser());
    } else {
        window.idtsAuthReady = loadBtpUser().then(function (user) {
            installXsuaaSessionMonitor();
            return user;
        });
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
        var controller = new AbortController();
        var timeout = setTimeout(function () {
            controller.abort();
        }, AUTH_TIMEOUT_MS);

        return fetch(AUTH_ME, {
            method: "GET",
            credentials: "same-origin",
            headers: { "Accept": "application/json" },
            signal: controller.signal
        })
            .then(function (response) {
                var contentType = response.headers.get("content-type") || "";
                if (response.ok && contentType.indexOf("application/json") === -1) {
                    return redirectToBtpLogin();
                }
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
                    var profileError = new Error("The signed-in profile is unavailable.");
                    profileError.status = 403;
                    throw profileError;
                }
                sessionStorage.setItem(USER_KEY, JSON.stringify(user));
                sessionStorage.removeItem(EXPIRES_KEY);
                sessionStorage.removeItem(XSUAA_RECOVERY_KEY);
                return user;
            })
            .catch(function (error) {
                if (error && error.status === 401) {
                    return redirectToBtpLogin();
                } else if (error && error.status === 403) {
                    showSafeAccessError();
                } else {
                    showServiceUnavailable();
                }
                throw error;
            })
            .finally(function () {
                clearTimeout(timeout);
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

    function installXsuaaSessionMonitor() {
        var originalOpen;
        var originalSend;
        var originalFetch;

        if (window.__IDTS_XSUAA_SESSION_MONITOR__) return;
        window.__IDTS_XSUAA_SESSION_MONITOR__ = true;

        originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (method, url) {
            this.__idtsUrl = url ? String(url) : "";
            originalOpen.apply(this, arguments);
        };

        originalSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function () {
            var request = this;
            request.addEventListener("loadend", function () {
                if (request.status === 401 &&
                    (request.__idtsUrl || "").indexOf("/odata/v4/") !== -1) {
                    recoverExpiredXsuaaSession();
                }
            }, { once: true });
            originalSend.apply(request, arguments);
        };

        if (typeof window.fetch === "function") {
            originalFetch = window.fetch;
            window.fetch = function (input) {
                var url = typeof input === "string"
                    ? input
                    : (input && input.url ? String(input.url) : "");

                return originalFetch.apply(this, arguments).then(function (response) {
                    if (response.status === 401 && url.indexOf("/odata/v4/") !== -1) {
                        recoverExpiredXsuaaSession();
                    }
                    return response;
                });
            };
        }
    }

    function recoverExpiredXsuaaSession() {
        if (sessionStorage.getItem(XSUAA_RECOVERY_KEY) === "1") return;

        sessionStorage.setItem(XSUAA_RECOVERY_KEY, "1");
        clearBrowserSession();
        // A top-level request lets AppRouter renew XSUAA. Replaying the failed
        // write automatically would risk duplicate business side effects.
        window.location.reload();
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

    function redirectToBtpLogin() {
        window.location.replace("/login.html");
        // Navigation replaces this page. Keeping the auth promise pending avoids
        // rendering a false access-denied state while XSUAA establishes a session.
        return new Promise(function () {});
    }

    function showSafeAccessError() {
        renderSafeError(
            "Your account cannot access IDTS. Please contact the project administrator.",
            false
        );
    }

    function showServiceUnavailable() {
        renderSafeError(
            "IDTS is temporarily unavailable while a platform service is starting. Please try again.",
            true
        );
    }

    function renderSafeError(message, retryAllowed) {
        function render() {
            var host = document.getElementById("idtsAuthError");
            var text;
            var retry;
            if (!host) return;

            host.replaceChildren();
            text = document.createElement("p");
            text.textContent = message;
            host.appendChild(text);

            if (retryAllowed) {
                retry = document.createElement("button");
                retry.type = "button";
                retry.textContent = "Retry";
                retry.addEventListener("click", function () {
                    window.location.reload();
                });
                host.appendChild(retry);
            }

            host.hidden = false;
        }

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", render, { once: true });
        } else {
            render();
        }
    }
}());
