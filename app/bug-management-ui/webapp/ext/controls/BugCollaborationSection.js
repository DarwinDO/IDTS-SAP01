sap.ui.define([
    // Gợi ý học/debug: control này giữ binding context Object Page để fragment biết đang làm việc với bug nào.
    "sap/m/VBox",
    "idts/bugmanagementui/ext/sections/BugCollaboration"
], function (VBox, Collaboration) {
    "use strict";

    function setNearestObjectPageSubSectionVisible(control, visible) {
        // Khi create draft, ẩn cả subsection Comments chứ không chỉ child control để tránh khoảng trắng.
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
        // Custom fragment không tự inherit root Bug context trong runtime này; đi lên parent để lấy context public.
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
            // Đồng bộ context, visibility và upload pending mỗi lần model/render thay đổi.
            // Breakpoint ở đây khi comment không ẩn hoặc attachment chưa flush sau SAVE.
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
            // UI5 gọi khi draft chuyển context; sync trước rồi giữ lifecycle VBox mặc định.
            this._syncIdtsCollaborationState();
            if (VBox.prototype.onModelContextChange) {
                VBox.prototype.onModelContextChange.apply(this, arguments);
            }
        },

        onBeforeRendering: function () {
            // Safety pass ngay trước render để fragment dùng context mới nhất.
            this._syncIdtsCollaborationState();

            VBox.prototype.onBeforeRendering.apply(this, arguments);
        }
    });
});
