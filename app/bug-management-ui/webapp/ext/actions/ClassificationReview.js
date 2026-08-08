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
    "sap/m/ExpandableText",
    "sap/m/MessageStrip",
    "sap/m/VBox",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "../ai/AiReviewUi",
    "../ai/AiSuggestionReview",
    "../login/LoginController"
], function (
    Dialog,
    Button,
    Table,
    Column,
    Text,
    ColumnListItem,
    ObjectStatus,
    ExpandableText,
    MessageStrip,
    VBox,
    MessageBox,
    MessageToast,
    JSONModel,
    AiReviewUi,
    AiSuggestionReview,
    LoginSession
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

    function isPmOrTester() {
        // Chỉ quyết định visibility trên UI; CAP vẫn là lớp phân quyền cuối cho action Apply.
        var user = LoginSession.getUser && LoginSession.getUser();
        return !!user && (user.role_code === "PM" || user.role_code === "TESTER");
    }

    function hasPersistedBugSource(bug) {
        // AI review is source-linked. A root create draft has no stable active Bug row to audit yet.
        return !!bug && (bug.IsActiveEntity === true || bug.HasActiveEntity === true);
    }

    function refreshBugContext(bugContext, model) {
        // Sau Apply, đọc lại Bug từ backend để UI không tự đoán field nào đã thay đổi.
        if (bugContext && typeof bugContext.requestRefresh === "function") {
            return bugContext.requestRefresh();
        }
        if (model && typeof model.refresh === "function") {
            model.refresh();
        }
        return Promise.resolve();
    }

    function applyClassification(model, suggestionID) {
        // Gọi action đã có; backend kiểm role, review state, expiry, catalog và stale source.
        var operation = model.bindContext("/applyClassificationSuggestion(...)", undefined, { $$ownRequest: true });
        operation.setParameter("suggestionID", suggestionID);
        return operation.invoke("$direct");
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

    function requestOperationResult(operation, invocationResult) {
        // Some UI5/CAP combinations expose the action result directly, others expose it through the result context.
        if (normalizeResult(invocationResult).length > 0) {
            return Promise.resolve(invocationResult);
        }
        var resultContext = operation.getBoundContext && operation.getBoundContext();
        if (!resultContext || typeof resultContext.requestObject !== "function") {
            return Promise.resolve(invocationResult || []);
        }
        return resultContext.requestObject().catch(function (error) {
            if (invocationResult !== undefined && invocationResult !== null) {
                return invocationResult;
            }
            throw error;
        });
    }

    function errorStatus(error) {
        var status = error && (
            error.status ||
            error.statusCode ||
            error.httpStatus ||
            error.cause && (error.cause.status || error.cause.statusCode)
        );
        return Number(status) || 0;
    }

    function errorMessage(error) {
        return String(error && error.message || "");
    }

    function isMissingContextError(error) {
        return errorStatus(error) === 400 &&
            errorMessage(error).indexOf(
                "Provide a bug title, description, reproduction context, or source bug"
            ) >= 0;
    }

    function isResponsibilityMismatchError(error) {
        return errorStatus(error) === 400 &&
            errorMessage(error).indexOf(
                "Assigned developer is not responsible for the selected component/category and SAP module scope."
            ) >= 0;
    }

    function isRetryableLoadError(error) {
        var status = errorStatus(error);
        return status === 0 || status === 408 || status === 429 || status >= 500;
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

        return operation.invoke("$direct").then(function (invocationResult) {
            return requestOperationResult(operation, invocationResult);
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
            status === "AI_RATE_LIMITED" ||
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

    function sourcePresentation(row, view) {
        // Fallback là safety net theo rule, không được trình bày như đề xuất do AI sinh ra.
        if (row.suggestionSource === "AI") {
            return {
                text: getText(view, "classificationReviewSourceAi"),
                state: "Information"
            };
        }
        if (row.suggestionSource === "RULES") {
            return {
                text: getText(view, "classificationReviewSourceRules"),
                state: "Warning"
            };
        }
        return {
            text: getText(view, "classificationReviewSourceUnavailable"),
            state: "None"
        };
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
        var source = sourcePresentation(row, view);

        return {
            fieldLabel: row.fieldLabel || getText(view, "classificationReviewUnknownField"),
            currentValue: current || fallbackCurrentValue(bug, row.field, view),
            suggestedValue: suggested || getText(view, "classificationReviewNoSafeSuggestion"),
            statusText: statusText(row, view),
            statusState: stateFor(row),
            suggestionSourceText: source.text,
            suggestionSourceState: source.state,
            confidenceText: row.suggestionSource === "AI" && Number.isFinite(confidence)
                ? getText(view, "classificationReviewConfidence", [Math.round(confidence * 100)])
                : "",
            reason: review.explanation
        };
    }

    function buildDialog(view, model, bug, bugContext) {
        // Tạo JSONModel + Table, invoke action, rồi cập nhật rows. Lỗi chỉ hiện MessageBox.
        var state = new JSONModel({
            rows: [],
            busy: true,
            noDataText: getText(view, "classificationReviewNoRows"),
            suggestionID: null,
            reviewStateText: getText(view, "aiSuggestionReviewPending"),
            reviewStateState: "Information",
            reviewedByText: "",
            reviewActionEnabled: false,
            applyActionVisible: isPmOrTester(),
            applyActionEnabled: false,
            loadMessageVisible: false,
            loadMessageText: "",
            loadMessageType: "Information",
            retryVisible: false
        });
        function submitReview(actionName) {
            return AiSuggestionReview.submit(model, state, actionName, function (key, args) {
                return getText(view, key, args);
            }).then(function (result) {
                var reviewStateCode = result && result.reviewStateCode;
                state.setProperty(
                    "/applyActionEnabled",
                    isPmOrTester() && reviewStateCode === "ACCEPTED"
                );
                return result;
            });
        }

        function confirmApply() {
            MessageBox.confirm(getText(view, "classificationApplyConfirm"), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (action) {
                    if (action !== MessageBox.Action.OK || !state.getProperty("/applyActionEnabled")) {
                        return;
                    }

                    state.setProperty("/busy", true);
                    state.setProperty("/applyActionEnabled", false);
                    var applyCompleted = false;
                    applyClassification(model, state.getProperty("/suggestionID"))
                        .then(function () {
                            applyCompleted = true;
                            return refreshBugContext(bugContext, model);
                        })
                        .then(function () {
                            MessageToast.show(getText(view, "classificationApplySuccess"));
                        })
                        .catch(function (error) {
                            if (!applyCompleted) {
                                state.setProperty("/applyActionEnabled", true);
                            }
                            MessageBox.error(getText(
                                view,
                                applyCompleted
                                    ? "classificationRefreshFailed"
                                    : isResponsibilityMismatchError(error)
                                        ? "classificationResponsibilityMismatch"
                                        : "classificationApplyFailed"
                            ));
                        })
                        .finally(function () {
                            state.setProperty("/busy", false);
                        });
                }
            });
        }

        function loadSuggestions() {
            state.setProperty("/busy", true);
            state.setProperty("/rows", []);
            state.setProperty("/suggestionID", null);
            state.setProperty("/reviewActionEnabled", false);
            state.setProperty("/applyActionEnabled", false);
            state.setProperty("/reviewStateText", getText(view, "aiSuggestionReviewPending"));
            state.setProperty("/reviewStateState", "Information");
            state.setProperty("/reviewedByText", "");
            state.setProperty("/loadMessageVisible", false);
            state.setProperty("/retryVisible", false);
            return readClassificationSuggestions(model, bug)
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
                .catch(function (error) {
                    var missingContext = isMissingContextError(error);
                    var retryable = isRetryableLoadError(error);
                    state.setProperty(
                        "/loadMessageText",
                        getText(
                            view,
                            missingContext
                                ? "classificationReviewMissingContext"
                                : retryable
                                    ? "classificationReviewRetryableLoadFailed"
                                    : "classificationReviewLoadFailed"
                        )
                    );
                    state.setProperty("/loadMessageType", missingContext ? "Information" : "Error");
                    state.setProperty("/loadMessageVisible", true);
                    state.setProperty("/retryVisible", retryable);
                })
                .finally(function () {
                    state.setProperty("/busy", false);
                });
        }

        var table = new Table({
            autoPopinMode: true,
            growing: true,
            growingThreshold: 5,
            noDataText: "{classificationReview>/noDataText}",
            columns: [
                new Column({
                    importance: "High",
                    header: new Text({ text: getText(view, "classificationReviewFieldColumn") })
                }),
                new Column({
                    importance: "Medium",
                    header: new Text({ text: getText(view, "classificationReviewCurrentColumn") })
                }),
                new Column({
                    importance: "High",
                    header: new Text({ text: getText(view, "classificationReviewSuggestedColumn") })
                }),
                new Column({
                    importance: "Low",
                    header: new Text({ text: getText(view, "classificationReviewConfidenceColumn") })
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
                    new VBox({
                        items: [
                            new Text({ text: "{classificationReview>suggestedValue}", wrapping: true }),
                            new ExpandableText({
                                text: "{classificationReview>reason}",
                                maxCharacters: 180,
                                overflowMode: "InPlace"
                            }).addStyleClass("sapUiTinyMarginTop")
                        ]
                    }),
                    new VBox({
                        items: [
                            new ObjectStatus({
                                text: "{classificationReview>suggestionSourceText}",
                                state: "{classificationReview>suggestionSourceState}"
                            }),
                            new ObjectStatus({
                                text: "{classificationReview>statusText}",
                                state: "{classificationReview>statusState}"
                            }),
                            new Text({ text: "{classificationReview>confidenceText}", wrapping: true })
                        ]
                    })
                ]
            })
        });

        var dialog = new Dialog({
            title: getText(view, "classificationReviewDialogTitle"),
            resizable: true,
            draggable: true,
            horizontalScrolling: false,
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
                        new MessageStrip({
                            text: "{classificationReview>/loadMessageText}",
                            type: "{classificationReview>/loadMessageType}",
                            showIcon: true,
                            visible: "{classificationReview>/loadMessageVisible}"
                        }).addStyleClass("sapUiTinyMarginTop"),
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
                    text: getText(view, "classificationApplyButton"),
                    type: "Emphasized",
                    visible: "{classificationReview>/applyActionVisible}",
                    enabled: "{classificationReview>/applyActionEnabled}",
                    press: confirmApply
                }),
                new Button({
                    text: getText(view, "classificationReviewRetryButton"),
                    visible: "{classificationReview>/retryVisible}",
                    press: loadSuggestions
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

        loadSuggestions();

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
                if (!hasPersistedBugSource(bug)) {
                    MessageToast.show(getText(view, "classificationReviewMissingContext"));
                    return null;
                }
                var dialog = buildDialog(view, bugContext.getModel(), bug, bugContext);
                dialog.open();
                return dialog;
            });
        }
    };
});
