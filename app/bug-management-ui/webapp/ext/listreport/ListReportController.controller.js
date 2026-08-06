sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension"
], function (ControllerExtension) {
    "use strict";

    var ALLOWED_STATUSES = new Set([
        "PENDING_ASSIGNMENT",
        "ASSIGNED",
        "IN_REVIEW",
        "NEED_MORE_INFORMATION",
        "IN_PROGRESS",
        "RESOLVED",
        "RETEST_REQUIRED",
        "REJECTED",
        "REOPENED",
        "CLOSED"
    ]);

    return ControllerExtension.extend("idts.bugmanagementui.ext.listreport.ListReportController", {
        override: {
            onAfterRendering: function () {
                if (this._dashboardStatusApplied) {
                    return;
                }

                var query = String(window.location.hash || "").split("?")[1] || "";
                var statusCode = new URLSearchParams(query).get("status_code");
                if (!ALLOWED_STATUSES.has(statusCode)) {
                    return;
                }

                this._dashboardStatusApplied = true;
                this.base.getExtensionAPI().setFilterValues("status_code", "EQ", statusCode);
            }
        }
    });
});
