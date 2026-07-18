/**
 * Gợi ý học/debug: summary chỉ để đọc; trace từ openDialog → summarizeBugHandoff OData → enrichSummary → JSONModel.
 * Handoff summary review dialog for the Bugs Object Page.
 *
 * This UI reuses the backend summarizeBugHandoff action. It only displays
 * grounded review text and never writes comments, history, status, or assignee.
 */
/* global Promise */
sap.ui.define([
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/ObjectStatus",
    "sap/m/MessageStrip",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Label",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "../ai/AiReviewUi"
], function (
    Dialog,
    Button,
    Text,
    ObjectStatus,
    MessageStrip,
    VBox,
    HBox,
    Label,
    MessageBox,
    JSONModel,
    AiReviewUi
) {
    "use strict";

    var INTERNAL_COPY_PATTERN = /\b(prompt|token|model|provider|architecture|debug|stack|sql|password|credential|secret|api key|bearer|endpoint)\b/i;

    function isBugContext(context) {
        // Chỉ nhận root /Bugs(...) để summary luôn thuộc Bug đang mở.
        return !!context && typeof context.getPath === "function" && /^\/Bugs\([^/]+\)$/.test(context.getPath());
    }

    function findBugContext(control) {
        // Nút trong History đi ngược cây control để tìm binding context của Bug.
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

    function findHost(control) {
        // Host cung cấp model/i18n và quản lý vòng đời dialog.
        var current = control;
        while (current) {
            if (
                typeof current.getModel === "function" &&
                typeof current.addDependent === "function"
            ) {
                return current;
            }
            current = typeof current.getParent === "function" ? current.getParent() : null;
        }
        throw new Error("Handoff summary host control is not available.");
    }

    function getText(view, key, args) {
        var model = view.getModel("i18n") || view.getModel("@i18n");
        var bundle = model && model.getResourceBundle && model.getResourceBundle();
        return bundle && bundle.getText ? bundle.getText(key, args) : key;
    }

    function getAiText(view) {
        return function (key, args) {
            return getText(view, key, args);
        };
    }

    function safeText(value, fallback) {
        // Chặn text rỗng hoặc dev-facing trước khi đưa summary lên UI.
        var text = typeof value === "string" ? value.trim() : "";
        if (!text || INTERNAL_COPY_PATTERN.test(text)) {
            return fallback || "";
        }
        return text;
    }

    function normalizeResult(result) {
        // CAP action có thể trả object bọc value; trả về một shape thống nhất.
        if (result && result.value && typeof result.value === "object") {
            return result.value;
        }
        return result || {};
    }

    function readHandoffSummary(model, bugID) {
        // Gọi unbound action summarizeBugHandoff bằng Bug ID; không PATCH status/comment/history.
        // Breakpoint ở đây khi action trả lỗi hoặc dữ liệu không khớp.
        var operation = model.bindContext("/summarizeBugHandoff(...)", undefined, { $$ownRequest: true });
        operation.setParameter("sourceBugID", bugID);
        return operation.invoke("$direct").then(function () {
            var resultContext = operation.getBoundContext && operation.getBoundContext();
            if (resultContext && typeof resultContext.requestObject === "function") {
                return resultContext.requestObject();
            }
            return {};
        }).then(normalizeResult);
    }

    function formatDate(value) {
        // Chỉ format timestamp cho display; không thay đổi thời gian nguồn.
        if (!value) {
            return "";
        }
        var date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) {
            return String(value);
        }
        return date.toLocaleString();
    }

    function section(labelKey, textPath) {
        // Factory UI cho từng khối summary, giảm lặp control nhưng không chứa business rule.
        return new VBox({
            items: [
                new Label({ text: labelKey, design: "Bold" }),
                new Text({
                    text: textPath,
                    wrapping: true
                }).addStyleClass("sapUiTinyMarginTop")
            ]
        }).addStyleClass("sapUiSmallMarginBottom");
    }

    function enrichSummary(result, view) {
        // Sanitize và map backend result thành view-model review-only.
        var review = AiReviewUi.decorateResult({
            explanation: result.summary,
            confidence: result.confidence,
            providerStatus: result.providerStatus,
            warnings: result.groundingStatus === "SPARSE" ? getText(view, "handoffSummarySparseWarning") : ""
        }, getAiText(view));

        return {
            bugNumber: safeText(result.bugNumber, getText(view, "handoffSummaryUnknownBug")),
            generatedAt: formatDate(result.generatedAt),
            reviewStatus: review.meta,
            reviewState: review.state,
            warnings: review.warnings,
            hasWarnings: review.hasWarnings,
            summary: review.explanation,
            currentStatus: safeText(result.currentStatus, getText(view, "handoffSummaryNoDetails")),
            currentActionOwner: safeText(result.currentActionOwner, getText(view, "handoffSummaryNoDetails")),
            missingInformation: safeText(result.missingInformation, getText(view, "handoffSummaryNoMissingInfo")),
            latestImportantEvents: safeText(result.latestImportantEvents, getText(view, "handoffSummaryNoEvents")),
            nextExpectedAction: safeText(result.nextExpectedAction, getText(view, "handoffSummaryNoNextAction")),
            decisionHint: review.decisionHint
        };
    }

    function buildDialog(view, model, bugID) {
        // Tạo loading model, invoke action, cập nhật state; failure chỉ báo lỗi, không ảnh hưởng workflow.
        var state = new JSONModel({
            busy: true,
            bugNumber: "",
            generatedAt: "",
            reviewStatus: getText(view, "aiReviewStatusReviewRequired"),
            reviewState: "Information",
            warnings: "",
            hasWarnings: false,
            summary: getText(view, "handoffSummaryLoading"),
            currentStatus: "",
            currentActionOwner: "",
            missingInformation: "",
            latestImportantEvents: "",
            nextExpectedAction: "",
            decisionHint: getText(view, "aiReviewDecisionHint")
        });

        var dialog = new Dialog({
            title: getText(view, "handoffSummaryDialogTitle"),
            contentWidth: "48rem",
            contentHeight: "36rem",
            resizable: true,
            draggable: true,
            busy: "{handoffSummary>/busy}",
            content: [
                new VBox({
                    width: "100%",
                    items: [
                        new MessageStrip({
                            text: getText(view, "handoffSummaryIntroMessage"),
                            type: "Information",
                            showIcon: true
                        }),
                        new MessageStrip({
                            text: "{handoffSummary>/warnings}",
                            type: "Warning",
                            showIcon: true,
                            visible: "{handoffSummary>/hasWarnings}"
                        }).addStyleClass("sapUiTinyMarginTop"),
                        new HBox({
                            justifyContent: "SpaceBetween",
                            alignItems: "Center",
                            items: [
                                new Text({ text: "{handoffSummary>/bugNumber}", wrapping: true }),
                                new ObjectStatus({
                                    text: "{handoffSummary>/reviewStatus}",
                                    state: "{handoffSummary>/reviewState}"
                                })
                            ]
                        }).addStyleClass("sapUiSmallMarginTop sapUiSmallMarginBottom"),
                        section(getText(view, "handoffSummarySummaryLabel"), "{handoffSummary>/summary}"),
                        section(getText(view, "handoffSummaryStatusLabel"), "{handoffSummary>/currentStatus}"),
                        section(getText(view, "handoffSummaryOwnerLabel"), "{handoffSummary>/currentActionOwner}"),
                        section(getText(view, "handoffSummaryMissingLabel"), "{handoffSummary>/missingInformation}"),
                        section(getText(view, "handoffSummaryEventsLabel"), "{handoffSummary>/latestImportantEvents}"),
                        section(getText(view, "handoffSummaryNextActionLabel"), "{handoffSummary>/nextExpectedAction}"),
                        new Text({
                            text: "{handoffSummary>/decisionHint}",
                            wrapping: true
                        }),
                        new Text({
                            text: "{handoffSummary>/generatedAt}",
                            wrapping: true,
                            visible: "{= !!%{handoffSummary>/generatedAt} }"
                        }).addStyleClass("sapUiSmallMarginTop sapThemeMetaData")
                    ]
                }).addStyleClass("sapUiSmallMargin")
            ],
            endButton: new Button({
                text: getText(view, "handoffSummaryCloseButton"),
                press: function () {
                    dialog.close();
                }
            }),
            afterClose: function () {
                dialog.destroy();
            }
        });

        dialog.setModel(state, "handoffSummary");
        view.addDependent(dialog);

        readHandoffSummary(model, bugID)
            .then(function (result) {
                state.setData(Object.assign(state.getData(), enrichSummary(result, view)));
            })
            .catch(function () {
                MessageBox.error(getText(view, "handoffSummaryLoadFailed"));
            })
            .finally(function () {
                state.setProperty("/busy", false);
            });

        return dialog;
    }

    return {
        openDialog: function (event) {
            // History fragment gọi entry point: tìm Bug → đọc ID → build/open dialog.
            var source = event.getSource();
            var view = findHost(source);
            var bugContext = findBugContext(source);
            if (!bugContext) {
                MessageBox.error(getText(view, "handoffSummaryLoadFailed"));
                return Promise.resolve(null);
            }

            return bugContext.requestProperty("ID").then(function (bugID) {
                if (!bugID) {
                    MessageBox.error(getText(view, "handoffSummaryLoadFailed"));
                    return null;
                }
                var dialog = buildDialog(view, bugContext.getModel(), bugID);
                dialog.open();
                return dialog;
            });
        }
    };
});
