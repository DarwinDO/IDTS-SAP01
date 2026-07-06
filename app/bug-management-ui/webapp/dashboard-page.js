/**
 * IDTS role-based dashboard page.
 *
 * Standalone SAPUI5 page protected by auth-guard.js. It reads existing OData
 * data and renders a read-only overview for Tester, Developer, and PM roles.
 */
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

    sap.ui.require([
        "sap/m/App",
        "sap/m/Page",
        "sap/m/Button",
        "sap/m/VBox",
        "sap/m/FlexBox",
        "sap/m/Panel",
        "sap/m/MessageStrip",
        "sap/m/GenericTile",
        "sap/m/TileContent",
        "sap/m/NumericContent",
        "sap/m/List",
        "sap/m/StandardListItem",
        "sap/m/MessageToast",
        "sap/ui/model/json/JSONModel",
        "idts/bugmanagementui/ext/login/ProfileShell",
        "idts/bugmanagementui/ext/login/LoginController"
    ], function (
        App,
        Page,
        Button,
        VBox,
        FlexBox,
        Panel,
        MessageStrip,
        GenericTile,
        TileContent,
        NumericContent,
        List,
        StandardListItem,
        MessageToast,
        JSONModel,
        ProfileShell,
        LoginSession
    ) {
        var headerContent = [
            new Button({
                icon: "sap-icon://refresh",
                text: "Refresh",
                press: loadDashboard
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

        var app = new App({
            pages: [
                new Page({
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
                })
            ]
        });

        app.setModel(dashboardModel, "dashboard");
        app.placeAt("dashboardContent");
        loadDashboard();

        function loadDashboard() {
            var user = LoginSession.getUser();
            var roleCode = user && user.role_code ? user.role_code : "";

            app.setBusy(true);

            Promise.all([
                fetchOData("/odata/v4/bug/Bugs?$top=200&$orderby=modifiedAt%20desc&$select=ID,IsActiveEntity,bugNumber,title,status_code,reporter_ID,assignee_ID,nextProcessorUser_ID,nextProcessorRole_code,isOverdue,isPendingAssignment,isRejectedFollowUp,isRetestRequired,reporterDisplayName,assigneeDisplayName,nextProcessorUserDisplayName,currentActionOwnerDisplayName"),
                fetchOData("/odata/v4/bug/DeveloperWorkloads?$top=100&$orderby=developerName%20asc")
            ]).then(function (results) {
                var bugs = normalizeBugs(results[0].value || []);
                var workloads = normalizeWorkloads(results[1].value || []);
                dashboardModel.setData(buildDashboardModel(roleCode, user, bugs, workloads));
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

        function buildDashboardModel(roleCode, user, bugs, workloads) {
            var userID = user && user.ID;
            var developerWorkload = findCurrentDeveloperWorkload(workloads, userID);
            var openBugs = bugs.filter(function (bug) { return bug.statusCode !== "CLOSED"; });

            if (roleCode === "DEVELOPER") {
                return developerDashboard(user, developerWorkload, openBugs, workloads);
            }

            if (roleCode === "PM") {
                return pmDashboard(openBugs, workloads);
            }

            return testerDashboard(user, openBugs);
        }

        function testerDashboard(user, bugs) {
            var userID = user && user.ID;
            var createdByMe = bugs.filter(function (bug) { return bug.reporterID === userID; });
            var needMyInput = bugs.filter(function (bug) {
                return bug.nextProcessorUserID === userID || (bug.reporterID === userID && bug.statusCode === "NEED_MORE_INFORMATION");
            });
            var retestRequired = bugs.filter(function (bug) {
                return bug.reporterID === userID && bug.isRetestRequired;
            });

            return {
                roleMessage: "Track bugs you reported and items waiting for your next action.",
                tiles: [
                    tile("Created by me", createdByMe.length, "sap-icon://create-entry-time", "Neutral"),
                    tile("Need my input", needMyInput.length, "sap-icon://inbox", needMyInput.length ? "Critical" : "Good"),
                    tile("Retest required", retestRequired.length, "sap-icon://validate", retestRequired.length ? "Critical" : "Good")
                ],
                focusBugs: focusList(needMyInput.concat(retestRequired, createdByMe)),
                workloads: [],
                showWorkload: false
            };
        }

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
                    tile("Assigned to me", assignedToMe.length, "sap-icon://employee", "Neutral"),
                    tile("In progress", inProgress.length, "sap-icon://process", inProgress.length ? "Critical" : "Good"),
                    tile("Information requested", infoRequested.length, "sap-icon://question-mark", infoRequested.length ? "Critical" : "Good")
                ],
                focusBugs: focusList(myActionItems),
                workloads: [],
                showWorkload: false
            };
        }

        function pmDashboard(bugs, workloads) {
            var pendingAssignment = bugs.filter(function (bug) { return bug.isPendingAssignment; });
            var overdue = bugs.filter(function (bug) { return bug.isOverdue; });

            return {
                roleMessage: "Monitor open bugs, pending assignment, overdue work, and developer workload.",
                tiles: [
                    tile("Open bugs", bugs.length, "sap-icon://request", "Neutral"),
                    tile("Pending assignment", pendingAssignment.length, "sap-icon://group", pendingAssignment.length ? "Critical" : "Good"),
                    tile("Overdue", overdue.length, "sap-icon://alert", overdue.length ? "Error" : "Good")
                ],
                focusBugs: focusList(overdue.concat(pendingAssignment, bugs)),
                workloads: workloadList(workloads),
                showWorkload: true
            };
        }

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

        function findCurrentDeveloperWorkload(workloads, userID) {
            if (!userID) return null;
            for (var index = 0; index < workloads.length; index += 1) {
                if (workloads[index].developerUserID === userID) {
                    return workloads[index];
                }
            }
            return null;
        }

        function tile(title, value, icon, valueColor) {
            return {
                title: title,
                subtitle: "Current count",
                value: String(value),
                valueColor: valueColor,
                icon: icon,
                footer: "Open bug list"
            };
        }

        function openBugList() {
            window.location.href = "index.html";
        }

        function openBug(event) {
            var bug = event.getSource().getBindingContext("dashboard").getObject();
            if (!bug || !bug.ID) {
                return;
            }
            window.location.href = "index.html#Bugs(ID=" + bug.ID + ",IsActiveEntity=true)";
        }
    });
})();
