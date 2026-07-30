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
    "sap/m/List",
    "sap/m/CustomListItem",
    "sap/m/ExpandableText",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/format/DateFormat",
    "sap/ui/Device",
    "../ai/AiReviewUi",
    "../ai/AiSuggestionReview"
], function (
    Dialog,
    Button,
    Text,
    ObjectStatus,
    MessageStrip,
    VBox,
    HBox,
    Label,
    List,
    CustomListItem,
    ExpandableText,
    MessageBox,
    JSONModel,
    DateFormat,
    Device,
    AiReviewUi,
    AiSuggestionReview
) {
    "use strict";

    var INTERNAL_COPY_PATTERN = /\b(prompt|token|model|provider|architecture|debug|stack|sql|password|credential|secret|api key|bearer|endpoint)\b/i;
    var TIMELINE_DATE_FORMAT = DateFormat.getDateTimeInstance({ style: "medium/short" });
    var TIMELINE_PREFIX_PATTERN = /^(?:[-*\u2022]|\d+[.)])?\s*\[([^\]]+)\]\s*(.*)$/;

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
        return TIMELINE_DATE_FORMAT.format(date);
    }

    function section(labelKey, textPath) {
        // Factory UI cho từng khối summary, giảm lặp control nhưng không chứa business rule.
        return new VBox({
            items: [
                new Label({ text: labelKey, design: "Bold" }),
                new ExpandableText({
                    text: textPath,
                    maxCharacters: 320,
                    overflowMode: "InPlace"
                }).addStyleClass("sapUiTinyMarginTop")
            ]
        }).addStyleClass("sapUiSmallMarginBottom");
    }

    function formatTimelineItems(value, fallback) {
        var text = String(value || "").trim();
        var items = text.split(/\r?\n/).map(function (line) {
            var normalized = line.trim();
            var timestampMatch = normalized.match(TIMELINE_PREFIX_PATTERN);
            var body = timestampMatch ? timestampMatch[2] : normalized;
            var actorMatch = body.match(/^(.+?)(?:\s+\(([^)]+)\))?(?:\s+(?:\u00e2\u20ac\u201d|\u2014|-)\s+([^:]+))?:\s*(.*)$/);
            return {
                actor: actorMatch ? [actorMatch[1], actorMatch[2]].filter(Boolean).join(" · ") : "",
                action: actorMatch && actorMatch[3] || "",
                time: timestampMatch ? formatDate(timestampMatch[1]) : "",
                text: actorMatch ? actorMatch[4] : body
            };
        }).filter(function (item) {
            return Boolean(item.text);
        });
        return items.length ? items : [{ actor: "", action: "", time: "", text: fallback }];
    }

    function listSection(label, path) {
        var list = new List({ showSeparators: "Inner" });
        list.bindItems({
            path: path,
            template: new CustomListItem({
                content: [
                    new VBox({
                        items: [
                            new HBox({
                                wrap: "Wrap",
                                items: [
                                    new ObjectStatus({
                                        text: "{handoffSummary>actor}",
                                        state: "Information",
                                        visible: "{= !!%{handoffSummary>actor} }"
                                    }).addStyleClass("sapUiTinyMarginEnd"),
                                    new ObjectStatus({
                                        text: "{handoffSummary>action}",
                                        state: "None",
                                        visible: "{= !!%{handoffSummary>action} }"
                                    }).addStyleClass("sapUiTinyMarginEnd"),
                                    new Text({
                                        text: "{handoffSummary>time}",
                                        wrapping: true,
                                        visible: "{= !!%{handoffSummary>time} }"
                                    })
                                ]
                            }),
                            new ExpandableText({
                                text: "{handoffSummary>text}",
                                maxCharacters: 240,
                                overflowMode: "InPlace"
                            }).addStyleClass("sapUiTinyMarginTop")
                        ]
                    }).addStyleClass("sapUiTinyMargin")
                ]
            })
        });
        return new VBox({
            items: [
                new Label({ text: label, design: "Bold" }),
                list
            ]
        }).addStyleClass("sapUiSmallMarginBottom");
    }

    function enrichSummary(result, view) {
        // Sanitize và map backend result thành view-model review-only.
        var review = AiReviewUi.decorateResult({
            explanation: result.summary,
            confidence: result.confidence,
            providerStatus: result.providerStatus,
            warnings: result.groundingStatus === "PARTIAL_DATA" ? getText(view, "handoffSummarySparseWarning") : ""
        }, getAiText(view));

        return {
            suggestionID: result.suggestionID || null,
            bugNumber: safeText(result.bugNumber, getText(view, "handoffSummaryUnknownBug")),
            generatedAt: formatDate(result.generatedAt),
            reviewStatus: review.meta,
            warnings: review.warnings,
            hasWarnings: review.hasWarnings,
            summary: review.explanation,
            currentStatus: safeText(result.currentStatus, getText(view, "handoffSummaryNoDetails")),
            currentActionOwner: safeText(result.currentActionOwner, getText(view, "handoffSummaryNoDetails")),
            missingInformation: safeText(result.missingInformation, getText(view, "handoffSummaryNoMissingInfo")),
            commentItems: formatTimelineItems(result.commentSummary, getText(view, "handoffSummaryNoComments")),
            eventItems: formatTimelineItems(result.latestImportantEvents, getText(view, "handoffSummaryNoEvents")),
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
            warnings: "",
            hasWarnings: false,
            summary: getText(view, "handoffSummaryLoading"),
            currentStatus: "",
            currentActionOwner: "",
            missingInformation: "",
            commentItems: [],
            eventItems: [],
            nextExpectedAction: "",
            decisionHint: getText(view, "aiReviewDecisionHint"),
            suggestionID: null,
            reviewStateText: getText(view, "aiSuggestionReviewPending"),
            reviewStateState: "Information",
            reviewedByText: "",
            reviewActionEnabled: false
        });
        function submitReview(actionName) {
            return AiSuggestionReview.submit(model, state, actionName, function (key, args) {
                return getText(view, key, args);
            });
        }

        var dialog = new Dialog({
            title: getText(view, "handoffSummaryDialogTitle"),
            contentWidth: "48rem",
            contentHeight: "36rem",
            resizable: true,
            draggable: true,
            stretch: Device.system.phone,
            horizontalScrolling: false,
            busy: "{handoffSummary>/busy}",
            content: [
                new VBox({
                    items: [
                        new MessageStrip({
                            text: getText(view, "handoffSummaryIntroMessage"),
                            type: "Information",
                            showIcon: true
                        }),
                        new MessageStrip({
                            text: getText(view, "handoffSummaryReviewNotice"),
                            type: "Information",
                            showIcon: true
                        }).addStyleClass("sapUiTinyMarginTop"),
                        new MessageStrip({
                            text: "{handoffSummary>/warnings}",
                            type: "Warning",
                            showIcon: true,
                            visible: "{handoffSummary>/hasWarnings}"
                        }).addStyleClass("sapUiTinyMarginTop"),
                        new VBox({
                            items: [
                                new Text({ text: "{handoffSummary>/bugNumber}", wrapping: true }),
                                new Text({
                                    text: "{handoffSummary>/reviewStatus}",
                                    wrapping: true
                                }).addStyleClass("sapUiTinyMarginTop")
                            ]
                        }).addStyleClass("sapUiSmallMarginTop sapUiSmallMarginBottom"),
                        new VBox({
                            items: [
                                new ObjectStatus({
                                    text: "{handoffSummary>/reviewStateText}",
                                    state: "{handoffSummary>/reviewStateState}"
                                }),
                                new Text({
                                    text: "{handoffSummary>/reviewedByText}",
                                    wrapping: true
                                })
                            ]
                        }).addStyleClass("sapUiSmallMarginBottom"),
                        section(getText(view, "handoffSummarySummaryLabel"), "{handoffSummary>/summary}"),
                        new VBox({
                            items: [
                                new HBox({
                                    wrap: "Wrap",
                                    items: [
                                        new VBox({
                                            items: [
                                                new Label({ text: getText(view, "handoffSummaryStatusLabel"), design: "Bold" }),
                                                new ObjectStatus({
                                                    text: "{handoffSummary>/currentStatus}",
                                                    state: "Information"
                                                }).addStyleClass("sapUiTinyMarginTop")
                                            ]
                                        }).addStyleClass("sapUiSmallMarginEnd"),
                                        new VBox({
                                            items: [
                                                new Label({ text: getText(view, "handoffSummaryOwnerLabel"), design: "Bold" }),
                                                new Text({
                                                    text: "{handoffSummary>/currentActionOwner}",
                                                    wrapping: true
                                                }).addStyleClass("sapUiTinyMarginTop")
                                            ]
                                        })
                                    ]
                                })
                            ]
                        }).addStyleClass("sapUiSmallMarginBottom"),
                        section(getText(view, "handoffSummaryMissingLabel"), "{handoffSummary>/missingInformation}"),
                        listSection(getText(view, "handoffSummaryCommentsLabel"), "handoffSummary>/commentItems"),
                        listSection(getText(view, "handoffSummaryEventsLabel"), "handoffSummary>/eventItems"),
                        new Label({
                            text: getText(view, "handoffSummaryNextActionLabel"),
                            design: "Bold"
                        }),
                        new MessageStrip({
                            text: "{handoffSummary>/nextExpectedAction}",
                            type: "Information",
                            showIcon: true
                        }).addStyleClass("sapUiTinyMarginTop sapUiSmallMarginBottom"),
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
            buttons: [
                new Button({
                    text: getText(view, "aiSuggestionAcceptButton"),
                    type: "Accept",
                    enabled: "{handoffSummary>/reviewActionEnabled}",
                    press: function () {
                        return submitReview("acceptAiSuggestion");
                    }
                }),
                new Button({
                    text: getText(view, "aiSuggestionRejectButton"),
                    type: "Reject",
                    enabled: "{handoffSummary>/reviewActionEnabled}",
                    press: function () {
                        return submitReview("rejectAiSuggestion");
                    }
                }),
                new Button({
                    text: getText(view, "aiSuggestionIgnoreButton"),
                    enabled: "{handoffSummary>/reviewActionEnabled}",
                    press: function () {
                        return submitReview("ignoreAiSuggestion");
                    }
                }),
                new Button({
                    text: getText(view, "handoffSummaryCloseButton"),
                    press: function () {
                        dialog.close();
                    }
                })
            ],
            afterClose: function () {
                dialog.destroy();
            }
        });

        dialog.setModel(state, "handoffSummary");
        view.addDependent(dialog);

        readHandoffSummary(model, bugID)
            .then(function (result) {
                var summary = enrichSummary(result, view);
                state.setData(Object.assign(state.getData(), summary));
                state.setProperty("/reviewActionEnabled", Boolean(summary.suggestionID));
                state.setProperty(
                    "/reviewStateText",
                    summary.suggestionID
                        ? getText(view, "aiSuggestionReviewPending")
                        : getText(view, "aiSuggestionReviewUnavailable")
                );
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
