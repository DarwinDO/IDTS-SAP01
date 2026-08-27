/**
 * Gợi ý học/debug: dialog giúp so sánh developer, còn người dùng phải chọn rõ ràng và backend là nơi xác nhận assignee cuối cùng.
 * Smart developer assignment dialog for the Bugs Object Page.
 *
 * The dialog improves candidate discovery, while CAP remains the final
 * authority for role, responsibility, and availability validation.
 */
/* global Promise, setTimeout */
/* eslint-disable max-params */
sap.ui.define([
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/SearchField",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/Text",
    "sap/m/ColumnListItem",
    "sap/m/ObjectIdentifier",
    "sap/m/ObjectStatus",
    "sap/m/MessageStrip",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Toolbar",
    "sap/m/ToolbarSpacer",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "../login/LoginController",
    "../ai/AiReviewUi",
    "../ai/AiSuggestionReview"
], function (
    Dialog,
    Button,
    SearchField,
    Table,
    Column,
    Text,
    ColumnListItem,
    ObjectIdentifier,
    ObjectStatus,
    MessageStrip,
    VBox,
    HBox,
    Toolbar,
    ToolbarSpacer,
    MessageToast,
    MessageBox,
    JSONModel,
    Filter,
    FilterOperator,
    LoginSession,
    AiReviewUi,
    AiSuggestionReview
) {
    "use strict";

    var MAX_CANDIDATES = 100;

    function canUseAssignmentUi() {
        // Safe profile chỉ quyết định UX; CAP action vẫn kiểm Tester/PM và candidate hợp lệ.
        var user = LoginSession.getUser();
        return Boolean(user && (user.role_code === "TESTER" || user.role_code === "PM"));
    }

    function getView(actionContext) {
        if (actionContext && typeof actionContext.getView === "function") {
            return actionContext.getView();
        }

        // In the current Fiori Elements runtime, manifest-based Object Page
        // header actions receive an ExtensionAPI-like object with `_view`,
        // not a controller with getView(). Keep this fallback isolated and
        // covered by browser smoke; the dialog still uses public UI5 controls
        // and backend validation remains the assignment authority.
        if (actionContext && actionContext._view) {
            return actionContext._view;
        }

        throw new Error("Fiori Elements view is not available for smart assignment.");
    }

    function getBindingContext(actionContext, bindingContext) {
        if (bindingContext && typeof bindingContext.requestObject === "function") {
            return bindingContext;
        }

        var view = getView(actionContext);
        var context = view.getBindingContext && view.getBindingContext();
        if (context && typeof context.requestObject === "function") {
            return context;
        }

        throw new Error("Bug binding context is not available for smart assignment.");
    }

    function isBugContext(context) {
        return !!context && typeof context.getPath === "function" && /^\/Bugs\([^/]+\)$/.test(context.getPath());
    }

    function findBugContext(control) {
        // Nút/value-help đi ngược cây control để lấy root Bug draft/active context.
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
        throw new Error("Smart assignment host control is not available.");
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

    function availabilityState(criticality) {
        if (criticality === 3) {
            return "Success";
        }
        if (criticality === 2) {
            return "Warning";
        }
        if (criticality === 1) {
            return "Error";
        }
        return "None";
    }

    function normalize(value) {
        return String(value || "").trim().toLowerCase();
    }

    function containsAny(haystack, terms) {
        return terms.some(function (term) {
            return haystack.indexOf(term) >= 0;
        });
    }

    function enrichCandidate(row, view) {
        // Chuẩn hóa workload, availability, capability và warning thành row dễ so sánh.
        var availability = row.availabilityStatusName || getText(view, "smartAssignAvailabilityUnknown");
        var criticality = Number(row.availabilityCriticality);
        var normalizedAvailability = normalize(availability);
        var isUnavailable = criticality === 1 || containsAny(normalizedAvailability, ["unavailable", "on leave"]);
        var isBusy = criticality === 2 || containsAny(normalizedAvailability, ["busy", "limited"]);
        var moduleText = row.sapModuleName || getText(view, "smartAssignAnySapModule");
        var roleText = row.responsibilityLevelName || getText(view, "smartAssignResponsibilityUnspecified");
        var warningText = "";

        if (isUnavailable) {
            warningText = getText(view, "smartAssignUnavailableWarning", [availability]);
        } else if (isBusy) {
            warningText = getText(view, "smartAssignBusyWarning", [availability]);
        }

        var aiReview = AiReviewUi.loading(getAiText(view));

        return {
            ID: row.ID,
            developerProfileID: row.developerProfileID || row.ID,
            developerName: row.developerName || getText(view, "smartAssignUnnamedDeveloper"),
            developerEmail: row.developerEmail || "",
            availabilityStatusName: availability,
            availabilityCriticality: criticality,
            availabilityState: availabilityState(criticality),
            applicationComponentName: row.applicationComponentName || getText(view, "smartAssignComponentUnspecified"),
            defectCategoryName: row.defectCategoryName || getText(view, "smartAssignCategoryUnspecified"),
            sapModuleName: moduleText,
            responsibilityLevelName: roleText,
            capabilityText: getText(view, "smartAssignCapabilityText", [
                row.applicationComponentName || getText(view, "smartAssignComponentUnspecified"),
                row.defectCategoryName || getText(view, "smartAssignCategoryUnspecified")
            ]),
            moduleText: getText(view, "smartAssignModuleText", [moduleText, roleText]),
            isUnavailable: isUnavailable,
            isBusy: isBusy,
            warningText: warningText,
            aiExplanation: aiReview.explanation,
            aiExplanationMeta: aiReview.meta,
            aiExplanationState: aiReview.state,
            aiWarnings: aiReview.warnings,
            hasAiWarnings: aiReview.hasWarnings,
            aiDecisionHint: aiReview.decisionHint
        };
    }

    function candidateMatches(candidate, query) {
        // Search theo tên/module/capability phía client; không thay danh sách candidate backend trả về.
        if (!query) {
            return true;
        }

        var haystack = [
            candidate.developerName,
            candidate.developerEmail,
            candidate.availabilityStatusName,
            candidate.applicationComponentName,
            candidate.defectCategoryName,
            candidate.sapModuleName,
            candidate.responsibilityLevelName
        ].join(" ").toLowerCase();

        return query.split(/\s+/).every(function (term) {
            return haystack.indexOf(term) >= 0;
        });
    }

    function applySearch(state) {
        refreshVisibleCandidates(state);
        state.setProperty("/selectedCandidate", null);
        state.setProperty("/selectedCandidateId", "");
        state.setProperty("/selectedWarningText", "");
        state.setProperty("/assignEnabled", false);
    }

    function refreshVisibleCandidates(state) {
        var query = normalize(state.getProperty("/searchQuery"));
        var candidates = state.getProperty("/candidates") || [];
        state.setProperty("/visibleCandidates", candidates.filter(function (candidate) {
            return candidateMatches(candidate, query);
        }));
    }

    function updateSelection(state, candidate) {
        // Chỉ đánh dấu row được chọn trong dialog; chưa ghi assignee vào Bug.
        state.setProperty("/selectedCandidate", candidate || null);
        state.setProperty("/selectedCandidateId", candidate ? candidate.developerProfileID : "");
        state.setProperty("/selectedWarningText", candidate ? candidate.warningText : "");
        state.setProperty("/assignEnabled", Boolean(candidate && !candidate.isUnavailable));
    }

    function readCandidates(model, bug, view) {
        // GET AssignableDevelopers theo classification của Bug; candidate source vẫn thuộc backend read model.
        var filters = [
            new Filter("active", FilterOperator.EQ, true),
            new Filter("componentCategoryID", FilterOperator.EQ, bug.componentCategory_ID)
        ];

        if (bug.sapModule_ID) {
            filters.push(new Filter("sapModuleID", FilterOperator.EQ, bug.sapModule_ID));
        }

        var binding = model.bindList("/AssignableDevelopers", undefined, undefined, filters, {
            $$ownRequest: true
        });

        return binding.requestContexts(0, MAX_CANDIDATES).then(function (contexts) {
            return contexts.map(function (context) {
                return enrichCandidate(context.getObject(), view);
            });
        });
    }

    function readAssignmentExplanations(model, bug, candidates, view) {
        // Gọi explainSmartAssignment cho candidate để giải thích review-only, không ranking/auto-assign.
        if (!candidates.length || !model || typeof model.bindContext !== "function") {
            return Promise.resolve([]);
        }

        var operation = model.bindContext("/explainSmartAssignment(...)", undefined, { $$ownRequest: true });
        operation.setParameter("sourceBugID", bug.ID || null);
        operation.setParameter("componentCategoryID", bug.componentCategory_ID || null);
        operation.setParameter("sapModuleID", bug.sapModule_ID || null);
        operation.setParameter("limit", Math.min(candidates.length, 20));

        return operation.execute("$auto").then(function () {
            var resultContext = operation.getBoundContext && operation.getBoundContext();
            if (resultContext && typeof resultContext.requestObject === "function") {
                return resultContext.requestObject();
            }
            return [];
        }).then(normalizeExplanationResult).catch(function () {
            return candidates.map(function (candidate) {
                return Object.assign({
                    developerProfileID: candidate.developerProfileID,
                    providerStatus: "AI_PROVIDER_ERROR"
                }, AiReviewUi.unavailable(getAiText(view)));
            });
        });
    }

    function normalizeExplanationResult(result) {
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

    function applyAssignmentExplanations(state, explanations, view) {
        var suggestionID = (explanations || [])[0] && explanations[0].suggestionID;
        var byDeveloperProfileID = new Map((explanations || []).map(function (row) {
            return [row.developerProfileID, row];
        }));

        var candidates = (state.getProperty("/candidates") || []).map(function (candidate) {
            var explanation = byDeveloperProfileID.get(candidate.developerProfileID);
            var aiReview = explanation
                ? AiReviewUi.decorateResult(explanation, getAiText(view))
                : AiReviewUi.unavailable(getAiText(view));
            var isAiGenerated = explanation && explanation.explanationSource === "AI";
            var isRulesBased = explanation && explanation.explanationSource === "RULES";

            return Object.assign({}, candidate, {
                aiExplanation: aiReview.explanation,
                aiExplanationMeta: isAiGenerated
                    ? aiReview.meta
                    : isRulesBased
                        ? getText(view, "smartAssignRulesReviewRequired")
                        : aiReview.meta,
                aiExplanationState: isAiGenerated ? aiReview.state : isRulesBased ? "Warning" : aiReview.state,
                aiExplanationSource: isAiGenerated
                    ? getText(view, "smartAssignExplanationSourceAi")
                    : isRulesBased
                        ? getText(view, "smartAssignExplanationSourceRules")
                        : getText(view, "smartAssignExplanationSourceUnavailable"),
                aiExplanationSourceState: isAiGenerated ? "Information" : isRulesBased ? "Warning" : "None",
                aiWarnings: aiReview.warnings,
                hasAiWarnings: aiReview.hasWarnings,
                aiDecisionHint: aiReview.decisionHint
            });
        });

        state.setProperty("/candidates", candidates);
        state.setProperty("/suggestionID", suggestionID || null);
        state.setProperty("/reviewActionEnabled", Boolean(suggestionID));
        state.setProperty(
            "/reviewStateText",
            suggestionID
                ? getText(view, "aiSuggestionReviewPending")
                : getText(view, "aiSuggestionReviewUnavailable")
        );
        refreshVisibleCandidates(state);
    }

    function executeAssignment(model, bugContext, candidate, view, sourceControl) {
        // Khi user xác nhận, invoke assignment action/backend validation rồi refresh root context.
        // Breakpoint ở đây khi dialog chọn đúng nhưng assignee không được lưu.
        if (bugContext.getProperty("IsActiveEntity") !== true && typeof bugContext.setProperty === "function") {
            return bugContext.setProperty("assignee_ID", candidate.developerProfileID).then(function () {
                if (sourceControl && typeof sourceControl.setValue === "function") {
                    sourceControl.setValue(candidate.developerName);
                }
                MessageToast.show(getText(view, "smartAssignDraftAssignedToast", [candidate.developerName]));
            });
        }

        var operation = model.bindContext(
            bugContext.getPath() + "/BugService.assignToDeveloper(...)",
            undefined,
            { $$ownRequest: true }
        );

        operation.setParameter("assigneeID", candidate.developerProfileID);

        return operation.execute("$auto").then(function () {
            if (typeof bugContext.refresh === "function") {
                bugContext.refresh();
            } else if (typeof model.refresh === "function") {
                model.refresh();
            }
            MessageToast.show(getText(view, "smartAssignAssignedToast", [candidate.developerName]));
            // Assignment có thể tạo notification; yêu cầu shell refresh count ngay, không chờ poll 30 giây.
            if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
                window.dispatchEvent(new Event("idts:notification-change"));
            }
        });
    }

    function requestMissingAssignmentProperties(bugContext, bug) {
        // Chỉ đọc thêm classification/owner field cần cho candidate query và explanation.
        if (!bugContext || typeof bugContext.requestProperty !== "function") {
            return Promise.resolve(bug);
        }

        var propertyNames = [
            "applicationComponent_ID",
            "defectCategory_ID",
            "componentCategory_ID",
            "sapModule_ID",
            "IsActiveEntity",
            "HasDraftEntity",
            "assigneeDisplayName",
            "canAssign"
        ];
        var requests = propertyNames.map(function (propertyName) {
            if (bug[propertyName] !== undefined) {
                return Promise.resolve();
            }

            return bugContext.requestProperty(propertyName).then(function (value) {
                bug[propertyName] = value;
            });
        });

        return Promise.all(requests).then(function () {
            return bug;
        });
    }

    function waitForAutoSubmit(model, updateGroupId, attemptsRemaining) {
        if (
            !model ||
            typeof model.hasPendingChanges !== "function" ||
            !model.hasPendingChanges(updateGroupId)
        ) {
            return Promise.resolve();
        }
        if (attemptsRemaining <= 0) {
            return Promise.reject(new Error("Draft changes did not finish in time."));
        }
        return new Promise(function (resolve) {
            setTimeout(resolve, 50);
        }).then(function () {
            return waitForAutoSubmit(model, updateGroupId, attemptsRemaining - 1);
        });
    }

    function flushPendingChanges(model) {
        if (!model || typeof model.hasPendingChanges !== "function") {
            return Promise.resolve();
        }
        var updateGroupId = typeof model.getUpdateGroupId === "function"
            ? model.getUpdateGroupId()
            : "$auto";
        // Scope the check to the application's update group. A global check
        // also sees UI5 value-help contexts in its internal "donotsubmit"
        // group and can otherwise block Smart Assign even when $auto is clean.
        if (!model.hasPendingChanges(updateGroupId)) {
            return Promise.resolve();
        }
        if (
            updateGroupId.charAt(0) !== "$" &&
            typeof model.submitBatch === "function"
        ) {
            return model.submitBatch(updateGroupId);
        }
        // UI5 submits $auto itself. Wait for that request instead of calling submitBatch("$auto"), which is invalid.
        return waitForAutoSubmit(model, updateGroupId, 40);
    }

    function synchronizeAssignmentContext(bugContext, bug) {
        // CAP derives componentCategory_ID during PATCH; wait for that PATCH, refresh, then read the authoritative value.
        var model = bugContext && bugContext.getModel && bugContext.getModel();
        return flushPendingChanges(model)
            .then(function () {
                if (bugContext && typeof bugContext.requestRefresh === "function") {
                    return bugContext.requestRefresh();
                }
                return null;
            })
            .then(function () {
                var properties = [
                    "applicationComponent_ID",
                    "defectCategory_ID",
                    "componentCategory_ID"
                ];
                return Promise.all(properties.map(function (propertyName) {
                    if (!bugContext || typeof bugContext.requestProperty !== "function") {
                        return null;
                    }
                    return bugContext.requestProperty(propertyName).then(function (value) {
                        bug[propertyName] = value;
                    });
                }));
            })
            .then(function () {
                return requestMissingAssignmentProperties(bugContext, bug);
            });
    }

    function validateAssignmentClassification(view, bug) {
        if (bug.componentCategory_ID) {
            return true;
        }
        if (!bug.applicationComponent_ID || !bug.defectCategory_ID) {
            MessageToast.show(getText(view, "smartAssignIncompleteClassification"));
            return false;
        }
        MessageToast.show(getText(view, "smartAssignInvalidClassificationMapping"));
        return false;
    }

    function buildDialog(view, model, bugContext, bug, sourceControl) {
        // Tạo state + dialog, nạp candidates/explanations, filter/search và chỉ enable Confirm khi có selection.
        var state = new JSONModel({
            candidates: [],
            visibleCandidates: [],
            searchQuery: "",
            selectedCandidate: null,
            selectedCandidateId: "",
            selectedWarningText: "",
            aiNoticeText: getText(view, "smartAssignAiNotice"),
            suggestionID: null,
            reviewStateText: getText(view, "aiSuggestionReviewPending"),
            reviewStateState: "Information",
            reviewedByText: "",
            reviewActionEnabled: false,
            assignEnabled: false,
            busy: true,
            noDataText: getText(view, "smartAssignNoCandidates")
        });
        function submitReview(actionName) {
            return AiSuggestionReview.submit(model, state, actionName, function (key, args) {
                return getText(view, key, args);
            });
        }

        var table = new Table({
            mode: "SingleSelectMaster",
            growing: true,
            growingThreshold: 20,
            noDataText: "{smartAssign>/noDataText}",
            columns: [
                new Column({
                    header: new Text({ text: getText(view, "smartAssignDeveloperColumn") })
                }),
                new Column({
                    minScreenWidth: "Tablet",
                    demandPopin: true,
                    header: new Text({ text: getText(view, "smartAssignCapabilityColumn") })
                }),
                new Column({
                    minScreenWidth: "Tablet",
                    demandPopin: true,
                    header: new Text({ text: getText(view, "smartAssignAvailabilityColumn") })
                }),
                new Column({
                    minScreenWidth: "Desktop",
                    demandPopin: true,
                    header: new Text({ text: getText(view, "smartAssignAiExplanationColumn") })
                })
            ],
            selectionChange: function (event) {
                var item = event.getParameter("listItem");
                updateSelection(state, item && item.getBindingContext("smartAssign").getObject());
            }
        });

        table.setModel(state, "smartAssign");
        table.bindItems({
            path: "smartAssign>/visibleCandidates",
            template: new ColumnListItem({
                type: "Active",
                cells: [
                    new ObjectIdentifier({
                        title: "{smartAssign>developerName}",
                        text: "{smartAssign>developerEmail}"
                    }),
                    new VBox({
                        items: [
                            new Text({ text: "{smartAssign>capabilityText}" }),
                            new Text({ text: "{smartAssign>moduleText}" })
                        ]
                    }),
                    new ObjectStatus({
                        text: "{smartAssign>availabilityStatusName}",
                        state: "{smartAssign>availabilityState}"
                    }),
                    new VBox({
                        items: [
                            new Text({
                                text: "{smartAssign>aiExplanation}",
                                wrapping: true
                            }),
                            new ObjectStatus({
                                text: "{smartAssign>aiExplanationSource}",
                                state: "{smartAssign>aiExplanationSourceState}"
                            }),
                            new ObjectStatus({
                                text: "{smartAssign>aiExplanationMeta}",
                                state: "{smartAssign>aiExplanationState}"
                            }),
                            new Text({
                                text: "{smartAssign>aiWarnings}",
                                wrapping: true,
                                visible: "{smartAssign>hasAiWarnings}"
                            }),
                            new Text({
                                text: "{smartAssign>aiDecisionHint}",
                                wrapping: true
                            })
                        ]
                    })
                ]
            })
        });

        var dialog = new Dialog({
            title: getText(view, "smartAssignDialogTitle"),
            contentWidth: "48rem",
            contentHeight: "34rem",
            resizable: true,
            draggable: true,
            busy: "{smartAssign>/busy}",
            content: [
                new VBox({
                    width: "100%",
                    items: [
                        new MessageStrip({
                            text: getText(view, "smartAssignIntroMessage"),
                            type: "Information",
                            showIcon: true
                        }),
                        new MessageStrip({
                            text: "{smartAssign>/aiNoticeText}",
                            type: "Information",
                            showIcon: true
                        }),
                        new MessageStrip({
                            text: getText(view, "smartAssignReviewNotice"),
                            type: "Information",
                            showIcon: true
                        }).addStyleClass("sapUiTinyMarginTop"),
                        new VBox({
                            items: [
                                new ObjectStatus({
                                    text: "{smartAssign>/reviewStateText}",
                                    state: "{smartAssign>/reviewStateState}"
                                }),
                                new Text({
                                    text: "{smartAssign>/reviewedByText}",
                                    wrapping: true
                                }),
                                new HBox({
                                    wrap: "Wrap",
                                    items: [
                                        new Button({
                                            text: getText(view, "aiSuggestionAcceptButton"),
                                            type: "Accept",
                                            enabled: "{smartAssign>/reviewActionEnabled}",
                                            press: function () {
                                                return submitReview("acceptAiSuggestion");
                                            }
                                        }),
                                        new Button({
                                            text: getText(view, "aiSuggestionRejectButton"),
                                            type: "Reject",
                                            enabled: "{smartAssign>/reviewActionEnabled}",
                                            press: function () {
                                                return submitReview("rejectAiSuggestion");
                                            }
                                        }).addStyleClass("sapUiTinyMarginBegin"),
                                        new Button({
                                            text: getText(view, "aiSuggestionIgnoreButton"),
                                            enabled: "{smartAssign>/reviewActionEnabled}",
                                            press: function () {
                                                return submitReview("ignoreAiSuggestion");
                                            }
                                        }).addStyleClass("sapUiTinyMarginBegin")
                                    ]
                                }).addStyleClass("sapUiTinyMarginTop")
                            ]
                        }).addStyleClass("sapUiSmallMarginTopBottom"),
                        new SearchField({
                            width: "100%",
                            placeholder: getText(view, "smartAssignSearchPlaceholder"),
                            liveChange: function (event) {
                                state.setProperty("/searchQuery", event.getParameter("newValue") || "");
                                applySearch(state);
                            },
                            search: function (event) {
                                state.setProperty("/searchQuery", event.getParameter("query") || "");
                                applySearch(state);
                            }
                        }),
                        new MessageStrip({
                            text: "{smartAssign>/selectedWarningText}",
                            type: "Warning",
                            showIcon: true,
                            visible: "{= !!${smartAssign>/selectedWarningText} }"
                        }),
                        table
                    ]
                })
            ],
            beginButton: new Button({
                text: getText(view, "smartAssignAssignButton"),
                type: "Emphasized",
                enabled: "{smartAssign>/assignEnabled}",
                press: function () {
                    var candidate = state.getProperty("/selectedCandidate");
                    if (!candidate) {
                        return;
                    }

                    dialog.setBusy(true);
                    executeAssignment(model, bugContext, candidate, view, sourceControl)
                        .then(function () {
                            dialog.close();
                        })
                        .catch(function () {
                            MessageBox.error(getText(view, "smartAssignAssignFailed"));
                        })
                        .finally(function () {
                            dialog.setBusy(false);
                        });
                }
            }),
            endButton: new Button({
                text: getText(view, "smartAssignCancelButton"),
                press: function () {
                    dialog.close();
                }
            }),
            customHeader: new Toolbar({
                content: [
                    new Text({ text: getText(view, "smartAssignDialogTitle") }),
                    new ToolbarSpacer(),
                    new ObjectStatus({
                        text: bug.assigneeDisplayName
                            ? getText(view, "smartAssignCurrentAssignee", [bug.assigneeDisplayName])
                            : getText(view, "smartAssignNoCurrentAssignee"),
                        state: bug.assigneeDisplayName ? "Information" : "None"
                    })
                ]
            }),
            afterClose: function () {
                dialog.destroy();
            }
        });

        dialog.setModel(state, "smartAssign");
        view.addDependent(dialog);

        readCandidates(model, bug, view)
            .then(function (candidates) {
                state.setProperty("/candidates", candidates);
                state.setProperty(
                    "/noDataText",
                    candidates.length
                        ? getText(view, "smartAssignNoSearchResults")
                        : getText(view, "smartAssignNoCandidates")
                );
                applySearch(state);
                return readAssignmentExplanations(model, bug, candidates, view)
                    .then(function (explanations) {
                        applyAssignmentExplanations(state, explanations, view);
                    });
            })
            .catch(function () {
                MessageBox.error(getText(view, "smartAssignLoadFailed"));
            })
            .finally(function () {
                state.setProperty("/busy", false);
            });

        return dialog;
    }

    return {
        isVisible: function () {
            return canUseAssignmentUi();
        },

        resetAssigneeInput: function (event) {
            var source = event.getSource();
            var context = findBugContext(source);
            var currentValue = context && context.getProperty("assigneeDisplayName") || "";
            source.setValue(currentValue);
            if (canUseAssignmentUi()) {
                MessageToast.show(getText(findHost(source), "smartAssignUseValueHelp"));
            }
        },

        openAssigneePicker: function (event) {
            if (!canUseAssignmentUi()) {
                return Promise.reject(new Error("Current user is not allowed to assign bugs."));
            }

            var source = event.getSource();
            var view = findHost(source);
            var bugContext = findBugContext(source);
            if (!bugContext) {
                MessageBox.error(getText(view, "smartAssignLoadFailed"));
                return Promise.resolve(null);
            }

            var model = bugContext.getModel();
            if (typeof source.setBusy === "function") {
                source.setBusy(true);
            }

            return bugContext.requestObject().then(function (bug) {
                return synchronizeAssignmentContext(bugContext, bug || {});
            }).then(function (bug) {
                if (!bug || bug.status_code === "CLOSED" || (bug.IsActiveEntity === true && bug.canAssign === false)) {
                    MessageToast.show(getText(view, "smartAssignUnavailableAction"));
                    return null;
                }

                if (!validateAssignmentClassification(view, bug)) {
                    return null;
                }

                var dialog = buildDialog(view, model, bugContext, bug, source);
                dialog.open();
                return dialog;
            }).catch(function () {
                MessageBox.error(getText(view, "smartAssignLoadFailed"));
                return null;
            }).finally(function () {
                if (typeof source.setBusy === "function") {
                    source.setBusy(false);
                }
            });
        },

        openDialog: function (bindingContext) {
            if (!canUseAssignmentUi()) {
                return Promise.reject(new Error("Current user is not allowed to assign bugs."));
            }

            var view = getView(this);
            var bugContext = getBindingContext(this, bindingContext);
            var model = bugContext.getModel();

            return bugContext.requestObject().then(function (bug) {
                return synchronizeAssignmentContext(bugContext, bug || {});
            }).then(function (bug) {
                if (!bug || (bug.IsActiveEntity === true && bug.canAssign === false)) {
                    MessageToast.show(getText(view, "smartAssignUnavailableAction"));
                    return null;
                }

                if (!validateAssignmentClassification(view, bug)) {
                    return null;
                }

                var dialog = buildDialog(view, model, bugContext, bug);
                dialog.open();
                return dialog;
            }).catch(function () {
                MessageBox.error(getText(view, "smartAssignLoadFailed"));
                return null;
            });
        }
    };
});
