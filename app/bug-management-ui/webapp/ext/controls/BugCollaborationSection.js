sap.ui.define([
    "sap/m/VBox"
], function (VBox) {
    "use strict";

    /**
     * Root container for the IDTS comments and evidence custom sections.
     *
     * Fiori Elements places custom section content inside a SubSectionBlock.
     * The block has the active Bug binding context, but plain fragment content
     * does not inherit it in the current runtime. This control copies only the
     * public binding context from the nearest parent so normal XML bindings can
     * resolve Bug fields and navigation properties.
     */
    return VBox.extend("idts.bugmanagementui.ext.controls.BugCollaborationSection", {
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
