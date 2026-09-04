/**
 * Gợi ý học/debug: dashboard chỉ đọc OData; số KPI sai thường bắt đầu từ filter/role profile, không phải từ thao tác ghi bug.
 * IDTS role-based dashboard page.
 *
 * Standalone SAPUI5 page protected by auth-guard.js. It reads existing OData
 * data and renders a read-only overview for Tester, Developer, and PM roles.
 */
/* global Promise */
(function () {
    "use strict";

    var STATUS_LABELS = {
        NEW: "New",
        PENDING_ASSIGNMENT: "Pending Assignment",
        ASSIGNED: "Assigned",
        IN_REVIEW: "In Review",
        IN_PROGRESS: "In Progress",
        NEED_MORE_INFORMATION: "Need More Information",
        RESOLVED: "Resolved",
        RETEST_REQUIRED: "Retest Required",
        REJECTED: "Rejected",
        REOPENED: "Reopened",
        CLOSED: "Closed"
    };

    var STATUS_STATES = {
        CLOSED: "Success",
        RESOLVED: "Success",
        RETEST_REQUIRED: "Warning",
        NEED_MORE_INFORMATION: "Warning",
        REJECTED: "Error",
        PENDING_ASSIGNMENT: "Information"
    };

    var PM_STATUS_TILES = [
        { statusCode: "PENDING_ASSIGNMENT", icon: "sap-icon://group", valueColor: "Critical" },
        { statusCode: "ASSIGNED", icon: "sap-icon://employee", valueColor: "Neutral" },
        { statusCode: "IN_REVIEW", icon: "sap-icon://inspect", valueColor: "Neutral" },
        { statusCode: "NEED_MORE_INFORMATION", icon: "sap-icon://question-mark", valueColor: "Critical" },
        { statusCode: "IN_PROGRESS", icon: "sap-icon://process", valueColor: "Neutral" },
        { statusCode: "RESOLVED", icon: "sap-icon://complete", valueColor: "Good" },
        { statusCode: "RETEST_REQUIRED", icon: "sap-icon://validate", valueColor: "Critical" },
        { statusCode: "REJECTED", icon: "sap-icon://decline", valueColor: "Error" },
        { statusCode: "REOPENED", icon: "sap-icon://undo", valueColor: "Critical" },
        { statusCode: "CLOSED", icon: "sap-icon://locked", valueColor: "Good" }
    ];

    sap.ui.require([
        "sap/m/App",
        "sap/m/Page",
        "sap/m/Button",
        "sap/m/Dialog",
        "sap/m/Table",
        "sap/m/Column",
        "sap/m/Text",
        "sap/m/ColumnListItem",
        "sap/m/ObjectStatus",
        "sap/m/VBox",
        "sap/m/FlexBox",
        "sap/m/Panel",
        "sap/m/MessageStrip",
        "sap/m/GenericTile",
        "sap/m/TileContent",
        "sap/m/NumericContent",
        "sap/m/List",
        "sap/m/StandardListItem",
        "sap/m/MessageBox",
        "sap/m/MessageToast",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/resource/ResourceModel",
        "sap/ui/Device",
        "idts/bugmanagementui/ext/login/ProfileShell",
        "idts/bugmanagementui/ext/login/LoginController"
    ], function (
        App,
        Page,
        Button,
        Dialog,
        Table,
        Column,
        Text,
        ColumnListItem,
        ObjectStatus,
        VBox,
        FlexBox,
        Panel,
        MessageStrip,
        GenericTile,
        TileContent,
        NumericContent,
        List,
        StandardListItem,
        MessageBox,
        MessageToast,
        JSONModel,
        ResourceModel,
        Device,
        ProfileShell,
        LoginSession
    ) {
        var textModel = new ResourceModel({
            bundleName: "idts.bugmanagementui.i18n.i18n",
            async: true
        });
        var page;
        var headerContent = [
            new Button({
                icon: "sap-icon://refresh",
                text: "Refresh",
                press: loadDashboard
            }),
            new Button({
                id: "dashboardAiActivityButton",
                icon: "sap-icon://activity-items",
                text: "{i18n>dashboardAiActivityButton}",
                visible: Boolean(LoginSession.getUser() && LoginSession.getUser().role_code === "PM"),
                press: openAiActivity
            })
        ];
        var profileHeaderButton = ProfileShell.createHeaderButton();
        if (profileHeaderButton) {
            headerContent.push(profileHeaderButton);
        }

        var dashboardModel = new JSONModel({
            roleMessage: "",
            tiles: [],
            focusBugs: [],
            workloads: [],
            showWorkload: false
        });

        page = new Page({
                    title: "Dashboard",
                    showNavButton: true,
                    navButtonPress: openBugList,
                    headerContent: headerContent,
                    content: [
                        new VBox({
                            width: "100%",
                            items: [
                                new MessageStrip({
                                    text: "{dashboard>/roleMessage}",
                                    type: "Information",
                                    showIcon: true
                                }).addStyleClass("sapUiSmallMarginBottom"),
                                new FlexBox({
                                    wrap: "Wrap",
                                    alignItems: "Stretch",
                                    items: {
                                        path: "dashboard>/tiles",
                                        template: new GenericTile({
                                            header: "{dashboard>title}",
                                            subheader: "{dashboard>subtitle}",
                                            frameType: "OneByOne",
                                            press: openBugList,
                                            tileContent: [
                                                new TileContent({
                                                    footer: "{dashboard>footer}",
                                                    content: [
                                                        new NumericContent({
                                                            value: "{dashboard>value}",
                                                            valueColor: "{dashboard>valueColor}",
                                                            icon: "{dashboard>icon}",
                                                            withMargin: false
                                                        })
                                                    ]
                                                })
                                            ]
                                        }).addStyleClass("idtsDashboardTile sapUiTinyMarginEnd sapUiTinyMarginBottom")
                                    }
                                }).addStyleClass("idtsDashboardTiles"),
                                new Panel({
                                    headerText: "Needs attention",
                                    content: [
                                        new List({
                                            noDataText: "No items need attention right now.",
                                            items: {
                                                path: "dashboard>/focusBugs",
                                                template: new StandardListItem({
                                                    title: "{dashboard>title}",
                                                    description: "{dashboard>description}",
                                                    info: "{dashboard>status}",
                                                    infoState: "{dashboard>state}",
                                                    type: "Navigation",
                                                    press: openBug
                                                })
                                            }
                                        })
                                    ]
                                }).addStyleClass("sapUiSmallMarginTop"),
                                new Panel({
                                    headerText: "Developer workload",
                                    visible: "{dashboard>/showWorkload}",
                                    content: [
                                        new List({
                                            noDataText: "No developer workload data is available.",
                                            items: {
                                                path: "dashboard>/workloads",
                                                template: new StandardListItem({
                                                    title: "{dashboard>developerName}",
                                                    description: "{dashboard>description}",
                                                    info: "{dashboard>workloadText}",
                                                    infoState: "{dashboard>state}"
                                                })
                                            }
                                        })
                                    ]
                                }).addStyleClass("sapUiSmallMarginTop")
                            ]
                        }).addStyleClass("sapUiResponsiveContentPadding idtsDashboardPage")
                    ]
                });

        var app = new App({
            pages: [page]
        });

        app.setModel(dashboardModel, "dashboard");
        app.setModel(textModel, "i18n");
        app.placeAt("dashboardContent");
        loadDashboard();

        // Sau khi session/profile sẵn sàng, gọi Bugs cho mọi role; workload chỉ dành cho PM/Developer.
        // Breakpoint đầu tiên khi KPI/list trống hoặc sai.
        function loadDashboard() {
            var user = LoginSession.getUser();
            var roleCode = user && user.role_code ? user.role_code : "";

            app.setBusy(true);

            Promise.all([
                fetchOData("/odata/v4/bug/Bugs?$top=200&$orderby=modifiedAt%20desc&$select=ID,IsActiveEntity,bugNumber,title,status_code,reporter_ID,assignee_ID,nextProcessorUser_ID,nextProcessorRole_code,isOverdue,isPendingAssignment,isRejectedFollowUp,isRetestRequired,reporterDisplayName,assigneeDisplayName,nextProcessorUserDisplayName,currentActionOwnerDisplayName"),
                roleCode === "PM" || roleCode === "DEVELOPER"
                    ? fetchOData("/odata/v4/bug/DeveloperWorkloads?$top=100&$orderby=developerName%20asc")
                    : Promise.resolve({ value: [] }),
                roleCode === "PM"
                    ? fetchOData("/odata/v4/bug/readBugStatusMetrics()")
                    : Promise.resolve({ value: [] })
            ]).then(function (results) {
                var bugs = normalizeBugs(results[0].value || []);
                var workloads = normalizeWorkloads(results[1].value || []);
                var statusMetrics = normalizeStatusMetrics(results[2].value || []);
                dashboardModel.setData(buildDashboardModel(roleCode, user, bugs, workloads, statusMetrics));
            }).catch(function () {
                dashboardModel.setData({
                    roleMessage: "Dashboard data is not available right now. Please refresh the page or try again later.",
                    tiles: [],
                    focusBugs: [],
                    workloads: [],
                    showWorkload: false
                });
                MessageToast.show("Dashboard data is not available right now.");
            }).finally(function () {
                app.setBusy(false);
            });
        }

        // Gắn bearer token vào GET OData và parse JSON; response không OK đi vào error state chung.
        function fetchOData(url) {
            var token = LoginSession.getToken();
            return fetch(url, {
                method: "GET",
                headers: token ? { Authorization: "Bearer " + token } : {}
            }).then(function (response) {
                if (!response.ok) {
                    throw new Error("Dashboard data request failed.");
                }
                return response.json();
            });
        }

        // Chỉ PM được mở metrics; backend vẫn kiểm quyền lần nữa khi nhận function call.
        function openAiActivity() {
            var user = LoginSession.getUser();
            if (!user || user.role_code !== "PM") {
                return;
            }

            var metricsModel = new JSONModel({
                rows: []
            });
            var dialog = new Dialog({
                title: "{i18n>dashboardAiActivityTitle}",
                contentWidth: "76rem",
                resizable: true,
                stretch: Device.system.phone,
                busy: true,
                content: [
                    new Table({
                        growing: true,
                        noDataText: "{i18n>dashboardAiActivityNoData}",
                        columns: [
                            new Column({ header: new Text({ text: "{i18n>dashboardAiActivityCapability}" }) }),
                            new Column({ header: new Text({ text: "{i18n>dashboardAiActivityRequests}" }) }),
                            new Column({ header: new Text({ text: "{i18n>dashboardAiActivitySuccessful}" }) }),
                            new Column({ demandPopin: true, minScreenWidth: "Tablet", header: new Text({ text: "{i18n>dashboardAiActivityBadRequest}" }) }),
                            new Column({ demandPopin: true, minScreenWidth: "Tablet", header: new Text({ text: "{i18n>dashboardAiActivityRateLimited}" }) }),
                            new Column({ demandPopin: true, minScreenWidth: "Desktop", header: new Text({ text: "{i18n>dashboardAiActivityProvider5xx}" }) }),
                            new Column({ demandPopin: true, minScreenWidth: "Desktop", header: new Text({ text: "{i18n>dashboardAiActivityTimeout}" }) }),
                            new Column({ demandPopin: true, minScreenWidth: "Desktop", header: new Text({ text: "{i18n>dashboardAiActivityUnavailable}" }) }),
                            new Column({ demandPopin: true, minScreenWidth: "Desktop", header: new Text({ text: "{i18n>dashboardAiActivityOtherFailure}" }) }),
                            new Column({ header: new Text({ text: "{i18n>dashboardAiActivityAverageLatency}" }) }),
                            new Column({ demandPopin: true, minScreenWidth: "Tablet", header: new Text({ text: "{i18n>dashboardAiActivityReviewDecisions}" }) })
                        ],
                        items: {
                            path: "aiMetrics>/rows",
                            template: new ColumnListItem({
                                cells: [
                                    new Text({ text: "{aiMetrics>featureName}" }),
                                    new Text({ text: "{aiMetrics>requestCount}" }),
                                    new ObjectStatus({ text: "{aiMetrics>successCount}", state: "Success" }),
                                    new ObjectStatus({ text: "{aiMetrics>badRequestCount}", state: "Warning" }),
                                    new ObjectStatus({ text: "{aiMetrics>rateLimitedCount}", state: "Warning" }),
                                    new ObjectStatus({ text: "{aiMetrics>provider5xxCount}", state: "Error" }),
                                    new ObjectStatus({ text: "{aiMetrics>timeoutCount}", state: "Warning" }),
                                    new ObjectStatus({ text: "{aiMetrics>unavailableCount}", state: "Warning" }),
                                    new ObjectStatus({ text: "{aiMetrics>otherFailureCount}", state: "Warning" }),
                                    new Text({ text: "{aiMetrics>averageLatencyText}" }),
                                    new Text({ text: "{aiMetrics>reviewDecisionsText}" })
                                ]
                            })
                        }
                    })
                ],
                endButton: new Button({
                    text: "{i18n>dashboardAiActivityClose}",
                    press: function () {
                        dialog.close();
                    }
                }),
                afterClose: function () {
                    dialog.destroy();
                }
            });

            dialog.setModel(metricsModel, "aiMetrics");
            dialog.setModel(textModel, "i18n");
            page.addDependent(dialog);
            dialog.open();

            Promise.all([
                fetchOData("/odata/v4/bug/readAiOperationalMetrics(windowDays=30)"),
                Promise.resolve(textModel.getResourceBundle())
            ]).then(function (results) {
                var bundle = results[1];
                var rows = aggregateAiMetrics((results[0].value || []), bundle);
                metricsModel.setProperty("/rows", rows);
            }).catch(function () {
                Promise.resolve(textModel.getResourceBundle()).then(function (bundle) {
                    MessageBox.error(bundle.getText("dashboardAiActivityLoadFailed"));
                });
            }).finally(function () {
                dialog.setBusy(false);
            });
        }

        // Gộp các dòng backend theo capability để không lộ provider/model lên giao diện PM.
        function aggregateAiMetrics(rows, bundle) {
            var groups = {};
            (rows || []).forEach(function (row) {
                var featureCode = String(row.featureTypeCode || "UNKNOWN").toUpperCase();
                var group = groups[featureCode] || {
                    featureCode: featureCode,
                    requestCount: 0,
                    successCount: 0,
                    badRequestCount: 0,
                    rateLimitedCount: 0,
                    provider5xxCount: 0,
                    timeoutCount: 0,
                    unavailableCount: 0,
                    otherFailureCount: 0,
                    latencyTotal: 0,
                    latencySamples: 0,
                    acceptedCount: 0,
                    rejectedCount: 0,
                    ignoredCount: 0,
                    pendingCount: 0
                };
                group.requestCount += Number(row.requestCount || 0);
                group.successCount += Number(row.successCount || 0);
                // Backend failureCount đã gồm timeout/unavailable; không cộng unavailableCount lần hai.
                group.badRequestCount += Number(row.badRequestCount || 0);
                group.rateLimitedCount += Number(row.rateLimitedCount || 0);
                group.provider5xxCount += Number(row.provider5xxCount || 0);
                group.timeoutCount += Number(row.timeoutCount || 0);
                group.unavailableCount += Number(row.unavailableCount || 0);
                group.otherFailureCount += Number(row.otherFailureCount || 0);
                if (row.averageLatencyMs !== null && row.averageLatencyMs !== undefined) {
                    var samples = Number(row.latencySampleCount || 0);
                    group.latencyTotal += Number(row.averageLatencyMs) * samples;
                    group.latencySamples += samples;
                }
                group.acceptedCount += Number(row.acceptedCount || 0);
                group.rejectedCount += Number(row.rejectedCount || 0);
                group.ignoredCount += Number(row.ignoredCount || 0);
                group.pendingCount += Number(row.pendingCount || 0);
                groups[featureCode] = group;
            });

            return Object.keys(groups).sort().map(function (featureCode) {
                var group = groups[featureCode];
                var latencyText = group.latencySamples
                    ? bundle.getText("dashboardAiActivityLatency", [Math.round(group.latencyTotal / group.latencySamples)])
                    : bundle.getText("dashboardAiActivityNoLatency");
                return {
                    featureName: featureName(featureCode, bundle),
                    requestCount: group.requestCount,
                    successCount: group.successCount,
                    badRequestCount: group.badRequestCount,
                    rateLimitedCount: group.rateLimitedCount,
                    provider5xxCount: group.provider5xxCount,
                    timeoutCount: group.timeoutCount,
                    unavailableCount: group.unavailableCount,
                    otherFailureCount: group.otherFailureCount,
                    averageLatencyText: latencyText,
                    reviewDecisionsText: bundle.getText("dashboardAiActivityReviewCounts", [
                        group.acceptedCount,
                        group.rejectedCount,
                        group.ignoredCount,
                        group.pendingCount
                    ])
                };
            });
        }

        function featureName(featureCode, bundle) {
            var keys = {
                DUPLICATE_DETECTION: "dashboardAiActivitySimilarBugs",
                CLASSIFICATION: "dashboardAiActivityClassification",
                BUG_SUMMARY: "dashboardAiActivityHandoff",
                ASSIGNMENT_EXPLANATION: "dashboardAiActivitySmartAssign"
            };
            return bundle.getText(keys[featureCode] || "dashboardAiActivityOther");
        }

        // Router thuần chọn model Tester/Developer/PM; không ghi DB hay gọi API tại đây.
        function buildDashboardModel(roleCode, user, bugs, workloads, statusMetrics) {
            var userID = user && user.ID;
            var developerWorkload = findCurrentDeveloperWorkload(workloads, userID);
            var openBugs = bugs.filter(function (bug) { return bug.statusCode !== "CLOSED"; });

            if (roleCode === "DEVELOPER") {
                return developerDashboard(user, developerWorkload, openBugs, workloads);
            }

            if (roleCode === "PM") {
                return pmDashboard(openBugs, workloads, statusMetrics);
            }

            return testerDashboard(user, openBugs);
        }

        // Lọc theo reporter/current action/status để dựng KPI và focus list của Tester.
        function testerDashboard(user, bugs) {
            var userID = user && user.ID;
            var createdByMe = bugs.filter(function (bug) { return bug.reporterID === userID; });
            var needMyInput = bugs.filter(function (bug) {
                return bug.nextProcessorUserID === userID;
            });
            var retestRequired = bugs.filter(function (bug) {
                return bug.nextProcessorUserID === userID && bug.isRetestRequired;
            });

            return {
                roleMessage: "Track bugs you reported and items waiting for your next action.",
                tiles: [
                    tile("Created by me", createdByMe.length, "sap-icon://create-entry-time", "Neutral", {
                        reporter_ID: userID,
                        exclude_closed: "true"
                    }),
                    tile("Need my input", needMyInput.length, "sap-icon://inbox", needMyInput.length ? "Critical" : "Good", {
                        nextProcessorUser_ID: userID,
                        exclude_closed: "true"
                    }),
                    tile("Retest required", retestRequired.length, "sap-icon://validate", retestRequired.length ? "Critical" : "Good", {
                        status_code: "RETEST_REQUIRED",
                        nextProcessorUser_ID: userID
                    })
                ],
                focusBugs: focusList(needMyInput.concat(retestRequired, createdByMe)),
                workloads: [],
                showWorkload: false
            };
        }

        // Kết hợp workload backend với Bug assign/current action của Developer đăng nhập.
        function developerDashboard(user, developerWorkload, bugs) {
            var userID = user && user.ID;
            var profileID = developerWorkload && developerWorkload.developerProfileID;
            var assignedToMe = bugs.filter(function (bug) {
                return bug.assigneeID === profileID || (!profileID && user && bug.assigneeDisplayName === user.displayName);
            });
            var inProgress = assignedToMe.filter(function (bug) { return bug.statusCode === "IN_PROGRESS"; });
            var infoRequested = assignedToMe.filter(function (bug) { return bug.statusCode === "NEED_MORE_INFORMATION"; });
            var myActionItems = bugs.filter(function (bug) {
                return bug.nextProcessorUserID === userID || bug.assigneeID === profileID;
            });

            return {
                roleMessage: "Track bugs assigned to you and work that needs your response.",
                tiles: [
                    tile("Assigned to me", assignedToMe.length, "sap-icon://employee", "Neutral", { assignee_ID: profileID }),
                    tile("In progress", inProgress.length, "sap-icon://process", inProgress.length ? "Critical" : "Good", {
                        status_code: "IN_PROGRESS",
                        assignee_ID: profileID
                    }),
                    tile("Information requested", infoRequested.length, "sap-icon://question-mark", infoRequested.length ? "Critical" : "Good", {
                        status_code: "NEED_MORE_INFORMATION",
                        assignee_ID: profileID
                    })
                ],
                focusBugs: focusList(myActionItems),
                workloads: [],
                showWorkload: false
            };
        }

        // PM thấy toàn cảnh open/pending/overdue và workload, không giới hạn theo một user.
        function pmDashboard(bugs, workloads, statusMetrics) {
            var pendingAssignment = bugs.filter(function (bug) { return bug.isPendingAssignment; });
            var overdue = bugs.filter(function (bug) { return bug.isOverdue; });
            var metricsByCode = {};
            statusMetrics.forEach(function (metric) {
                metricsByCode[metric.statusCode] = metric;
            });

            return {
                roleMessage: "Monitor every Bug lifecycle status, overdue work, AI activity, and developer workload.",
                tiles: PM_STATUS_TILES.map(function (definition) {
                    var metric = metricsByCode[definition.statusCode] || {};
                    return tile(
                        metric.statusName || STATUS_LABELS[definition.statusCode],
                        metric.bugCount || 0,
                        definition.icon,
                        Number(metric.bugCount || 0) === 0 ? "Neutral" : definition.valueColor,
                        { status_code: definition.statusCode }
                    );
                }),
                focusBugs: focusList(overdue.concat(pendingAssignment, bugs)),
                workloads: workloadList(workloads),
                showWorkload: true
            };
        }

        // Chuẩn hóa boolean/null/label OData để filter và binding dùng cùng shape.
        function normalizeBugs(rows) {
            return rows
                .filter(function (row) { return row.IsActiveEntity !== false; })
                .map(function (row) {
                    var statusCode = row.status_code || "";
                    return {
                        ID: row.ID,
                        bugNumber: row.bugNumber || "",
                        title: row.title || "",
                        statusCode: statusCode,
                        status: STATUS_LABELS[statusCode] || statusCode || "Status not available",
                        state: STATUS_STATES[statusCode] || "None",
                        reporterID: row.reporter_ID || null,
                        assigneeID: row.assignee_ID || null,
                        nextProcessorUserID: row.nextProcessorUser_ID || null,
                        reporterDisplayName: row.reporterDisplayName || "",
                        assigneeDisplayName: row.assigneeDisplayName || "",
                        currentActionOwnerDisplayName: row.currentActionOwnerDisplayName || "",
                        isOverdue: row.isOverdue === true,
                        isPendingAssignment: row.isPendingAssignment === true,
                        isRetestRequired: row.isRetestRequired === true
                    };
                });
        }

        // Chuyển count/decimal từ OData thành number hiển thị ổn định.
        function normalizeWorkloads(rows) {
            return rows
                .filter(function (row) { return row.active !== false; })
                .map(function (row) {
                    return {
                        developerProfileID: row.developerProfileID,
                        developerUserID: row.developerUserID,
                        developerName: row.developerName || "Developer",
                        availabilityStatusName: row.availabilityStatusName || "",
                        openOwnedBugCount: Number(row.openOwnedBugCount || 0),
                        overdueOwnedBugCount: Number(row.overdueOwnedBugCount || 0),
                        currentActionItemCount: Number(row.currentActionItemCount || 0),
                        isOverloaded: row.isOverloaded === true
                    };
                });
        }

        function normalizeStatusMetrics(rows) {
            return rows.map(function (row) {
                return {
                    statusCode: String(row.statusCode || ""),
                    statusName: row.statusName || STATUS_LABELS[row.statusCode] || row.statusCode,
                    bugCount: Number(row.bugCount || 0)
                };
            });
        }

        // Dựng row public/criticality cho list; không tính lại rule backend.
        function workloadList(workloads) {
            return workloads.slice(0, 8).map(function (row) {
                var hasRisk = row.isOverloaded || row.overdueOwnedBugCount > 0;
                return {
                    developerName: row.developerName,
                    description: row.availabilityStatusName || "Availability not available",
                    workloadText: row.openOwnedBugCount + " open, " + row.currentActionItemCount + " action items",
                    state: hasRisk ? "Warning" : "Success"
                };
            });
        }

        // Chọn tối đa tám Bug ưu tiên và loại trùng ID để dashboard không kéo dài.
        function focusList(bugs) {
            var seen = {};
            var result = [];

            bugs.forEach(function (bug) {
                if (!bug.ID || seen[bug.ID] || result.length >= 8) {
                    return;
                }
                seen[bug.ID] = true;
                result.push({
                    ID: bug.ID,
                    title: [bug.bugNumber, bug.title].filter(Boolean).join(" - "),
                    description: bug.currentActionOwnerDisplayName
                        ? "Current owner: " + bug.currentActionOwnerDisplayName
                        : "Current owner is not assigned.",
                    status: bug.status,
                    state: bug.state
                });
            });

            return result;
        }

        // Map Users.ID đăng nhập với developerUserID trong read model workload.
        function findCurrentDeveloperWorkload(workloads, userID) {
            if (!userID) return null;
            for (var index = 0; index < workloads.length; index += 1) {
                if (workloads[index].developerUserID === userID) {
                    return workloads[index];
                }
            }
            return null;
        }

        // Factory object KPI cho JSONModel; không có side effect.
        function tile(title, value, icon, valueColor, filters) {
            return {
                title: title,
                subtitle: "Current count",
                value: String(value),
                valueColor: valueColor,
                icon: icon,
                footer: "Open filtered bug list",
                filters: filters || {}
            };
        }

        // Điều hướng về Fiori List Report mà không xóa session.
        function openBugList(event) {
            var context = event && event.getSource && event.getSource().getBindingContext("dashboard");
            var filters = (context && context.getProperty("filters")) || {};
            var params = new URLSearchParams();

            ["status_code", "reporter_ID", "nextProcessorUser_ID", "assignee_ID", "exclude_closed"].forEach(function (property) {
                if (filters[property]) {
                    params.set(property, filters[property]);
                }
            });

            window.location.href = params.toString() ? "index.html#?" + params.toString() : "index.html";
        }

        // Lấy Bug ID từ binding context và mở deep link Object Page; ID thiếu thì bỏ qua an toàn.
        function openBug(event) {
            var bug = event.getSource().getBindingContext("dashboard").getObject();
            if (!bug || !bug.ID) {
                return;
            }
            window.location.href = "index.html#Bugs(ID=" + bug.ID + ",IsActiveEntity=true)";
        }
    });
})();
