/**
 * Supported Fiori Elements List Report actions for IDTS Bugs.
 *
 * The standard Create action is hidden by annotation. This replacement reads
 * the safe login profile only to decide whether the button should be visible;
 * the CAP backend remains the authorization boundary.
 */
sap.ui.define([
    "../login/LoginController"
], function (LoginSession) {
    "use strict";

    function canCreateBug() {
        var user = LoginSession.getUser();
        return Boolean(user && (user.role_code === "TESTER" || user.role_code === "PM"));
    }

    function getModelFromActionContext(actionContext) {
        if (actionContext && typeof actionContext.getModel === "function") {
            return actionContext.getModel();
        }

        if (actionContext && typeof actionContext.getView === "function") {
            return actionContext.getView().getModel();
        }

        // In the current Fiori Elements runtime, manifest-based header actions
        // receive an ExtensionAPI-like object with editFlow and _view, not a
        // controller with getView(). Keep this fallback isolated and covered by
        // browser smoke because editFlow remains the supported creation API.
        if (actionContext && actionContext._view && typeof actionContext._view.getModel === "function") {
            return actionContext._view.getModel();
        }

        throw new Error("Fiori Elements model is not available for bug creation.");
    }

    function getEditFlowFromActionContext(actionContext) {
        if (actionContext && actionContext.editFlow) {
            return actionContext.editFlow;
        }

        if (actionContext && actionContext.extension && actionContext.extension.editFlow) {
            return actionContext.extension.editFlow;
        }

        throw new Error("Fiori Elements edit flow is not available for bug creation.");
    }

    return {
        isCreateVisible: function () {
            return canCreateBug();
        },

        createBug: function () {
            if (!canCreateBug()) {
                return Promise.reject(new Error("Current user is not allowed to create bug reports."));
            }

            var model = getModelFromActionContext(this);
            var editFlow = getEditFlowFromActionContext(this);
            var listBinding = model.bindList("/Bugs");

            return editFlow.createDocument(listBinding, {
                creationMode: "NewPage"
            });
        }
    };
});
