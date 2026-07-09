/**
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
    "sap/ui/model/json/JSONModel",
    "../ai/AiReviewUi"
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
    JSONModel,
    AiReviewUi
) {
    "use strict";

    function isBugContext(context) {
        return !!context && typeof context.getPath === "function" && /^\/Bugs\([^/]+\)$/.test(context.getPath());
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

    function findHost(control) {
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

    function normalizeResult(result) {
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

    function buildDialog(view, model, bug) {
        var state = new JSONModel({
            rows: [],
            busy: true,
            noDataText: getText(view, "duplicateReviewNoCandidates")
        });

        var table = new Table({
            growing: true,
            growingThreshold: 5,
            noDataText: "{duplicateReview>/noDataText}",
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
                        table
                    ]
                }).addStyleClass("sapUiSmallMargin")
            ],
            endButton: new Button({
                text: getText(view, "duplicateReviewCloseButton"),
                press: function () {
                    dialog.close();
                }
            }),
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
            })
            .catch(function () {
                MessageBox.error(getText(view, "duplicateReviewLoadFailed"));
            })
            .finally(function () {
                state.setProperty("/busy", false);
            });

        return dialog;
    }

    return {
        openDialog: function (event) {
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
                var dialog = buildDialog(view, bugContext.getModel(), bug);
                dialog.open();
                return dialog;
            });
        }
    };
});
