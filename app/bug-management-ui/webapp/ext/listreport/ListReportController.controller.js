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
    var DASHBOARD_UUID_FILTERS = ["reporter_ID", "nextProcessorUser_ID", "assignee_ID"];
    var UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    return ControllerExtension.extend("idts.bugmanagementui.ext.listreport.ListReportController", {
        override: {
            onAfterRendering: async function () {
                if (this._dashboardFiltersApplied || this._dashboardFiltersApplying) {
                    return;
                }

                var query = String(window.location.hash || "").split("?")[1] || "";
                var params = new URLSearchParams(query);
                var filters = [];
                var statusCode = params.get("status_code");

                if (ALLOWED_STATUSES.has(statusCode)) {
                    filters.push({ property: "status_code", operator: "EQ", value: statusCode });
                } else if (params.get("exclude_closed") === "true") {
                    filters.push({ property: "status_code", operator: "NE", value: "CLOSED" });
                }
                DASHBOARD_UUID_FILTERS.forEach(function (property) {
                    var value = params.get(property);
                    if (UUID_PATTERN.test(value || "")) {
                        filters.push({ property: property, operator: "EQ", value: value });
                    }
                });

                if (!filters.length) {
                    return;
                }

                this._dashboardFiltersApplying = true;
                var extensionAPI = this.base.getExtensionAPI();
                try {
                    await Promise.all(filters.map(function (filter) {
                        return extensionAPI.setFilterValues(filter.property, filter.operator, filter.value);
                    }));
                    await extensionAPI.refresh();
                    this._dashboardFiltersApplied = true;
                } finally {
                    this._dashboardFiltersApplying = false;
                }
            }
        }
    });
});
