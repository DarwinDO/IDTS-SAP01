sap.ui.define(["sap/ui/core/format/DateFormat"], function (DateFormat) {
	"use strict";

	const oDateTimeFormat = DateFormat.getDateTimeInstance({ style: "medium" });

	return {
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
