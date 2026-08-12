sap.ui.define(["sap/ui/core/format/DateFormat"], function (DateFormat) {
	"use strict";

	const oDateTimeFormat = DateFormat.getDateTimeInstance({ style: "medium" });

	return {
		statusState: function (sStatus) {
			return ({
				ACTIVE: "Success",
				FAILED: "Error",
				PROVISIONING: "Warning",
				IDENTITY_VERIFIED: "Information",
				INVITED: "Information"
			})[sStatus] || "None";
		},

		dateTime: function (sValue) {
			return sValue ? oDateTimeFormat.format(new Date(sValue)) : "";
		}
	};
});
