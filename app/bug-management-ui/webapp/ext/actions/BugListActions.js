/**
 * Gợi ý học/debug: action List Report mở flow tạo bug; nếu Developer bị chặn, kiểm UI role rồi kiểm backend draft authorization.
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
        // Manifest action gọi để ẩn/hiện Create; safe profile chỉ phục vụ UX, không thay backend authorization.
        var user = LoginSession.getUser();
        return Boolean(user && user.role_code === "TESTER");
    }

    function canAdministerUsers() {
        // Capability được CAP cấp an toàn; UI chỉ dùng để UX và vẫn fail closed.
        var user = LoginSession.getUser();
        return Boolean(user && user.canAdministerUsers === true);
    }

    function getModelFromActionContext(actionContext) {
        // Chuẩn hóa các shape ExtensionAPI giữa Fiori runtime để lấy đúng OData V4 model.
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
        // Lấy Fiori EditFlow được hỗ trợ; không tự tạo draft bằng raw DOM/internal control.
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
            // Manifest gọi khi tính visible của action Create Bug.
            return canCreateBug();
        },

        openDashboard: function () {
            // Điều hướng sang custom dashboard nhưng giữ cùng session tab.
            window.location.href = window.location.pathname.replace(/\/index\.html.*$/, "/dashboard.html");
        },

        openUserAdministration: function () {
            // Đọc lại capability ngay lúc bấm; không mang theo domain, query hay token.
            if (!canAdministerUsers()) {
                return Promise.reject(new Error("Current user is not allowed to administer users."));
            }

            window.location.assign("/idtsuseradministrationui/index.html");
            return Promise.resolve();
        },

        createBug: function () {
            // Nút Create Bug gọi: check UX role → bind /Bugs → EditFlow.createDocument(NewPage).
            // CAP nhận NEW draft và kiểm quyền lại; breakpoint ở đây rồi sang srv handler khi bị 403.
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
