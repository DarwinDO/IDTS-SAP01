sap.ui.define([
    "sap/m/VBox"
], function (VBox) {
    "use strict";

    /**
     * Root container for the smart assignment custom section.
     *
     * Fiori Elements places the custom section inside a framework block that
     * owns the Bug binding context. This control copies that public binding
     * context from the nearest parent so the section can bind to Bug fields
     * without reading DOM nodes or framework-internal control IDs.
     */
    return VBox.extend("idts.bugmanagementui.ext.controls.SmartAssignmentSection", {
        renderer: VBox.getMetadata().getRenderer(),

        onBeforeRendering: function () {
            var parent = this.getParent();
            var parentContext = null;

            while (parent && !parentContext) {
                if (typeof parent.getBindingContext === "function") {
                    parentContext = parent.getBindingContext();
                }
                parent = typeof parent.getParent === "function" ? parent.getParent() : null;
            }

            if (parentContext && this.getBindingContext() !== parentContext) {
                this.setBindingContext(parentContext);
            }

            VBox.prototype.onBeforeRendering.apply(this, arguments);
        }
    });
});
