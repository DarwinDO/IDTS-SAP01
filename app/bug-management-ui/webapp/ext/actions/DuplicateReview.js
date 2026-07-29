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
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/Text",
    "sap/m/ColumnListItem",
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
    Table,
    Column,
    Text,
    ColumnListItem,
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
            reviewState: review.state,
            decisionHint: review.decisionHint
        };
    }

    function requestMissingBugProperties(bugContext, bug) {
        // Bổ sung title/description/context còn thiếu, không request toàn entity nếu đã có.
        if (!bugContext || typeof bugContext.requestProperty !== "function") {
            return Promise.resolve(bug);
        }

        var properties = [
            "ID",
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
        operation.setParameter("sourceBugID", bug.ID || null);
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
            duplicateConfirmed: false
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

        var table = new Table({
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
            },
            columns: [
                new Column({
                    width: "14rem",
                    header: new Text({ text: getText(view, "duplicateReviewBugColumn") })
                }),
                new Column({
                    width: "10rem",
                    minScreenWidth: "Tablet",
                    demandPopin: true,
                    header: new Text({ text: getText(view, "duplicateReviewStatusColumn") })
                }),
                new Column({
                    width: "8rem",
                    minScreenWidth: "Tablet",
                    demandPopin: true,
                    header: new Text({ text: getText(view, "duplicateReviewMatchColumn") })
                }),
                new Column({
                    width: "20rem",
                    minScreenWidth: "Desktop",
                    demandPopin: true,
                    header: new Text({ text: getText(view, "duplicateReviewReasonColumn") })
                })
            ]
        });

        table.setModel(state, "duplicateReview");
        table.bindItems({
            path: "duplicateReview>/rows",
            template: new ColumnListItem({
                cells: [
                    new ObjectIdentifier({
                        title: "{duplicateReview>bugNumber}",
                        text: "{duplicateReview>title}"
                    }),
                    new Text({ text: "{duplicateReview>statusName}" }),
                    new VBox({
                        items: [
                            new ObjectStatus({
                                text: "{duplicateReview>scoreText}",
                                state: "{duplicateReview>reviewState}"
                            }),
                            new Text({ text: "{duplicateReview>relationType}" })
                        ]
                    }),
                    new VBox({
                        items: [
                            new Text({
                                text: "{duplicateReview>reason}",
                                wrapping: true
                            }),
                            new Text({
                                text: "{duplicateReview>decisionHint}",
                                wrapping: true
                            })
                        ]
                    })
                ]
            })
        });

        var dialog = new Dialog({
            title: getText(view, "duplicateReviewDialogTitle"),
            contentWidth: "54rem",
            contentHeight: "30rem",
            resizable: true,
            draggable: true,
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
                        table
                    ]
                }).addStyleClass("sapUiSmallMargin")
            ],
            buttons: [
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

        readSimilarBugs(model, bug)
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
            .catch(function () {
                MessageBox.error(getText(view, "duplicateReviewLoadFailed"));
            })
            .finally(function () {
                state.setProperty("/busy", false);
                updateConfirmEnabled();
            });

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
                var dialog = buildDialog(view, bugContext.getModel(), bug, bugContext);
                dialog.open();
                return dialog;
            });
        }
    };
});
