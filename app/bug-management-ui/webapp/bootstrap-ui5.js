/**
 * Starts UI5 only after the selected authentication mode has a safe IDTS user.
 * This prevents local custom-auth pages from sending anonymous OData requests
 * while allowing the SAP BTP AppRouter/XSUAA session to be resolved first.
 */
(function () {
    "use strict";

    var authReady = window.idtsAuthReady || Promise.reject(new Error("Auth guard is not loaded."));

    authReady
        .then(function () {
            var isDashboard = /\/dashboard\.html$/.test(window.location.pathname);
            var script = document.createElement("script");
            script.id = "sap-ui-bootstrap";
            script.src = "resources/sap-ui-core.js";
            script.setAttribute("data-sap-ui-theme", "sap_horizon");
            script.setAttribute("data-sap-ui-language", "en");
            script.setAttribute("data-sap-ui-ignore-url-params", "true");
            script.setAttribute("data-sap-ui-resource-roots", '{"idts.bugmanagementui":"./"}');
            script.setAttribute("data-sap-ui-compat-version", "edge");
            script.setAttribute("data-sap-ui-async", "true");
            script.setAttribute("data-sap-ui-frame-options", "trusted");

            if (!isDashboard) {
                script.setAttribute("data-sap-ui-on-init", "module:sap/ui/core/ComponentSupport");
            }

            if (isDashboard) {
                script.addEventListener("load", function () {
                    var entry = document.createElement("script");
                    entry.src = "dashboard-page.js";
                    document.head.appendChild(entry);
                }, { once: true });
            }

            document.head.appendChild(script);
        })
        .catch(function () {
            // auth-guard.js owns the safe redirect or access-denied message.
        });
}());
