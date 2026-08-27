sap.ui.define([
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], function (MessageBox, MessageToast, JSONModel) {
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

    function refreshCommentsFeed(control) {
        var commentsFeed = findControlByLocalId(control, "idtsCommentsFeed");
        var itemsBinding = commentsFeed && typeof commentsFeed.getBinding === "function"
            ? commentsFeed.getBinding("items")
            : null;

        if (itemsBinding && typeof itemsBinding.requestRefresh === "function") {
            return window.Promise.resolve().then(function () {
                return itemsBinding.requestRefresh("$direct");
            });
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
        if (context.getProperty("status_code") === "CLOSED") {
            showSafeError("Closed bugs are read-only. Reopen the bug before adding a comment.");
            return false;
        }
        return true;
    }

    function mentionState(picker) {
        var state = picker.getModel("mentionRecipients");
        if (!state) {
            state = new JSONModel({ items: [] });
            picker.setModel(state, "mentionRecipients");
        }
        return state;
    }

    function normalizeMentionCandidates(result) {
        return Array.isArray(result) ? result.filter(function (candidate) {
            return candidate && typeof candidate.ID === "string" && typeof candidate.displayName === "string";
        }) : [];
    }

    function readMentionCandidates(picker, context) {
        var model = picker.getModel();
        var contextPath = context && context.getPath && context.getPath();
        if (!model || !contextPath || !isBugContext(context)) {
            return;
        }
        var state = mentionState(picker);
        picker.data("mentionBugPath", contextPath);
        picker.setSelectedKeys([]);
        state.setProperty("/items", []);
        picker.setBusy(true);

        var operation = model.bindContext(contextPath + "/BugService.getMentionCandidates(...)", undefined, { $$ownRequest: true });
        // UI5 1.148 deprecates execute in favour of invoke for deferred bound functions.
        operation.invoke("$direct").then(function (result) {
            var resultContext = operation.getBoundContext && operation.getBoundContext();
            return resultContext && typeof resultContext.requestObject === "function" ? resultContext.requestObject() : result;
        }).then(function (result) {
            var currentContext = picker.getBindingContext();
            if (picker.data("mentionBugPath") !== contextPath || !currentContext || currentContext.getPath() !== contextPath) {
                return;
            }
            state.setProperty("/items", normalizeMentionCandidates(result));
        }).catch(function () {
            if (picker.data("mentionBugPath") === contextPath) {
                state.setProperty("/items", []);
            }
        }).finally(function () {
            if (picker.data("mentionBugPath") === contextPath) {
                picker.setBusy(false);
            }
        });
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
            var mentionPicker = findControlByLocalId(source, "idtsMentionRecipients");
            var content = textArea && typeof textArea.getValue === "function" ? textArea.getValue().trim() : "";
            var mentionedUserIDs = mentionPicker && typeof mentionPicker.getSelectedKeys === "function" ? mentionPicker.getSelectedKeys() : [];

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
                bugContext.getPath() + "/BugService.addComment(...)"
            );
            operation.setParameter("content", content);
            operation.setParameter("mentionedUserIDs", mentionedUserIDs);

            operation.invoke("$auto")
                .then(function () {
                    if (textArea) {
                        textArea.setValue("");
                    }
                    if (mentionPicker) {
                        mentionPicker.setSelectedKeys([]);
                    }
                    return refreshCommentsFeed(source).then(function () {
                        MessageToast.show("Comment posted.");
                    }, function () {
                        MessageToast.show("Comment posted. Refresh the page to see it.");
                    });
                }, function () {
                    showSafeError("The comment could not be posted. Please refresh and try again.");
                })
                .finally(function () {
                    source.setEnabled(true);
                });
        },

        onMentionContextChanged: function (event) {
            var picker = event.getSource();
            var context = picker && picker.getBindingContext && picker.getBindingContext();
            readMentionCandidates(picker, context);
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
