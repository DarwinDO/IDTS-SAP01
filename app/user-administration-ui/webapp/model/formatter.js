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
				BLOCKED_MANUAL_REVIEW: "Error",
				SUCCEEDED: "Success"
			})[sState] || "None";
		},

		operationStateText: function (sState) {
			return ({
				PENDING: "Pending",
				PROCESSING: "In progress",
				RETRYABLE_FAILURE: "Retry needed",
				BLOCKED_MANUAL_REVIEW: "Manual review",
				SUCCEEDED: "Completed"
			})[sState] || "Unknown";
		},

		operationTypeText: function (sType, sProvision, sChangeRole, sRevoke, sReactivate, sLinkExisting) {
			return ({
				PROVISION: sProvision,
				CHANGE_ROLE: sChangeRole,
				REVOKE: sRevoke,
				REACTIVATE: sReactivate,
				LINK_EXISTING: sLinkExisting
			})[sType] || sType || "Unknown";
		},

		auditActionText: function (sAction, sProvision, sChangeRole, sRevoke, sReactivate, sLinkExisting, sSuspend, sReactivateRequest, sRetryDelivery, sRetryAccess, sReconcileAccess) {
			return ({
				PROVISION: sProvision,
				CHANGE_ROLE: sChangeRole,
				REVOKE: sRevoke,
				REACTIVATE: sReactivate,
				LINK_EXISTING: sLinkExisting,
				REQUEST_SUSPEND: sSuspend,
				REQUEST_REACTIVATE: sReactivateRequest,
				RETRY_ONBOARDING_DELIVERY: sRetryDelivery,
				RETRY_ACCESS_OPERATION: sRetryAccess,
				RECONCILE_ACCESS_OPERATION: sReconcileAccess
			})[sAction] || sAction || "Unknown";
		},

		resultText: function (sResult, sQueued, sApplied, sRetryable, sRejected) {
			return ({
				QUEUED: sQueued,
				APPLIED: sApplied,
				NOOP_ALREADY_DESIRED: sApplied,
				RETRYABLE_FAILURE: sRetryable,
				PERMANENT_FAILURE: sRejected,
				CONFLICT: sRejected
			})[sResult] || sResult || "Unknown";
		},

		statusText: function (sStatus, sPending, sFailed, sSent, sSkipped, sUnknown) {
			return ({
				PENDING: sPending,
				FAILED: sFailed,
				SENT: sSent,
				SKIPPED: sSkipped
			})[sStatus] || sUnknown || "Unknown";
		},

		readinessText: function (sState, sLabel, sAvailable, sUnavailable, sRecentSuccess, sStale, sUnknown) {
			const sText = ({ AVAILABLE: sAvailable, UNAVAILABLE: sUnavailable, RECENT_SUCCESS: sRecentSuccess, STALE: sStale, UNKNOWN: sUnknown })[sState] || sUnknown || "Unknown";
			return `${sLabel || "Readiness"}: ${sText}`;
		},

		readinessState: function (sState) {
			return ({ AVAILABLE: "Success", RECENT_SUCCESS: "Success", UNAVAILABLE: "Error", STALE: "Warning" })[sState] || "None";
		},

		readinessLastSuccess: function (sValue, sLabel) {
			return sValue ? `${sLabel || "Last successful reconciliation"}: ${oDateTimeFormat.format(new Date(sValue))}` : `${sLabel || "Last successful reconciliation"}: —`;
		},

		availabilityState: function (iCriticality) {
			return ({ 1: "Error", 2: "Warning", 3: "Success" })[Number(iCriticality)] || "None";
		},

		workloadOpenLimit: function (iOpen, iLimit) {
			const sOpen = Number.isFinite(Number(iOpen)) ? Number(iOpen) : 0;
			const sLimit = iLimit === null || iLimit === undefined || iLimit === "" ? "—" : Number(iLimit);
			return `${sOpen} / ${Number.isFinite(Number(sLimit)) ? Number(sLimit) : "—"}`;
		},

		workloadReadinessText: function (bReady, sReady, sNeedsAttention, sLabel) {
			const sState = bReady === true ? sReady || "Ready" : sNeedsAttention || "Needs attention";
			return sLabel ? `${sLabel}: ${sState}` : sState;
		},

		workloadReadinessState: function (bReady) {
			return bReady === true ? "Success" : "Warning";
		},

		workloadCountState: function (iCount) {
			return Number(iCount) > 0 ? "Warning" : "None";
		},

		workloadStateText: function (bOverloaded, iOverdue, sOverloaded, sOverdue, sWithinLimit) {
			if (bOverloaded === true) return sOverloaded || "Overloaded";
			if (Number(iOverdue) > 0) return sOverdue || "Overdue";
			return sWithinLimit || "Within limit";
		},

		workloadState: function (bOverloaded, iOverdue, bActive) {
			if (bOverloaded === true) return "Error";
			if (Number(iOverdue) > 0) return "Warning";
			return bActive === false ? "None" : "Success";
		},

		workloadDetailsTitle: function (sDeveloperName, sLabel) {
			return sDeveloperName ? `${sLabel || "Developer workload"}: ${sDeveloperName}` : (sLabel || "Developer workload");
		},

		statusState: function (sStatus) {
			return ({
				ACTIVE: "Success",
				FAILED: "Error",
				SENT: "Success",
				SUCCEEDED: "Success",
				PENDING: "Warning",
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
