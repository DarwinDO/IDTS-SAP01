/** Shell thông báo cá nhân chỉ render DTO an toàn bằng control UI5 native; CAP vẫn giữ quyền dữ liệu. */
sap.ui.define([
    "sap/m/Toolbar",
    "sap/m/ToolbarSpacer",
    "sap/m/Button",
    "sap/m/ResponsivePopover",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Select",
    "sap/m/SegmentedButton",
    "sap/m/SegmentedButtonItem",
    "sap/m/List",
    "sap/m/CustomListItem",
    "sap/m/ObjectStatus",
    "sap/m/MessageStrip",
    "sap/m/Text",
    "sap/m/Label",
    "sap/m/BadgeCustomData",
    "sap/ui/core/Item",
    "sap/ui/core/Icon",
    "sap/ui/core/InvisibleMessage",
    "sap/ui/core/library",
    "sap/ui/core/format/DateFormat",
    "idts/bugmanagementui/ext/notification/NotificationClient"
], function (
    Toolbar,
    ToolbarSpacer,
    Button,
    ResponsivePopover,
    VBox,
    HBox,
    Select,
    SegmentedButton,
    SegmentedButtonItem,
    List,
    CustomListItem,
    ObjectStatus,
    MessageStrip,
    Text,
    Label,
    BadgeCustomData,
    Item,
    Icon,
    InvisibleMessage,
    coreLibrary,
    DateFormat,
    NotificationClient
) {
    "use strict";

    var HOST_ID = "idtsNotificationShellHost";
    var PAGE_SIZE = 25;
    var MAX_ROWS = 10000;
    var POLL_MS = 30000;
    var ButtonType = { Transparent: "Transparent" };
    var PlacementType = { Bottom: "Bottom" };
    var ValueState = { Information: "Information", Warning: "Warning", Error: "Error" };
    var instances = new WeakMap();
    var dateFormatter = DateFormat.getDateTimeInstance({ style: "short" });

    function text(bundle, key, args) {
        var value;
        try {
            value = bundle && typeof bundle.getText === "function" ? bundle.getText(key, args) : key;
        } catch {
            value = key;
        }
        return typeof value === "string" && value.trim() ? value : key;
    }

    function bundleFor(component) {
        var model = component && typeof component.getModel === "function" ? component.getModel("i18n") : null;
        return model && typeof model.getResourceBundle === "function" ? model.getResourceBundle() : null;
    }

    function currentVisibility() {
        return typeof document !== "undefined" && document.visibilityState === "visible";
    }

    function visibleCount(count) {
        var numeric = Number(count);
        if (!Number.isFinite(numeric) || numeric < 0) return "";
        if (numeric < 1) return "";
        return numeric > 99 ? "99+" : String(Math.floor(numeric));
    }

    function controlId(control) {
        return control && typeof control.getId === "function" ? control.getId() : undefined;
    }

    function safeDate(bundle, value) {
        if (!value) return text(bundle, "notificationUnknownTime");
        try {
            var date = new Date(value);
            return isNaN(date.getTime()) ? text(bundle, "notificationUnknownTime") : dateFormatter.format(date);
        } catch {
            return text(bundle, "notificationUnknownTime");
        }
    }

    function eventLabel(bundle, eventType) {
        var code = String(eventType || "").toUpperCase();
        var known = ["ASSIGNED", "NEED_MORE_INFORMATION", "REJECTED", "UPDATED", "OVERDUE", "CLOSED", "RESOLVED", "RETEST_REQUIRED", "REOPENED", "RESUBMITTED", "REASSIGNED", "RETEST_OWNER_CHANGED", "COMMENT_MENTIONED", "PRIORITY_ESCALATED", "SEVERITY_ESCALATED", "PENDING_ASSIGNMENT", "ASSIGNMENT_REMOVED", "OWNER_CHANGED", "CHANGE_ROLE", "REACTIVATE"];
        return known.indexOf(code) >= 0 ? text(bundle, "notificationEvent" + code) : text(bundle, "notificationEventOther");
    }

    function init(component) {
        var existing = instances.get(component);
        if (existing) return existing;

        var state = {
            component: component,
            model: component && typeof component.getModel === "function" ? component.getModel("notifications") : null,
            bundle: bundleFor(component),
            category: "ALL",
            readState: "ALL",
            skip: 0,
            rows: [],
            loading: false,
            hasMore: false,
            requestVersion: 0,
            countVersion: 0,
            destroyed: false,
            timer: null,
            lastCount: null,
            markAllThroughOccurredAt: null,
            controls: null
        };
        var instance = {
            refreshUnread: function () { return refreshUnread(state); },
            destroy: function () { destroy(state); }
        };
        state.instance = instance;
        instances.set(component, instance);
        // ResourceModel có thể trả Promise; không render i18n key thô trong lúc bundle chưa sẵn sàng.
        Promise.resolve(bundleFor(component)).then(function (bundle) {
            if (state.destroyed) return;
            state.bundle = bundle;
            state.controls = createControls(state);
            state.bell = state.controls.bell;
            state.popover = state.controls.popover;
            state.controls.toolbar.placeAt(document.getElementById(HOST_ID));
            bindVisibility(state);
            if (currentVisibility()) {
                startPolling(state);
                refreshUnread(state);
            }
        });
        return instance;
    }

    function createControls(state) {
        var bundle = state.bundle;
        var toolbar;
        var bell;
        var popover;
        var list;
        var badge = new BadgeCustomData({ value: "" });
        var loadingMessage = new MessageStrip({
            text: text(bundle, "notificationLoading"),
            type: "Information",
            showIcon: true,
            visible: false
        });
        var errorMessage = new MessageStrip({
            text: text(bundle, "notificationLoadFailed"),
            type: "Error",
            showIcon: true,
            visible: false
        });
        var emptyMessage = new MessageStrip({
            text: text(bundle, "notificationEmpty"),
            type: "Information",
            showIcon: true,
            visible: false
        });
        var retryButton = new Button({
            text: text(bundle, "notificationRetry"),
            type: ButtonType.Transparent,
            visible: false,
            press: function () { loadPage(state, true); }
        });
        var markAllButton = new Button({
            text: text(bundle, "notificationMarkAllRead"),
            type: ButtonType.Transparent,
            enabled: false,
            press: function () { markAll(state); }
        });
        var readFilter = new SegmentedButton({
            selectedKey: "ALL",
            width: "100%",
            selectionChange: function (event) {
                var source = event.getSource();
                state.readState = source.getSelectedKey();
                loadPage(state, true);
            },
            items: [
                new SegmentedButtonItem({ key: "ALL", text: text(bundle, "notificationFilterAll") }),
                new SegmentedButtonItem({ key: "UNREAD", text: text(bundle, "notificationFilterUnread") }),
                new SegmentedButtonItem({ key: "READ", text: text(bundle, "notificationFilterRead") })
            ]
        });
        var categoryFilter = new Select({
            selectedKey: "ALL",
            width: "100%",
            change: function (event) {
                var source = event.getSource();
                state.category = source.getSelectedKey();
                loadPage(state, true);
            },
            items: [
                new Item({ key: "ALL", text: text(bundle, "notificationCategoryAll") }),
                new Item({ key: "BUG", text: text(bundle, "notificationCategoryBug") }),
                new Item({ key: "ACCESS", text: text(bundle, "notificationCategoryAccess") })
            ]
        });
        list = new List({
            mode: "None",
            growing: false,
            showSeparators: "Inner",
            items: []
        });
        var loadMoreButton = new Button({
            text: text(bundle, "notificationLoadMore"),
            type: ButtonType.Transparent,
            visible: false,
            press: function () { loadPage(state, false); }
        });
        var filterLabels = new VBox({
            items: [
                new Label({ text: text(bundle, "notificationReadFilterLabel"), labelFor: controlId(readFilter) }),
                readFilter,
                new Label({ text: text(bundle, "notificationCategoryFilterLabel"), labelFor: controlId(categoryFilter) }),
                categoryFilter
            ]
        });
        var content = new VBox({
            width: "100%",
            items: [
                new Toolbar({ content: [new ToolbarSpacer(), markAllButton] }),
                filterLabels,
                loadingMessage,
                errorMessage,
                retryButton,
                emptyMessage,
                list,
                loadMoreButton
            ]
        });

        popover = new ResponsivePopover({
            title: text(bundle, "notificationPopoverTitle"),
            placement: PlacementType.Bottom,
            showHeader: true,
            contentWidth: "30rem",
            content: [content],
            afterClose: function () {
                if (state.lastFocus && typeof state.lastFocus.focus === "function") state.lastFocus.focus();
            }
        });
        bell = new Button({
            icon: "sap-icon://bell",
            text: "",
            customData: [badge],
            type: ButtonType.Transparent,
            tooltip: text(bundle, "notificationBellTooltip"),
            press: function (event) {
                state.lastFocus = event.getSource();
                popover.openBy(state.lastFocus);
                if (!state.rows.length && !state.loading) loadPage(state, true);
            }
        }).addStyleClass("sapUiLargeMarginEnd");
        bell.setTooltip(text(bundle, "notificationBellTooltip"));
        toolbar = new Toolbar({ content: [new ToolbarSpacer(), bell] });
        return {
            toolbar: toolbar,
            bell: bell,
            badge: badge,
            popover: popover,
            list: list,
            loadingMessage: loadingMessage,
            errorMessage: errorMessage,
            emptyMessage: emptyMessage,
            retryButton: retryButton,
            markAllButton: markAllButton,
            loadMoreButton: loadMoreButton
        };
    }

    function bindVisibility(state) {
        state.onVisibilityChange = function () {
            if (currentVisibility()) {
                startPolling(state);
                refreshUnread(state);
            } else {
                stopPolling(state);
            }
        };
        state.onWindowFocus = function () {
            if (currentVisibility()) refreshUnread(state);
        };
        state.onNotificationChange = function () {
            if (currentVisibility()) refreshUnread(state);
        };
        if (typeof document !== "undefined" && document.addEventListener) document.addEventListener("visibilitychange", state.onVisibilityChange);
        if (typeof window !== "undefined" && window.addEventListener) {
            window.addEventListener("focus", state.onWindowFocus);
            window.addEventListener("idts:notification-change", state.onNotificationChange);
        }
    }

    function startPolling(state) {
        if (state.destroyed || state.timer || typeof setInterval !== "function") return;
        state.timer = setInterval(function () {
            if (!state.destroyed && currentVisibility()) refreshUnread(state);
        }, POLL_MS);
    }

    function stopPolling(state) {
        if (state.timer && typeof clearInterval === "function") clearInterval(state.timer);
        state.timer = null;
    }

    function refreshUnread(state) {
        if (state.destroyed || !state.model || !state.bell) return Promise.resolve();
        var version = ++state.countVersion;
        return Promise.resolve()
            .then(function () { return NotificationClient.unreadCount(state.model); })
            .then(function (count) {
                if (state.destroyed || version !== state.countVersion) return;
                var display = visibleCount(count);
                state.controls.badge.setValue(display);
                state.bell.setTooltip(text(state.bundle, "notificationBellCountTooltip", [display || "0"]));
                if (state.lastCount !== count && display) announce(state.bundle, text(state.bundle, "notificationCountAnnouncement", [display]));
                state.lastCount = count;
            })
            .catch(function () {
                if (state.destroyed || version !== state.countVersion) return;
                state.controls.badge.setValue("");
                state.bell.setTooltip(text(state.bundle, "notificationBellTooltip"));
                state.lastCount = null;
            });
    }

    function announce(bundle, message) {
        try {
            var invisibleMessage = InvisibleMessage && typeof InvisibleMessage.getInstance === "function"
                ? InvisibleMessage.getInstance()
                : null;
            if (invisibleMessage && typeof invisibleMessage.announce === "function") invisibleMessage.announce(message, coreLibrary.InvisibleMessageMode.Polite);
        } catch {
            // Announcement là hỗ trợ accessibility; badge nhìn thấy vẫn giữ trạng thái chính.
        }
    }

    function loadPage(state, reset) {
        if (state.destroyed || !state.model || (state.loading && !reset)) return Promise.resolve();
        var version = ++state.requestVersion;
        if (reset) {
            state.skip = 0;
            state.rows = [];
            state.hasMore = false;
            state.markAllThroughOccurredAt = null;
            state.pendingSnapshot = new Date().toISOString();
            state.controls.list.removeAllItems();
        }
        state.loading = true;
        state.controls.errorMessage.setText(text(state.bundle, "notificationLoadFailed"));
        setStateVisibility(state, { loading: true, error: false, empty: false, retry: false });
        return Promise.resolve()
            .then(function () {
                return NotificationClient.search(state.model, {
                    category: state.category,
                    readState: state.readState,
                    skip: state.skip,
                    top: PAGE_SIZE
                });
            })
            .then(function (page) {
                if (state.destroyed || version !== state.requestVersion) return;
                var rows = Array.isArray(page) ? page : [];
                state.rows = state.rows.concat(rows);
                state.skip += rows.length;
                state.hasMore = rows.length === PAGE_SIZE && state.skip < MAX_ROWS;
                if (state.markAllThroughOccurredAt === null) state.markAllThroughOccurredAt = state.pendingSnapshot;
                state.loading = false;
                renderRows(state);
                setStateVisibility(state, { loading: false, error: false, empty: state.rows.length === 0, retry: false });
            })
            .catch(function () {
                if (state.destroyed || version !== state.requestVersion) return;
                state.loading = false;
                setStateVisibility(state, { loading: false, error: true, empty: false, retry: true });
            });
    }

    function setStateVisibility(state, values) {
        var controls = state.controls;
        controls.loadingMessage.setVisible(Boolean(values.loading));
        controls.errorMessage.setVisible(Boolean(values.error));
        controls.emptyMessage.setVisible(Boolean(values.empty));
        controls.retryButton.setVisible(Boolean(values.retry));
        controls.loadMoreButton.setVisible(!values.loading && !values.error && state.hasMore);
        controls.markAllButton.setEnabled(Boolean(state.markAllThroughOccurredAt && state.rows.length));
    }

    function renderRows(state) {
        var controls = state.controls;
        controls.list.removeAllItems();
        state.rows.forEach(function (row) {
            controls.list.addItem(createRowItem(state, row));
        });
    }

    function createRowItem(state, row) {
        var bundle = state.bundle;
        var unread = !row.readAt;
        var statusItems = [
            new Icon({
                src: row.category === "BUG" ? "sap-icon://bug" : "sap-icon://locked",
                decorative: false,
                tooltip: row.category === "BUG" ? text(bundle, "notificationCategoryBug") : text(bundle, "notificationCategoryAccess")
            }),
            new ObjectStatus({
                text: unread ? text(bundle, "notificationUnread") : text(bundle, "notificationRead"),
                state: unread ? ValueState.Information : "None"
            }),
            new ObjectStatus({
                text: row.actionRequired ? text(bundle, "notificationActionRequired") : "",
                state: ValueState.Warning,
                visible: Boolean(row.actionRequired)
            }),
            new ObjectStatus({ text: String(row.category || ""), state: "None" })
        ];
        return new CustomListItem({
            type: "Active",
            content: [new VBox({
                items: [
                    new HBox({ wrap: "Wrap", items: [statusItems[0], new Text({ text: String(row.title || ""), wrapping: true }), statusItems[1], statusItems[2], statusItems[3], new Text({ text: eventLabel(bundle, row.eventType), wrapping: true })] }),
                    new Text({ text: String(row.summary || ""), wrapping: true }),
                    new Text({ text: text(bundle, "notificationOccurredAt", [safeDate(bundle, row.occurredAt)]), wrapping: true })
                ]
            })],
            press: function () { openNotification(state, row); }
        });
    }

    function markAll(state) {
        if (state.destroyed || !state.model || !state.markAllThroughOccurredAt) return Promise.resolve();
        var snapshot = state.markAllThroughOccurredAt;
        state.controls.markAllButton.setEnabled(false);
        return Promise.resolve()
            .then(function () { return NotificationClient.markAllRead(state.model, snapshot); })
            .then(function () {
                if (state.destroyed) return;
                var now = new Date().toISOString();
                state.rows.forEach(function (row) {
                    if (!row.readAt && typeof row.occurredAt === "string" && row.occurredAt <= snapshot) row.readAt = now;
                });
                renderRows(state);
                setStateVisibility(state, { loading: false, error: false, empty: state.rows.length === 0, retry: false });
                return refreshUnread(state);
            })
            .catch(function () {
                if (state.destroyed) return;
                state.controls.errorMessage.setText(text(state.bundle, "notificationMarkAllFailed"));
                state.controls.errorMessage.setVisible(true);
                state.controls.markAllButton.setEnabled(Boolean(state.rows.length));
            });
    }

    function openNotification(state, row) {
        if (state.destroyed || !state.model) return;
        Promise.resolve()
            .then(function () { return NotificationClient.markRead(state.model, row); })
            .then(function (updated) {
                if (updated && updated.readAt) row.readAt = updated.readAt;
                renderRows(state);
                return refreshUnread(state);
            })
            .catch(function () { return refreshUnread(state); })
            .then(function () {
                if (state.destroyed) return;
                var safePath;
                try {
                    safePath = NotificationClient.safeTargetPath(row.targetPath);
                } catch {
                    safePath = null;
                }
                navigate(safePath);
            });
    }

    function navigate(targetPath) {
        if (!targetPath || typeof window === "undefined" || !window.location) return;
        var hashIndex = targetPath.indexOf("#");
        var pathname = hashIndex >= 0 ? targetPath.slice(0, hashIndex) : targetPath;
        if (pathname !== "/idtsbugmanagementui/index.html") return;
        window.location.hash = hashIndex >= 0 ? targetPath.slice(hashIndex) : "";
    }

    function destroy(state) {
        if (state.destroyed) return;
        state.destroyed = true;
        state.countVersion += 1;
        state.requestVersion += 1;
        stopPolling(state);
        if (typeof document !== "undefined" && document.removeEventListener) document.removeEventListener("visibilitychange", state.onVisibilityChange);
        if (typeof window !== "undefined" && window.removeEventListener) {
            window.removeEventListener("focus", state.onWindowFocus);
            window.removeEventListener("idts:notification-change", state.onNotificationChange);
        }
        if (state.popover && typeof state.popover.destroy === "function") state.popover.destroy();
        if (state.controls && state.controls.toolbar && typeof state.controls.toolbar.destroy === "function") state.controls.toolbar.destroy();
        instances.delete(state.component);
    }

    return { init: init };
});
