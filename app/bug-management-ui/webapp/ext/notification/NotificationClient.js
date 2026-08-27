/** Client inbox chỉ gọi OData model có sẵn; CAP quyết định caller và quyền dữ liệu. */
sap.ui.define([], function () {
    "use strict";
    var UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
    var TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,7})?Z$/;
    var LANDING = "/idtsbugmanagementui/index.html";
    var BUG_TARGET = /^\/idtsbugmanagementui\/index\.html#\/Bugs\(ID=[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12},IsActiveEntity=true\)$/i;

    function timestamp(value) {
        return typeof value === "string" && TIMESTAMP.test(value) && Number.isFinite(Date.parse(value));
    }
    async function call(model, name, parameters) {
        var binding;
        try {
            binding = model.bindContext("/" + name + "(...)");
            Object.keys(parameters || {}).forEach(function (key) { binding.setParameter(key, parameters[key]); });
            // Chờ operation thật hoàn tất trước khi đọc result; không tự fetch/token/CSRF.
            var invokedContext = await binding.invoke("$direct");
            var resultContext = invokedContext || binding.getBoundContext();
            if (!resultContext || typeof resultContext.requestObject !== "function") {
                throw new Error("INVALID_NOTIFICATION_RESPONSE");
            }
            return await resultContext.requestObject();
        } catch (error) {
            var safeError = new Error("NOTIFICATION_REQUEST_FAILED");
            safeError.status = Number(error.status || error.statusCode) || 0;
            throw safeError;
        } finally {
            if (binding) { binding.destroy(); }
        }
    }
    function count(result) {
        if (!result || !Number.isInteger(result.count) || result.count < 0) { throw new Error("INVALID_NOTIFICATION_RESPONSE"); }
        return result.count;
    }
    return {
        search: async function (model, options) {
            options = options || {};
            var query = {
                category: options.category === undefined ? "ALL" : options.category,
                readState: options.readState === undefined ? "ALL" : options.readState,
                skip: options.skip === undefined ? 0 : options.skip,
                top: options.top === undefined ? 25 : options.top
            };
            if (["ALL", "BUG", "ACCESS"].indexOf(query.category) < 0 ||
                ["ALL", "UNREAD", "READ"].indexOf(query.readState) < 0 ||
                !Number.isInteger(query.skip) || query.skip < 0 || query.skip > 10000 ||
                !Number.isInteger(query.top) || query.top < 1 || query.top > 100) {
                throw new Error("INVALID_NOTIFICATION_PAGE");
            }
            var result = await call(model, "searchMyNotifications", query);
            var rows = Array.isArray(result) ? result : result && result.value;
            if (!Array.isArray(rows)) { throw new Error("INVALID_NOTIFICATION_RESPONSE"); }
            // Giữ nguyên thứ tự server, không sort hoặc aggregate lại trên browser.
            return rows;
        },
        unreadCount: async function (model) { return count(await call(model, "getMyUnreadNotificationCount")); },
        markRead: async function (model, row) {
            if (!row || typeof row.notificationID !== "string" || !UUID.test(row.notificationID) || !timestamp(row.modifiedAt)) {
                throw new Error("INVALID_NOTIFICATION_VERSION");
            }
            return call(model, "markMyNotificationRead", { notificationID: row.notificationID, expectedModifiedAt: row.modifiedAt });
        },
        markAllRead: async function (model, throughOccurredAt) {
            if (!timestamp(throughOccurredAt)) { throw new Error("INVALID_NOTIFICATION_SNAPSHOT"); }
            return count(await call(model, "markAllMyNotificationsRead", { throughOccurredAt: throughOccurredAt }));
        },
        safeTargetPath: function (target) {
            // Chỉ cho landing/active Bug cùng ứng dụng; không normalize URL lạ thành route hợp lệ.
            if (typeof target !== "string" || /[\r\n]/.test(target)) { return null; }
            return target === LANDING || BUG_TARGET.test(target) ? target : null;
        }
    };
});
