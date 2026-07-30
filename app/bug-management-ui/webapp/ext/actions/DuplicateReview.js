/**
 * Gợi ý học/debug: dialog là review-only; trace từ openDialog → findSimilarBugs OData → enrichCandidate → JSONModel.
 * Similar bug review dialog for the Bugs Object Page.
 *
 * The backend action finds candidates; this UI only helps the user review
 * them and does not confirm duplicate links or change workflow state.
 */
/* global Promise */
sap.ui.define([
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/List",
    "sap/m/Text",
    "sap/m/CustomListItem",
    "sap/m/HBox",
    "sap/m/ExpandableText",
    "sap/m/ObjectIdentifier",
    "sap/m/ObjectStatus",
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
    List,
    Text,
    CustomListItem,
    HBox,
    ExpandableText,
    ObjectIdentifier,
    ObjectStatus,
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

    function isBugContext(context) {
        // Chỉ chấp nhận root Bug context, tránh dùng nhầm row context bên trong Object Page.
        return !!context && typeof context.getPath === "function" && /^\/Bugs\([^/]+\)$/.test(context.getPath());
    }

    function findBugContext(control) {
        // Đi ngược cây control từ nút trong Bug Summary đến Bug đang mở.
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
        // Host giữ i18n/model và quản lý destroy dialog bằng addDependent.
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
        throw new Error("Similar bug review host control is not available.");
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

    function isPmOrTester() {
        // UI chỉ ẩn/hiện action; backend vẫn kiểm quyền và candidate một lần nữa.
        var user = LoginSession.getUser && LoginSession.getUser();
        return !!user && (user.role_code === "PM" || user.role_code === "TESTER");
    }

    function hasPersistedBugSource(bug) {
        // Root create drafts have no active Bug row yet, so their transient ID must never be sent as sourceBugID.
        return !!bug && (bug.IsActiveEntity === true || bug.HasActiveEntity === true);
    }

    function refreshBugContext(bugContext, model) {
        // Đọc lại association DuplicateLinks sau khi backend xác nhận thành công.
        if (bugContext && typeof bugContext.requestRefresh === "function") {
            return bugContext.requestRefresh();
        }
        if (model && typeof model.refresh === "function") {
            model.refresh();
        }
        return Promise.resolve();
    }

    function confirmDuplicate(model, suggestionID, candidateBugID) {
        // Chỉ gửi hai ID; CAP tự xác minh suggestion đã Accept và candidate thuộc kết quả đã lưu.
        var operation = model.bindContext("/confirmDuplicateSuggestion(...)", undefined, { $$ownRequest: true });
        operation.setParameter("suggestionID", suggestionID);
        operation.setParameter("candidateBugID", candidateBugID);
        return operation.invoke("$direct");
    }

    function normalizeResult(result) {
        // Chuẩn hóa shape trả về của CAP action trước khi đọc candidates.
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

    function errorStatus(error) {
        var status = error && (
            error.status ||
            error.statusCode ||
            error.httpStatus ||
            error.cause && (error.cause.status || error.cause.statusCode)
        );
        return Number(status) || 0;
    }

    function enrichCandidate(row, view) {
        // Chuyển candidate backend thành row an toàn; explanation/status đi qua AiReviewUi.
        var review = AiReviewUi.decorateResult({
            explanation: row.reason,
            confidence: row.score,
            providerStatus: row.providerStatus
        }, getAiText(view));
        var score = Number(row.score);

        return {
            bugID: row.bugID,
            bugNumber: row.bugNumber || getText(view, "duplicateReviewUnknownBug"),
            title: row.title || getText(view, "duplicateReviewUntitledBug"),
            statusName: row.statusName || row.statusCode || getText(view, "duplicateReviewUnknownStatus"),
            relationType: row.suggestedRelationTypeCode || getText(view, "duplicateReviewRelationSimilar"),
            reason: review.explanation,
            scoreText: Number.isFinite(score)
                ? getText(view, "duplicateReviewScore", [Math.round(score * 100)])
                : review.meta,
            reviewState: review.state
        };
    }

    function requestMissingBugProperties(bugContext, bug) {
        // Bổ sung title/description/context còn thiếu, không request toàn entity nếu đã có.
        if (!bugContext || typeof bugContext.requestProperty !== "function") {
            return Promise.resolve(bug);
        }

        var properties = [
            "ID",
            "IsActiveEntity",
            "HasActiveEntity",
            "title",
            "description",
            "status_code",
            "sapModule_ID",
            "applicationComponent_ID",
            "defectCategory_ID",
            "componentCategory_ID"
        ];

        return Promise.all(properties.map(function (propertyName) {
            if (bug[propertyName] !== undefined) {
                return Promise.resolve();
            }
            return bugContext.requestProperty(propertyName).then(function (value) {
                bug[propertyName] = value;
            });
        })).then(function () {
            return bug;
        });
    }

    function readSimilarBugs(model, bug) {
        // Gọi CAP action findSimilarBugs; action chỉ tìm/gợi ý, không tạo DuplicateLinks.
        // Breakpoint ở đây và Network khi danh sách rỗng/sai.
        var operation = model.bindContext("/suggestSimilarBugs(...)", undefined, { $$ownRequest: true });
        operation.setParameter("sourceBugID", hasPersistedBugSource(bug) ? bug.ID : null);
        operation.setParameter("title", bug.title || null);
        operation.setParameter("description", bug.description || null);
        operation.setParameter("statusCode", bug.status_code || null);
        operation.setParameter("sapModuleID", bug.sapModule_ID || null);
        operation.setParameter("applicationComponentID", bug.applicationComponent_ID || null);
        operation.setParameter("defectCategoryID", bug.defectCategory_ID || null);
        operation.setParameter("componentCategoryID", bug.componentCategory_ID || null);
        operation.setParameter("limit", 5);
        operation.setParameter("minScore", 0.2);

        return operation.invoke("$direct").then(function () {
            var resultContext = operation.getBoundContext && operation.getBoundContext();
            if (resultContext && typeof resultContext.requestObject === "function") {
                return resultContext.requestObject();
            }
            return [];
        }).then(normalizeResult);
    }

    function buildDialog(view, model, bug, bugContext) {
        // Dựng dialog trước ở trạng thái busy, sau đó nạp rows hoặc hiện lỗi thân thiện.
        var state = new JSONModel({
            rows: [],
            busy: true,
            noDataText: getText(view, "duplicateReviewNoCandidates"),
            suggestionID: null,
            reviewStateText: getText(view, "aiSuggestionReviewPending"),
            reviewStateState: "Information",
            reviewedByText: "",
            reviewActionEnabled: false,
            confirmActionVisible: isPmOrTester(),
            confirmActionEnabled: false,
            selectedCandidateBugID: null,
            selectedCandidateBugNumber: "",
            reviewAccepted: false,
            duplicateConfirmed: false,
            loadMessageVisible: false,
            loadMessageText: "",
            loadMessageType: "Information",
            retryVisible: false
        });
        function updateConfirmEnabled() {
            state.setProperty(
                "/confirmActionEnabled",
                isPmOrTester() &&
                    state.getProperty("/reviewAccepted") === true &&
                    Boolean(state.getProperty("/selectedCandidateBugID")) &&
                    state.getProperty("/duplicateConfirmed") !== true &&
                    state.getProperty("/busy") !== true
            );
        }
        function submitReview(actionName) {
            return AiSuggestionReview.submit(model, state, actionName, function (key, args) {
                return getText(view, key, args);
            }).then(function (result) {
                var reviewStateCode = result && result.reviewStateCode;
                state.setProperty("/reviewAccepted", reviewStateCode === "ACCEPTED");
                updateConfirmEnabled();
                return result;
            });
        }

        function confirmSelectedDuplicate() {
            var candidateBugNumber = state.getProperty("/selectedCandidateBugNumber");
            MessageBox.confirm(getText(view, "duplicateConfirmPrompt", [candidateBugNumber]), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (action) {
                    if (action !== MessageBox.Action.OK || !state.getProperty("/confirmActionEnabled")) {
                        return;
                    }

                    state.setProperty("/busy", true);
                    state.setProperty("/confirmActionEnabled", false);
                    confirmDuplicate(
                        model,
                        state.getProperty("/suggestionID"),
                        state.getProperty("/selectedCandidateBugID")
                    )
                        .then(function () {
                            state.setProperty("/duplicateConfirmed", true);
                            return refreshBugContext(bugContext, model);
                        })
                        .then(function () {
                            MessageToast.show(getText(view, "duplicateConfirmSuccess", [candidateBugNumber]));
                        })
                        .catch(function () {
                            MessageBox.error(getText(
                                view,
                                state.getProperty("/duplicateConfirmed")
                                    ? "duplicateRefreshFailed"
                                    : "duplicateConfirmFailed"
                            ));
                        })
                        .finally(function () {
                            state.setProperty("/busy", false);
                            updateConfirmEnabled();
                        });
                }
            });
        }

        var list = new List({
            mode: "SingleSelectMaster",
            growing: true,
            growingThreshold: 5,
            noDataText: "{duplicateReview>/noDataText}",
            selectionChange: function (event) {
                var item = event.getParameter("listItem");
                var context = item && item.getBindingContext("duplicateReview");
                var candidate = context && context.getObject();
                state.setProperty("/selectedCandidateBugID", candidate && candidate.bugID || null);
                state.setProperty("/selectedCandidateBugNumber", candidate && candidate.bugNumber || "");
                updateConfirmEnabled();
            }
        });

        list.setModel(state, "duplicateReview");
        list.bindItems({
            path: "duplicateReview>/rows",
            template: new CustomListItem({
                content: [
                    new VBox({
                        width: "100%",
                        items: [
                            new ObjectIdentifier({
                                title: "{duplicateReview>bugNumber}",
                                text: "{duplicateReview>title}"
                            }),
                            new HBox({
                                wrap: "Wrap",
                                items: [
                                    new ObjectStatus({
                                        text: "{duplicateReview>scoreText}",
                                        state: "{duplicateReview>reviewState}"
                                    }).addStyleClass("sapUiTinyMarginEnd"),
                                    new ObjectStatus({
                                        text: "{duplicateReview>statusName}",
                                        state: "None"
                                    }).addStyleClass("sapUiTinyMarginEnd"),
                                    new ObjectStatus({
                                        text: "{duplicateReview>relationType}",
                                        state: "Information"
                                    })
                                ]
                            }).addStyleClass("sapUiTinyMarginTop"),
                            new ExpandableText({
                                text: "{duplicateReview>reason}",
                                maxCharacters: 220,
                                overflowMode: "InPlace"
                            }).addStyleClass("sapUiTinyMarginTop")
                        ]
                    })
                ]
            })
        });

        function loadCandidates() {
            state.setProperty("/busy", true);
            state.setProperty("/rows", []);
            state.setProperty("/suggestionID", null);
            state.setProperty("/reviewActionEnabled", false);
            state.setProperty("/reviewAccepted", false);
            state.setProperty("/duplicateConfirmed", false);
            state.setProperty("/selectedCandidateBugID", null);
            state.setProperty("/selectedCandidateBugNumber", "");
            state.setProperty("/reviewStateText", getText(view, "aiSuggestionReviewPending"));
            state.setProperty("/reviewStateState", "Information");
            state.setProperty("/reviewedByText", "");
            state.setProperty("/loadMessageVisible", false);
            state.setProperty("/retryVisible", false);
            list.removeSelections(true);
            return readSimilarBugs(model, bug)
                .then(function (rows) {
                    state.setProperty("/rows", rows.map(function (row) {
                        return enrichCandidate(row, view);
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
                    var status = errorStatus(error);
                    var unauthorized = status === 401 || status === 403;
                    var invalidContext = status === 400;
                    var retryable = status === 0 || status === 408 || status === 429 || status >= 500;
                    var messageKey = "duplicateReviewLoadFailed";
                    var messageType = "Error";
                    if (unauthorized) {
                        messageKey = "duplicateReviewUnauthorized";
                    } else if (invalidContext) {
                        messageKey = "duplicateReviewInvalidContext";
                        messageType = "Information";
                    } else if (retryable) {
                        messageKey = "duplicateReviewRetryableLoadFailed";
                        messageType = "Warning";
                    }
                    state.setProperty("/loadMessageText", getText(view, messageKey));
                    state.setProperty("/loadMessageType", messageType);
                    state.setProperty("/loadMessageVisible", true);
                    state.setProperty("/retryVisible", retryable);
                })
                .finally(function () {
                    state.setProperty("/busy", false);
                    updateConfirmEnabled();
                });
        }

        var dialog = new Dialog({
            title: getText(view, "duplicateReviewDialogTitle"),
            resizable: true,
            draggable: true,
            horizontalScrolling: false,
            busy: "{duplicateReview>/busy}",
            content: [
                new VBox({
                    width: "100%",
                    items: [
                        new MessageStrip({
                            text: getText(view, "duplicateReviewIntroMessage"),
                            type: "Information",
                            showIcon: true
                        }),
                        new MessageStrip({
                            text: "{duplicateReview>/loadMessageText}",
                            type: "{duplicateReview>/loadMessageType}",
                            showIcon: true,
                            visible: "{duplicateReview>/loadMessageVisible}"
                        }).addStyleClass("sapUiTinyMarginTop"),
                        new VBox({
                            items: [
                                new ObjectStatus({
                                    text: "{duplicateReview>/reviewStateText}",
                                    state: "{duplicateReview>/reviewStateState}"
                                }),
                                new Text({
                                    text: "{duplicateReview>/reviewedByText}",
                                    wrapping: true
                                })
                            ]
                        }).addStyleClass("sapUiSmallMarginTopBottom"),
                        list
                    ]
                }).addStyleClass("sapUiSmallMargin")
            ],
            buttons: [
                new Button({
                    text: getText(view, "duplicateReviewRetryButton"),
                    visible: "{duplicateReview>/retryVisible}",
                    press: loadCandidates
                }),
                new Button({
                    text: getText(view, "aiSuggestionAcceptButton"),
                    type: "Accept",
                    enabled: "{duplicateReview>/reviewActionEnabled}",
                    press: function () {
                        return submitReview("acceptAiSuggestion");
                    }
                }),
                new Button({
                    text: getText(view, "aiSuggestionRejectButton"),
                    type: "Reject",
                    enabled: "{duplicateReview>/reviewActionEnabled}",
                    press: function () {
                        return submitReview("rejectAiSuggestion");
                    }
                }),
                new Button({
                    text: getText(view, "aiSuggestionIgnoreButton"),
                    enabled: "{duplicateReview>/reviewActionEnabled}",
                    press: function () {
                        return submitReview("ignoreAiSuggestion");
                    }
                }),
                new Button({
                    text: getText(view, "duplicateConfirmButton"),
                    type: "Emphasized",
                    visible: "{duplicateReview>/confirmActionVisible}",
                    enabled: "{duplicateReview>/confirmActionEnabled}",
                    press: confirmSelectedDuplicate
                }),
                new Button({
                    text: getText(view, "duplicateReviewCloseButton"),
                    press: function () {
                        dialog.close();
                    }
                })
            ],
            afterClose: function () {
                dialog.destroy();
            }
        });

        dialog.setModel(state, "duplicateReview");
        view.addDependent(dialog);

        loadCandidates();

        return dialog;
    }

    return {
        openDialog: function (event) {
            // XML fragment gọi: tìm Bug → request data → build/open dialog. Không có Bug thì dừng an toàn.
            var source = event.getSource();
            var view = findHost(source);
            var bugContext = findBugContext(source);
            if (!bugContext) {
                MessageBox.error(getText(view, "duplicateReviewLoadFailed"));
                return Promise.resolve(null);
            }

            return bugContext.requestObject().then(function (bug) {
                return requestMissingBugProperties(bugContext, bug || {});
            }).then(function (bug) {
                if (!hasPersistedBugSource(bug)) {
                    MessageToast.show(getText(view, "duplicateReviewAfterSave"));
                    return null;
                }
                var dialog = buildDialog(view, bugContext.getModel(), bug, bugContext);
                dialog.open();
                return dialog;
            });
        }
    };
});
