/**
 * Dùng chung việc gọi review action và cập nhật state cho các dialog AI.
 * Backend vẫn là nơi xác thực reviewer và quyết định trạng thái hợp lệ.
 */
sap.ui.define([
    "sap/m/MessageBox",
    "sap/ui/core/format/DateFormat"
], function (MessageBox, DateFormat) {
    "use strict";

    var REVIEW_DATE_FORMAT = DateFormat.getDateTimeInstance({ style: "medium/short" });

    function requestResult(operation) {
        var resultContext = operation.getBoundContext && operation.getBoundContext();
        return resultContext && typeof resultContext.requestObject === "function"
            ? resultContext.requestObject()
            : Promise.resolve(null);
    }

    function stateFor(code) {
        if (code === "ACCEPTED") {
            return "Success";
        }
        if (code === "REJECTED") {
            return "Error";
        }
        return code === "IGNORED" ? "None" : "Information";
    }

    function reviewedAtText(value) {
        var date = value ? new Date(value) : null;
        return date && !Number.isNaN(date.getTime()) ? REVIEW_DATE_FORMAT.format(date) : "";
    }

    function submit(model, state, actionName, getText) {
        // Chỉ gửi audit ID; UI không PATCH Bug hoặc AiSuggestions trực tiếp.
        var suggestionID = state.getProperty("/suggestionID");
        if (!suggestionID || !state.getProperty("/reviewActionEnabled")) {
            return Promise.resolve(null);
        }

        state.setProperty("/busy", true);
        state.setProperty("/reviewActionEnabled", false);
        var operation = model.bindContext("/" + actionName + "(...)", undefined, { $$ownRequest: true });
        operation.setParameter("suggestionID", suggestionID);

        return operation.invoke("$direct")
            .then(function () {
                return requestResult(operation);
            })
            .then(function (result) {
                if (!result || !result.reviewStateCode) {
                    throw new Error("Review result is unavailable.");
                }
                state.setProperty("/reviewStateText", result.reviewStateName || result.reviewStateCode);
                state.setProperty("/reviewStateState", stateFor(result.reviewStateCode));
                state.setProperty("/reviewedByText", getText("aiSuggestionReviewedBy", [
                    result.reviewedByDisplayName || "",
                    reviewedAtText(result.reviewedAt)
                ]));
                return result;
            })
            .catch(function () {
                MessageBox.error(getText("aiSuggestionReviewFailed"));
                return null;
            })
            .finally(function () {
                state.setProperty("/busy", false);
            });
    }

    return {
        submit: submit
    };
});
