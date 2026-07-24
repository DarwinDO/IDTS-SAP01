/**
 * Gợi ý học/debug: dialog là review-only; trace từ openDialog → OData action → enrichSuggestion → JSONModel.
 * Classification suggestion review dialog for the Bugs Object Page.
 *
 * The backend validates suggestions against IDTS catalogs. This UI only
 * displays review rows and never applies classification values automatically.
 */
/* global Promise */
sap.ui.define([
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/Text",
    "sap/m/ColumnListItem",
    "sap/m/ObjectStatus",
    "sap/m/MessageStrip",
    "sap/m/VBox",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "../ai/AiReviewUi",
    "../ai/AiSuggestionReview"
], function (
    Dialog,
    Button,
    Table,
    Column,
    Text,
    ColumnListItem,
    ObjectStatus,
    MessageStrip,
    VBox,
    MessageBox,
    JSONModel,
    AiReviewUi,
    AiSuggestionReview
) {
    "use strict";

    var REQUEST_PROPERTIES = [
        "ID",
        "IsActiveEntity",
        "HasActiveEntity",
        "title",
        "description",
        "stepsToReproduce",
        "actualResult",
        "expectedResult",
        "sapModule_ID",
        "applicationComponent_ID",
        "defectCategory_ID",
        "priority_code",
        "severity_code"
    ];

    var CURRENT_TEXT_PATHS = {
        sapModule: "sapModule/name",
        applicationComponent: "applicationComponent/name",
        defectCategory: "defectCategory/name",
        priority: "priority/name",
        severity: "severity/name"
    };

    function isBugContext(context) {
        // Chỉ nhận binding context gốc /Bugs(...), tránh lấy nhầm context của table/association con.
        return !!context && typeof context.getPath === "function" && /^\/Bugs\([^/]+\)$/.test(context.getPath());
    }

    function findBugContext(control) {
        // Nút trong XML fragment đi ngược cây control để tìm Bug đang mở.
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
        // Tìm View/Object Page có model và addDependent để dialog theo đúng lifecycle UI5.
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
        throw new Error("Classification review host control is not available.");
    }

    function getText(view, key, args) {
        // Đọc i18n; fallback key giúp debug khi bundle/binding thiếu mà không làm crash dialog.
        var model = view.getModel("i18n") || view.getModel("@i18n");
        var bundle = model && model.getResourceBundle && model.getResourceBundle();
        return bundle && bundle.getText ? bundle.getText(key, args) : key;
    }

    function getAiText(view) {
        return function (key, args) {
            return getText(view, key, args);
        };
    }

    function normalizeResult(result) {
        // CAP action có thể trả object trực tiếp hoặc bọc trong value; chuẩn hóa trước khi render.
        if (Array.isArray(result)) {
            return result;
        }
        if (result && Array.isArray(result.value)) {
            return result.value;
        }
        if (result && result.value && Array.isArray(result.value.value)) {
            return result.value.value;
        }
        return [];
    }

    function requestProperty(bugContext, bug, propertyName) {
        // Chỉ request field còn thiếu trên context để không tải lại toàn Bug.
        if (bug[propertyName] !== undefined || typeof bugContext.requestProperty !== "function") {
            return Promise.resolve();
        }
        return bugContext.requestProperty(propertyName).then(function (value) {
            bug[propertyName] = value;
        });
    }

    function requestTextPath(bugContext, currentValues, field, propertyPath) {
        // Đọc label association hiện tại, dùng để so suggestion với giá trị đang lưu.
        if (typeof bugContext.requestProperty !== "function") {
            return Promise.resolve();
        }
        return bugContext.requestProperty(propertyPath).then(function (value) {
            currentValues[field] = value;
        }).catch(function () {
            currentValues[field] = null;
        });
    }

    function readBugData(bugContext) {
        // Gom input cần thiết cho backend AI action. Không ghi PATCH hoặc thay classification tại đây.
        return bugContext.requestObject().then(function (bug) {
            var result = bug || {};
            var currentValues = {};
            var propertyRequests = REQUEST_PROPERTIES.map(function (propertyName) {
                return requestProperty(bugContext, result, propertyName);
            });
            var textRequests = Object.keys(CURRENT_TEXT_PATHS).map(function (field) {
                return requestTextPath(bugContext, currentValues, field, CURRENT_TEXT_PATHS[field]);
            });

            return Promise.all(propertyRequests.concat(textRequests)).then(function () {
                result.currentValues = currentValues;
                return result;
            });
        });
    }

    function readClassificationSuggestions(model, bug) {
        // Gọi CAP action suggestBugClassification qua OData V4; breakpoint Network/action ở đây.
        var operation = model.bindContext("/suggestClassification(...)", undefined, { $$ownRequest: true });
        var hasPersistedSource = bug.IsActiveEntity === true || bug.HasActiveEntity === true;

        operation.setParameter("sourceBugID", hasPersistedSource ? bug.ID : null);
        operation.setParameter("title", bug.title || null);
        operation.setParameter("description", bug.description || null);
        operation.setParameter("stepsToReproduce", bug.stepsToReproduce || null);
        operation.setParameter("actualResult", bug.actualResult || null);
        operation.setParameter("expectedResult", bug.expectedResult || null);
        operation.setParameter("sapModuleID", bug.sapModule_ID || null);
        operation.setParameter("applicationComponentID", bug.applicationComponent_ID || null);
        operation.setParameter("defectCategoryID", bug.defectCategory_ID || null);
        operation.setParameter("priorityCode", bug.priority_code || null);
        operation.setParameter("severityCode", bug.severity_code || null);

        return operation.invoke("$direct").then(function () {
            var resultContext = operation.getBoundContext && operation.getBoundContext();
            if (resultContext && typeof resultContext.requestObject === "function") {
                return resultContext.requestObject();
            }
            return [];
        }).then(normalizeResult);
    }

    function statusText(row, view) {
        // Chuyển provider status/confidence thành lời giải thích review-facing.
        var status = String(row.status || "").toUpperCase();
        if (status === "SUGGESTED") {
            return getText(view, "classificationReviewStatusSuggested");
        }
        if (status === "LOW_CONFIDENCE") {
            return getText(view, "classificationReviewStatusLowConfidence");
        }
        if (status === "INVALID_PROVIDER_VALUE") {
            return getText(view, "classificationReviewStatusInvalid");
        }
        if (status === "NO_SUGGESTION") {
            return getText(view, "classificationReviewStatusNoSuggestion");
        }
        if (
            status === "AI_DISABLED" ||
            status === "AI_TIMEOUT" ||
            status === "AI_PROVIDER_ERROR" ||
            status === "AI_OUTPUT_UNSAFE" ||
            status === "AI_PROVIDER_UNSUPPORTED"
        ) {
            return getText(view, "classificationReviewStatusUnavailable");
        }
        return getText(view, "classificationReviewStatusReview");
    }

    function stateFor(row) {
        // Chọn semantic state, không quyết định suggestion đúng/sai thay người dùng.
        var status = String(row.status || "").toUpperCase();
        if (status === "SUGGESTED") {
            return "Information";
        }
        if (status === "NO_SUGGESTION") {
            return "None";
        }
        return "Warning";
    }

    function fallbackCurrentValue(bug, field, view) {
        // Khi association label chưa có, dùng code/ID hoặc text fallback an toàn.
        if (field === "priority") {
            return bug.priority_code || getText(view, "classificationReviewNotSet");
        }
        if (field === "severity") {
            return bug.severity_code || getText(view, "classificationReviewNotSet");
        }
        return getText(view, "classificationReviewNotSet");
    }

    function enrichSuggestion(row, bug, view) {
        // Ghép kết quả backend với giá trị hiện tại thành một row dialog; không mutate Bug context.
        var review = AiReviewUi.decorateResult({
            explanation: row.reason,
            confidence: row.confidence,
            providerStatus: row.status
        }, getAiText(view));
        var current = bug.currentValues && bug.currentValues[row.field];
        var suggested = row.valueName || row.valueCode;
        var confidence = Number(row.confidence);

        return {
            fieldLabel: row.fieldLabel || getText(view, "classificationReviewUnknownField"),
            currentValue: current || fallbackCurrentValue(bug, row.field, view),
            suggestedValue: suggested || getText(view, "classificationReviewNoSafeSuggestion"),
            statusText: statusText(row, view),
            statusState: stateFor(row),
            confidenceText: Number.isFinite(confidence)
                ? getText(view, "classificationReviewConfidence", [Math.round(confidence * 100)])
                : "",
            reason: review.explanation,
            decisionHint: review.decisionHint
        };
    }

    function buildDialog(view, model, bug) {
        // Tạo JSONModel + Table, invoke action, rồi cập nhật rows. Lỗi chỉ hiện MessageBox.
        var state = new JSONModel({
            rows: [],
            busy: true,
            noDataText: getText(view, "classificationReviewNoRows"),
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

        var table = new Table({
            growing: true,
            growingThreshold: 5,
            noDataText: "{classificationReview>/noDataText}",
            columns: [
                new Column({
                    width: "11rem",
                    header: new Text({ text: getText(view, "classificationReviewFieldColumn") })
                }),
                new Column({
                    width: "12rem",
                    minScreenWidth: "Tablet",
                    demandPopin: true,
                    header: new Text({ text: getText(view, "classificationReviewCurrentColumn") })
                }),
                new Column({
                    width: "12rem",
                    minScreenWidth: "Tablet",
                    demandPopin: true,
                    header: new Text({ text: getText(view, "classificationReviewSuggestedColumn") })
                }),
                new Column({
                    width: "24rem",
                    minScreenWidth: "Desktop",
                    demandPopin: true,
                    header: new Text({ text: getText(view, "classificationReviewReviewColumn") })
                })
            ]
        });

        table.setModel(state, "classificationReview");
        table.bindItems({
            path: "classificationReview>/rows",
            template: new ColumnListItem({
                cells: [
                    new Text({ text: "{classificationReview>fieldLabel}", wrapping: true }),
                    new Text({ text: "{classificationReview>currentValue}", wrapping: true }),
                    new Text({ text: "{classificationReview>suggestedValue}", wrapping: true }),
                    new VBox({
                        items: [
                            new ObjectStatus({
                                text: "{classificationReview>statusText}",
                                state: "{classificationReview>statusState}"
                            }),
                            new Text({ text: "{classificationReview>confidenceText}", wrapping: true }),
                            new Text({ text: "{classificationReview>reason}", wrapping: true }),
                            new Text({ text: "{classificationReview>decisionHint}", wrapping: true })
                        ]
                    })
                ]
            })
        });

        var dialog = new Dialog({
            title: getText(view, "classificationReviewDialogTitle"),
            contentWidth: "62rem",
            contentHeight: "32rem",
            resizable: true,
            draggable: true,
            busy: "{classificationReview>/busy}",
            content: [
                new VBox({
                    width: "100%",
                    items: [
                        new MessageStrip({
                            text: getText(view, "classificationReviewIntroMessage"),
                            type: "Information",
                            showIcon: true
                        }),
                        new VBox({
                            items: [
                                new ObjectStatus({
                                    text: "{classificationReview>/reviewStateText}",
                                    state: "{classificationReview>/reviewStateState}"
                                }),
                                new Text({
                                    text: "{classificationReview>/reviewedByText}",
                                    wrapping: true
                                })
                            ]
                        }).addStyleClass("sapUiSmallMarginTopBottom"),
                        table
                    ]
                }).addStyleClass("sapUiSmallMargin")
            ],
            buttons: [
                new Button({
                    text: getText(view, "aiSuggestionAcceptButton"),
                    type: "Accept",
                    enabled: "{classificationReview>/reviewActionEnabled}",
                    press: function () {
                        return submitReview("acceptAiSuggestion");
                    }
                }),
                new Button({
                    text: getText(view, "aiSuggestionRejectButton"),
                    type: "Reject",
                    enabled: "{classificationReview>/reviewActionEnabled}",
                    press: function () {
                        return submitReview("rejectAiSuggestion");
                    }
                }),
                new Button({
                    text: getText(view, "aiSuggestionIgnoreButton"),
                    enabled: "{classificationReview>/reviewActionEnabled}",
                    press: function () {
                        return submitReview("ignoreAiSuggestion");
                    }
                }),
                new Button({
                    text: getText(view, "classificationReviewCloseButton"),
                    press: function () {
                        dialog.close();
                    }
                })
            ],
            afterClose: function () {
                dialog.destroy();
            }
        });

        dialog.setModel(state, "classificationReview");
        view.addDependent(dialog);

        readClassificationSuggestions(model, bug)
            .then(function (rows) {
                state.setProperty("/rows", rows.map(function (row) {
                    return enrichSuggestion(row, bug, view);
                }));
                var suggestionID = rows[0] && rows[0].suggestionID;
                state.setProperty("/suggestionID", suggestionID || null);
                state.setProperty("/reviewActionEnabled", Boolean(suggestionID));
                state.setProperty(
                    "/reviewStateText",
                    suggestionID
                        ? getText(view, "aiSuggestionReviewPending")
                        : getText(view, "aiSuggestionReviewAfterSave")
                );
            })
            .catch(function () {
                MessageBox.error(getText(view, "classificationReviewLoadFailed"));
            })
            .finally(function () {
                state.setProperty("/busy", false);
            });

        return dialog;
    }

    return {
        openDialog: function (event) {
            // XML fragment gọi entry point này. Thứ tự debug: source → bugContext → readBugData → buildDialog.
            var source = event.getSource();
            var view = findHost(source);
            var bugContext = findBugContext(source);
            if (!bugContext) {
                MessageBox.error(getText(view, "classificationReviewLoadFailed"));
                return Promise.resolve(null);
            }

            return readBugData(bugContext).then(function (bug) {
                var dialog = buildDialog(view, bugContext.getModel(), bug);
                dialog.open();
                return dialog;
            });
        }
    };
});
