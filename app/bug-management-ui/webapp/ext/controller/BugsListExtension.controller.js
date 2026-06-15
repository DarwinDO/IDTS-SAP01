sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension"
], function (ControllerExtension) {
    "use strict";

    return ControllerExtension.extend("idts.bugmanagementui.ext.controller.BugsListExtension", {
        onOpenGuidedCreate: function () {
            this.base.routing.navigateToRoute("GuidedCreateBugPage");
        }
    });
});
