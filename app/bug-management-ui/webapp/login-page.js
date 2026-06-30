/**
 * IDTS Login Page Script – loaded by login.html.
 *
 * Handles the standalone login form: POSTs credentials to
 * POST /odata/v4/auth/login, stores the returned token in
 * sessionStorage, then redirects to index.html.
 *
 * No password or token is written to console, local storage, or cookies.
 */
(function () {
    "use strict";

    var AUTH_LOGIN  = "/odata/v4/auth/login";
    var TOKEN_KEY   = "idts_auth_token";
    var USER_KEY    = "idts_auth_user";
    var EXPIRES_KEY = "idts_auth_expires";

    // If already authenticated, skip the form and go straight to the app
    if (sessionStorage.getItem(TOKEN_KEY)) {
        goToApp();
        return;
    }

    document.addEventListener("DOMContentLoaded", function () {
        var form       = document.getElementById("loginForm");
        var emailEl    = document.getElementById("email");
        var passwordEl = document.getElementById("password");
        var submitBtn  = document.getElementById("submitBtn");
        var errorBar   = document.getElementById("errorBar");

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var email    = emailEl.value.trim();
            var password = passwordEl.value;

            if (!email || !password) {
                showError("Please enter your email and password.");
                return;
            }

            setLoading(true);
            hideError();

            fetch(AUTH_LOGIN, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ email: email, password: password })
            })
            .then(function (res) {
                if (!res.ok) {
                    return res.json().then(function (body) {
                        var msg = (body && body.error && body.error.message)
                            ? body.error.message
                            : "Invalid email or password.";
                        throw new Error(msg);
                    });
                }
                return res.json();
            })
            .then(function (data) {
                // OData action responses may wrap the result in a value property
                var result = (data && data.value) ? data.value : data;
                sessionStorage.setItem(TOKEN_KEY,   result.token);
                sessionStorage.setItem(USER_KEY,    JSON.stringify(result.user));
                sessionStorage.setItem(EXPIRES_KEY, result.expiresAt || "");
                goToApp();
            })
            .catch(function (err) {
                setLoading(false);
                showError(err.message || "An unexpected error occurred.");
            });
        });

        function showError(msg) {
            errorBar.textContent = msg;
            errorBar.classList.add("visible");
        }
        function hideError() {
            errorBar.classList.remove("visible");
        }
        function setLoading(busy) {
            submitBtn.disabled    = busy;
            submitBtn.textContent = busy ? "Signing in\u2026" : "Sign In";
        }
    });

    function goToApp() {
        var base = window.location.pathname.replace(/\/login\.html(\?.*)?$/, "");
        window.location.href = base + "/index.html";
    }
})();
