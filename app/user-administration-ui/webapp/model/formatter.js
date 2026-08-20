sap.ui.define(["sap/ui/core/format/DateFormat"], function (DateFormat) {
	"use strict";

	const oDateTimeFormat = DateFormat.getDateTimeInstance({ style: "medium" });

	return {
		accessStateText: function (sState, sActive, sSuspended, sRevoked, sIncomplete) {
			return ({
				ACTIVE: sActive,
				SUSPENDED: sSuspended,
				REVOKED: sRevoked,
				INCOMPLETE: sIncomplete
			})[sState] || sIncomplete || "Needs review";
		},

		accessStateState: function (sState) {
			return ({
				ACTIVE: "Success",
				SUSPENDED: "Warning",
				REVOKED: "None",
				INCOMPLETE: "Error"
			})[sState] || "None";
		},

		booleanText: function (bValue, sYes, sNo) {
			return bValue === true ? sYes || "Yes" : sNo || "No";
		},

		booleanState: function (bValue) {
			return bValue === true ? "Success" : "None";
		},

		developerReadyText: function (bValue, sReady, sNeedsAttention) {
			return bValue === true ? sReady || "Ready" : sNeedsAttention || "Needs attention";
		},

		pendingOperationText: function (sState, sNone, sPending, sInProgress, sRetryNeeded, sManualReview) {
			return ({
				PENDING: sPending,
				PROCESSING: sInProgress,
				RETRYABLE_FAILURE: sRetryNeeded,
				BLOCKED_MANUAL_REVIEW: sManualReview
			})[sState] || sNone || "None";
		},

		operationState: function (sState) {
			return ({
				PENDING: "Warning",
				PROCESSING: "Information",
				RETRYABLE_FAILURE: "Warning",
				BLOCKED_MANUAL_REVIEW: "Error"
			})[sState] || "None";
		},

		statusState: function (sStatus) {
			return ({
				ACTIVE: "Success",
				FAILED: "Error",
				RETRYABLE_FAILURE: "Warning",
				BLOCKED_MANUAL_REVIEW: "Error",
				PENDING_APPROVAL: "Information",
				PROVISION_QUEUED: "Warning",
				PROVISIONING: "Warning",
				ROLE_CHANGE_QUEUED: "Warning",
				ROLE_CHANGING: "Warning",
				REVOKE_QUEUED: "Warning",
				REVOKING: "Warning",
				REVOKED: "None",
				IDENTITY_VERIFIED: "Information",
				INVITED: "Information"
			})[sStatus] || "None";
		},

		dateTime: function (sValue) {
			return sValue ? oDateTimeFormat.format(new Date(sValue)) : "";
		}
	};
});
