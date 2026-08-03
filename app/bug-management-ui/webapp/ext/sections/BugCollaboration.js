sap.ui.define([
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (MessageBox, MessageToast) {
    "use strict";

    function showSafeError(message) {
        MessageBox.error(message || "The action could not be completed right now. Please refresh and try again.");
    }

    function isBugContext(context) {
        return !!context && typeof context.getPath === "function" && /^\/Bugs\([^/]+\)$/.test(context.getPath());
    }

    function isCreateDraftContext(context) {
        return !!context &&
            context.getProperty("IsActiveEntity") !== true &&
            context.getProperty("HasActiveEntity") !== true;
    }

    function findBugContext(control) {
        var current = control;

        while (current) {
            if (typeof current.getBindingContext === "function") {
                var context = current.getBindingContext();
                if (isBugContext(context)) {
                    return context;
                }
            }
            current = typeof current.getParent === "function" ? current.getParent() : null;
        }
        return null;
    }

    function findControlRecursive(control, localId) {
        if (!control || typeof control.getId !== "function") {
            return null;
        }
        if (control.getId().split("--").pop() === localId) {
            return control;
        }

        var aggregations = control.getMetadata && control.getMetadata().getAllAggregations
            ? control.getMetadata().getAllAggregations()
            : {};

        return Object.keys(aggregations).reduce(function (found, aggregationName) {
            if (found || typeof control.getAggregation !== "function") {
                return found;
            }
            var aggregation = control.getAggregation(aggregationName);
            if (Array.isArray(aggregation)) {
                return aggregation.reduce(function (innerFound, child) {
                    return innerFound || findControlRecursive(child, localId);
                }, null);
            }
            return found || findControlRecursive(aggregation, localId);
        }, null);
    }

    function findControlByLocalId(control, localId) {
        var current = control;

        while (current) {
            var found = findControlRecursive(current, localId);
            if (found) {
                return found;
            }
            current = typeof current.getParent === "function" ? current.getParent() : null;
        }
        return null;
    }

    function refreshBugContext(context) {
        if (context && typeof context.requestRefresh === "function") {
            return context.requestRefresh();
        }
        return window.Promise.resolve();
    }

    function assertCommentableBug(context) {
        if (!context) {
            showSafeError("The bug data is not available yet. Please refresh the page.");
            return false;
        }
        if (context.getProperty("IsActiveEntity") !== true) {
            showSafeError("Please save the bug before adding a comment.");
            return false;
        }
        if (context.getProperty("HasDraftEntity") === true) {
            showSafeError("Please save or discard the current draft before adding a comment.");
            return false;
        }
        return true;
    }

    return {
        onAddComment: function (event) {
            var source = event.getSource();
            var model = source.getModel();
            var bugContext = findBugContext(source);

            if (!assertCommentableBug(bugContext)) {
                return;
            }

            var textArea = findControlByLocalId(source, "idtsCommentTextArea");
            var content = textArea && typeof textArea.getValue === "function" ? textArea.getValue().trim() : "";

            if (!content) {
                if (textArea) {
                    textArea.setValueState("Error");
                    textArea.setValueStateText("Enter a comment before posting.");
                }
                return;
            }

            if (textArea) {
                textArea.setValueState("None");
            }
            source.setEnabled(false);

            // Use the OData V4 model so UI5 handles CSRF and the bound-action lifecycle.
            var operation = model.bindContext(
                bugContext.getPath() + "/BugService.addComment(...)",
                undefined,
                { $$ownRequest: true }
            );
            operation.setParameter("content", content);

            operation.invoke("$direct")
                .then(function () {
                    if (textArea) {
                        textArea.setValue("");
                    }
                    return refreshBugContext(bugContext);
                })
                .then(function () {
                    MessageToast.show("Comment posted.");
                })
                .catch(function () {
                    showSafeError("The comment could not be posted. Please refresh and try again.");
                })
                .finally(function () {
                    source.setEnabled(true);
                });
        },

        formatDateTime: function (value) {
            if (!value) {
                return "";
            }
            try {
                return new Intl.DateTimeFormat(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short"
                }).format(new Date(value));
            } catch (error) {
                void error;
                return value;
            }
        },

        formatAuthorInfo: function (name, role) {
            return role || name || "";
        },

        isCreateDraftContext: isCreateDraftContext
    };
});
