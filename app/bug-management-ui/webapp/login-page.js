/**
 * IDTS Login Page Script - loaded by login.html.
 *
 * Builds a standalone SAPUI5 login page before the Fiori Elements app starts.
 * It calls POST /odata/v4/auth/login, stores only the returned token and safe
 * user profile in sessionStorage, then redirects to index.html.
 *
 * No password, bearer token, private endpoint, or raw backend diagnostic is
 * written to console, local storage, cookies, or the DOM.
 */
(function () {
    "use strict";

    var AUTH_LOGIN = "/odata/v4/auth/login";
    var TOKEN_KEY = "idts_auth_token";
    var USER_KEY = "idts_auth_user";
    var EXPIRES_KEY = "idts_auth_expires";
    var GENERIC_LOGIN_ERROR = "We could not sign you in right now. Please try again later.";
    var INVALID_LOGIN_ERROR = "Invalid email or password.";

    if (sessionStorage.getItem(TOKEN_KEY)) {
        goToApp();
        return;
    }

    sap.ui.require([
        "sap/m/App",
        "sap/m/Page",
        "sap/m/HBox",
        "sap/m/VBox",
        "sap/m/Panel",
        "sap/m/Avatar",
        "sap/m/Title",
        "sap/m/Text",
        "sap/m/Label",
        "sap/m/Input",
        "sap/m/Button",
        "sap/m/MessageStrip"
    ], function (
        App,
        Page,
        HBox,
        VBox,
        Panel,
        Avatar,
        Title,
        Text,
        Label,
        Input,
        Button,
        MessageStrip
    ) {
        var InputType = {
            Email: "Email",
            Password: "Password"
        };
        var ButtonType = {
            Emphasized: "Emphasized"
        };
        var MessageType = {
            Error: "Error"
        };
        var ValueState = {
            Error: "Error",
            None: "None"
        };

        var emailInput = new Input({
            type: InputType.Email,
            placeholder: "name@example.com",
            width: "100%",
            required: true
        });
        var passwordInput = new Input({
            type: InputType.Password,
            placeholder: "Enter your password",
            width: "100%",
            required: true
        });
        var messageStrip = new MessageStrip({
            type: MessageType.Error,
            showIcon: true,
            showCloseButton: true,
            visible: false
        }).addStyleClass("idtsLoginMessage");
        var signInButton = new Button({
            text: "Sign In",
            type: ButtonType.Emphasized,
            width: "100%",
            press: submitLogin
        }).addStyleClass("idtsLoginButton");

        emailInput.attachSubmit(submitLogin);
        passwordInput.attachSubmit(submitLogin);

        var emailLabel = new Label({ text: "Email", required: true, labelFor: emailInput });
        var passwordLabel = new Label({ text: "Password", required: true, labelFor: passwordInput });

        var loginCard = new Panel({
            backgroundDesign: "Solid",
            content: [
                new VBox({
                    alignItems: "Center",
                    items: [
                        new Avatar({
                            initials: "ID",
                            displayShape: "Circle",
                            displaySize: "L",
                            backgroundColor: "Accent6"
                        }).addStyleClass("idtsLoginAvatar"),
                        new Title({ text: "Issue & Defect Tracking", level: "H1", titleStyle: "H3" }),
                        new Text({ text: "Sign in with your IDTS account to continue." })
                    ]
                }).addStyleClass("idtsLoginBrand"),
                messageStrip,
                new VBox({
                    width: "100%",
                    items: [
                        emailLabel,
                        emailInput,
                        passwordLabel,
                        passwordInput,
                        signInButton
                    ]
                }).addStyleClass("idtsLoginForm")
            ]
        }).addStyleClass("idtsLoginCard");

        new App({
            pages: [
                new Page({
                    showHeader: false,
                    content: [
                        new HBox({
                            alignItems: "Center",
                            justifyContent: "Center",
                            wrap: "Wrap",
                            items: [loginCard]
                        }).addStyleClass("idtsLoginShell")
                    ]
                })
            ]
        }).placeAt("loginContent");

        function submitLogin() {
            var email = emailInput.getValue().trim();
            var password = passwordInput.getValue();

            hideMessage();
            resetValueStates();

            if (!email || !password) {
                if (!email) {
                    emailInput.setValueState(ValueState.Error);
                    emailInput.setValueStateText("Email is required.");
                }
                if (!password) {
                    passwordInput.setValueState(ValueState.Error);
                    passwordInput.setValueStateText("Password is required.");
                }
                showMessage("Please enter your email and password.");
                return;
            }

            setBusy(true);

            fetch(AUTH_LOGIN, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email, password: password })
            })
                .then(function (res) {
                    if (!res.ok) {
                        return readSafeError(res).then(function (message) {
                            throw new Error(message);
                        });
                    }
                    return res.json();
                })
                .then(function (data) {
                    var result = data && data.value ? data.value : data;
                    if (!result || !result.token || !result.user) {
                        throw new Error(GENERIC_LOGIN_ERROR);
                    }
                    sessionStorage.setItem(TOKEN_KEY, result.token);
                    sessionStorage.setItem(USER_KEY, JSON.stringify(result.user));
                    sessionStorage.setItem(EXPIRES_KEY, result.expiresAt || "");
                    goToApp();
                })
                .catch(function (err) {
                    setBusy(false);
                    showMessage(err && err.message ? err.message : GENERIC_LOGIN_ERROR);
                });
        }

        function readSafeError(res) {
            if (res.status === 401 || res.status === 400) {
                return res.json()
                    .then(function (body) {
                        return body && body.error && body.error.message
                            ? body.error.message
                            : INVALID_LOGIN_ERROR;
                    })
                    .catch(function () {
                        return INVALID_LOGIN_ERROR;
                    });
            }
            return Promise.resolve(GENERIC_LOGIN_ERROR);
        }

        function showMessage(message) {
            messageStrip.setText(message);
            messageStrip.setVisible(true);
        }

        function hideMessage() {
            messageStrip.setVisible(false);
        }

        function resetValueStates() {
            emailInput.setValueState(ValueState.None);
            passwordInput.setValueState(ValueState.None);
        }

        function setBusy(busy) {
            signInButton.setBusy(busy);
            signInButton.setEnabled(!busy);
            emailInput.setEnabled(!busy);
            passwordInput.setEnabled(!busy);
        }
    });

    function goToApp() {
        var base = window.location.pathname.replace(/\/login\.html(\?.*)?$/, "");
        window.location.href = base + "/index.html";
    }
})();
