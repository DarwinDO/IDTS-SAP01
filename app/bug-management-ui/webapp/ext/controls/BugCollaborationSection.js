sap.ui.define([
    "sap/m/VBox",
    "idts/bugmanagementui/ext/sections/BugCollaboration"
], function (VBox, Collaboration) {
    "use strict";

    function setNearestObjectPageSubSectionVisible(control, visible) {
        var parent = control && typeof control.getParent === "function" ? control.getParent() : null;

        while (parent) {
            if (
                parent.getMetadata &&
                parent.getMetadata().getName &&
                parent.getMetadata().getName() === "sap.uxap.ObjectPageSubSection" &&
                typeof parent.setVisible === "function"
            ) {
                parent.setVisible(visible);
                return;
            }
            parent = typeof parent.getParent === "function" ? parent.getParent() : null;
        }
    }

    function findNearestParentContext(control) {
        var parent = control && typeof control.getParent === "function" ? control.getParent() : null;
        var parentContext = null;

        while (parent && !parentContext) {
            if (typeof parent.getBindingContext === "function") {
                parentContext = parent.getBindingContext();
            }
            parent = typeof parent.getParent === "function" ? parent.getParent() : null;
        }

        return parentContext;
    }

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
        metadata: {
            properties: {
                hideOnCreate: {
                    type: "boolean",
                    defaultValue: false
                },
                uploadPendingAttachmentsOnActive: {
                    type: "boolean",
                    defaultValue: false
                }
            }
        },

        _syncIdtsCollaborationState: function () {
            var parentContext = findNearestParentContext(this);

            if (parentContext && this.getBindingContext() !== parentContext) {
                this.setBindingContext(parentContext);
            }

            if (this.getHideOnCreate && this.getHideOnCreate()) {
                var visible = !Collaboration.isCreateDraftContext(parentContext);
                this.setVisible(visible);
                setNearestObjectPageSubSectionVisible(this, visible);
            }

            if (this.getUploadPendingAttachmentsOnActive && this.getUploadPendingAttachmentsOnActive()) {
                Collaboration.flushPendingCreateAttachments(this, parentContext);
            }
        },

        onModelContextChange: function () {
            this._syncIdtsCollaborationState();
            if (VBox.prototype.onModelContextChange) {
                VBox.prototype.onModelContextChange.apply(this, arguments);
            }
        },

        onBeforeRendering: function () {
            this._syncIdtsCollaborationState();

            VBox.prototype.onBeforeRendering.apply(this, arguments);
        }
    });
});
