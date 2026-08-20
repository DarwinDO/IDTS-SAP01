sap.ui.define([
	"./BaseController",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function (BaseController, Fragment, JSONModel, MessageBox, MessageToast) {
	"use strict";

	return BaseController.extend("idts.useradministrationui.controller.Main", {
		onInit: function () {
			this.setModel(new JSONModel({ busy: false }), "view");
			this.setModel(new JSONModel(this._emptyInvite()), "invite");
			this.setModel(new JSONModel(this._emptyAccessChange()), "access");
			this.setModel(new JSONModel(this._emptyDeveloperAdministration()), "developer");
			this.setModel(new JSONModel({ loaded: false }), "catalogs");
			this.setModel(new JSONModel({ items: [] }), "requests");
		},

		onAfterRendering: function () {
			if (this._initialRequestsStarted) {
				return;
			}
			this._initialRequestsStarted = true;
			this._loadInitialRequests();
		},

		_loadInitialRequests: async function () {
			await this._loadRequests("");
		},

		onSearch: async function (oEvent) {
			await this._loadRequests(oEvent.getParameter("query") || "");
		},

		onOpenInvite: async function () {
			await this._ensureDeveloperCatalogs();
			this.getModel("invite").setData(this._emptyInvite());
			if (!this._inviteDialog) {
				this._inviteDialog = await Fragment.load({
					id: this.getView().getId(),
					name: "idts.useradministrationui.fragment.InviteUser",
					controller: this
				});
				this.getView().addDependent(this._inviteDialog);
			}
			this._inviteDialog.open();
		},

		onInviteFieldChange: function (oEvent) {
			const oInviteModel = this.getModel("invite");
			const sValue = oEvent?.getParameter?.("value");
			if (typeof sValue === "string") {
				oInviteModel.setProperty("/email", sValue);
				oInviteModel.setProperty("/emailTouched", true);
			}
			this._updateInviteState();
		},

		onRoleChange: function (oEvent) {
			const sRole = oEvent.getSource().getSelectedKey();
			const oInviteModel = this.getModel("invite");
			oInviteModel.setProperty("/role", sRole);
			if (sRole !== "PM") {
				oInviteModel.setProperty("/userAdminRequested", false);
			}
			if (sRole === "DEVELOPER" && !oInviteModel.getProperty("/developerProfile")) {
				oInviteModel.setProperty("/developerProfile", this._emptyDeveloperProfile());
			}
			this._updateInviteState();
		},

		onConfirmInvite: async function () {
			const oInvite = this.getModel("invite").getData();
			if (oInvite.submitting) return;
			if (!this._isValidEmail(oInvite.email)) {
				this.getModel("invite").setProperty("/emailTouched", true);
				this._updateInviteState();
				MessageBox.warning(await this._text("invalidEmail"));
				return;
			}

			this.getModel("view").setProperty("/busy", true);
			this.getModel("invite").setProperty("/submitting", true);
			try {
				const oOperation = this.getView().getModel().bindContext("/requestOnboarding(...)");
				oOperation.setParameter("email", oInvite.email.trim());
				oOperation.setParameter("requestedRole", oInvite.role);
				oOperation.setParameter("userAdminRequested", oInvite.role === "PM" && oInvite.userAdminRequested === true);
				oOperation.setParameter("developerProfile", this._developerProfileForRole(oInvite.role, oInvite.developerProfile));
				await oOperation.invoke("$direct");
				this._inviteDialog.close();
				this.getModel("invite").setData(this._emptyInvite());
				await this._loadRequests("");
				MessageToast.show(await this._text("invitationQueued"));
			} catch {
				MessageBox.error(await this._text("invitationFailed"));
			} finally {
				this.getModel("invite").setProperty("/submitting", false);
				this.getModel("view").setProperty("/busy", false);
			}
		},

		onCancelInvite: function () {
			this._inviteDialog.close();
			this.getModel("invite").setData(this._emptyInvite());
		},

		onApproveProvisioning: async function (oEvent) {
			const oRow = this._rowFromEvent(oEvent);
			if (!oRow || !await this._confirm("approveConfirmation")) {
				return;
			}
			await this._invokeAction("approveProvisioning", {
				requestID: oRow.ID,
				expectedVersion: oRow.provisioningVersion
			}, "approvedQueued");
		},

		onOpenRoleChange: async function (oEvent) {
			const oRow = this._rowFromEvent(oEvent);
			if (!oRow) {
				return;
			}
			await this._ensureDeveloperCatalogs();
			const oDeveloperProfile = oRow.requestedRole_code === "DEVELOPER"
				? await this._readDeveloperProfile(oRow.activeUser_ID)
				: this._emptyDeveloperProfile();
			await this._openAccessDialog({
				mode: "CHANGE_ROLE",
				title: await this._text("changeRole"),
				confirmText: await this._text("changeRole"),
				warning: await this._text("roleChangeWarning"),
				row: oRow,
				role: oRow.requestedRole_code,
				userAdminRequested: oRow.userAdminRequested === true,
				developerProfile: oDeveloperProfile
			});
		},

		onOpenRevoke: async function (oEvent) {
			const oRow = this._rowFromEvent(oEvent);
			if (!oRow) {
				return;
			}
			await this._openAccessDialog({
				mode: "REVOKE",
				title: await this._text("revokeAccess"),
				confirmText: await this._text("revokeAccess"),
				warning: await this._text("revokeWarning"),
				row: oRow,
				role: oRow.requestedRole_code,
				userAdminRequested: oRow.userAdminRequested === true
			});
		},

		onAccessRoleChange: function (oEvent) {
			const sRole = oEvent.getSource().getSelectedKey();
			const oAccessModel = this.getModel("access");
			oAccessModel.setProperty("/role", sRole);
			if (sRole !== "PM") {
				oAccessModel.setProperty("/userAdminRequested", false);
			}
			if (sRole === "DEVELOPER" && !oAccessModel.getProperty("/developerProfile")) {
				oAccessModel.setProperty("/developerProfile", this._emptyDeveloperProfile());
			}
		},

		onConfirmAccessChange: async function () {
			const oAccessModel = this.getModel("access");
			const oAccess = oAccessModel.getData();
			const sReason = (oAccess.reason || "").trim();
			if (!sReason) {
				MessageBox.warning(await this._text("reasonRequired"));
				return;
			}
			oAccessModel.setProperty("/submitting", true);
			const bRoleChange = oAccess.mode === "CHANGE_ROLE";
			const bSuccess = await this._invokeAction(bRoleChange ? "requestRoleChange" : "requestRevoke", bRoleChange ? {
				userID: oAccess.row.activeUser_ID,
				requestedRole: oAccess.role,
				userAdminRequested: oAccess.role === "PM" && oAccess.userAdminRequested === true,
				developerProfile: this._developerProfileForRole(oAccess.role, oAccess.developerProfile),
				reason: sReason,
				expectedVersion: oAccess.row.provisioningVersion
			} : {
				userID: oAccess.row.activeUser_ID,
				reason: sReason,
				expectedVersion: oAccess.row.provisioningVersion
			}, bRoleChange ? "changeRoleQueued" : "revokeQueued");
			oAccessModel.setProperty("/submitting", false);
			if (bSuccess) {
				this._accessDialog.close();
				oAccessModel.setData(this._emptyAccessChange());
			}
		},

		onCancelAccessChange: function () {
			this._accessDialog.close();
			this.getModel("access").setData(this._emptyAccessChange());
		},

		onRetryAccessOperation: async function (oEvent) {
			const oRow = this._rowFromEvent(oEvent);
			if (!oRow || !oRow.latestOperation_ID || !await this._confirm("retryConfirmation")) {
				return;
			}
			await this._invokeAction("retryAccessOperation", {
				operationID: oRow.latestOperation_ID,
				expectedVersion: oRow.provisioningVersion
			}, "retryQueued");
		},

		onReconcileAccessOperation: async function (oEvent) {
			const oRow = this._rowFromEvent(oEvent);
			if (!oRow || !oRow.latestOperation_ID || !await this._confirm("reconcileConfirmation")) {
				return;
			}
			await this._invokeAction("reconcileAccessOperation", {
				operationID: oRow.latestOperation_ID,
				expectedVersion: oRow.provisioningVersion
			}, "reconcileQueued");
		},

		onOpenDeveloperProfile: async function (oEvent) {
			const oRow = this._rowFromEvent(oEvent);
			if (!oRow?.activeUser_ID) return;
			await this._ensureDeveloperCatalogs();
			try {
				const oProfile = await this._readDeveloperProfile(oRow.activeUser_ID);
				this.getModel("developer").setData({
					...this._emptyDeveloperAdministration(),
					userID: oRow.activeUser_ID,
					expectedVersion: oProfile.administrationVersion,
					openBugImpactCount: oProfile.openBugImpactCount,
					developerProfile: oProfile
				});
				if (!this._developerDialog) {
					this._developerDialog = await Fragment.load({
						id: this.getView().getId(),
						name: "idts.useradministrationui.fragment.ManageDeveloperProfile",
						controller: this
					});
					this.getView().addDependent(this._developerDialog);
				}
				this._developerDialog.open();
			} catch {
				MessageBox.error(await this._text("developerProfileLoadFailed"));
			}
		},

		onConfirmDeveloperProfile: async function () {
			const oData = this.getModel("developer").getData();
			if (!(oData.reason || "").trim()) {
				MessageBox.warning(await this._text("reasonRequired"));
				return;
			}
			const bSuccess = await this._invokeAction("updateDeveloperProfile", {
				userID: oData.userID,
				desiredProfile: this._developerProfileForRole("DEVELOPER", oData.developerProfile),
				reason: oData.reason.trim(),
				expectedVersion: oData.expectedVersion
			}, "developerProfileUpdated");
			if (bSuccess) this._developerDialog.close();
		},

		onCancelDeveloperProfile: function () { this._developerDialog.close(); },
		onAddInviteResponsibility: function () { this._addResponsibility("invite"); },
		onRemoveInviteResponsibility: function (oEvent) { this._removeResponsibility("invite", oEvent); },
		onAddAccessResponsibility: function () { this._addResponsibility("access"); },
		onRemoveAccessResponsibility: function (oEvent) { this._removeResponsibility("access", oEvent); },
		onAddDeveloperResponsibility: function () { this._addResponsibility("developer"); },
		onRemoveDeveloperResponsibility: function (oEvent) { this._removeResponsibility("developer", oEvent); },

		_updateInviteState: function () {
			const oInviteModel = this.getModel("invite");
			const oInvite = oInviteModel.getData();
			const bEmailValid = this._isValidEmail(oInvite.email);
			oInviteModel.setProperty("/emailValid", bEmailValid);
			const bDeveloperReady = oInvite.role !== "DEVELOPER" || this._hasDeveloperResponsibility(oInvite.developerProfile);
			oInviteModel.setProperty("/canSubmit", bEmailValid && bDeveloperReady && ["PM", "TESTER", "DEVELOPER"].includes(oInvite.role));
		},

		_isValidEmail: function (sEmail) {
			return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((sEmail || "").trim());
		},

		_emptyInvite: function () {
			return {
				email: "",
				role: "TESTER",
				userAdminRequested: false,
				emailTouched: false,
				emailValid: false,
				canSubmit: false,
				submitting: false,
				developerProfile: this._emptyDeveloperProfile()
			};
		},

		_emptyAccessChange: function () {
			return {
				mode: "",
				title: "",
				confirmText: "",
				warning: "",
				row: null,
				role: "TESTER",
				userAdminRequested: false,
				reason: "",
				submitting: false,
				developerProfile: this._emptyDeveloperProfile()
			};
		},

		_emptyDeveloperProfile: function () {
			return {
				availabilityStatusCode: "AVAILABLE",
				workloadLimit: 3,
				responsibilities: [{ componentCategoryID: "", sapModuleID: null, responsibilityLevelCode: "PRIMARY", active: true }]
			};
		},

		_emptyDeveloperAdministration: function () {
			return { userID: null, expectedVersion: 0, openBugImpactCount: 0, reason: "", developerProfile: this._emptyDeveloperProfile() };
		},

		_developerProfileForRole: function (sRole, oProfile) {
			if (sRole !== "DEVELOPER") return null;
			return {
				availabilityStatusCode: oProfile.availabilityStatusCode,
				workloadLimit: Number(oProfile.workloadLimit),
				responsibilities: (oProfile.responsibilities || []).filter(oRow => oRow.active !== false).map(oRow => ({
					componentCategoryID: oRow.componentCategoryID,
					sapModuleID: oRow.sapModuleID || null,
					responsibilityLevelCode: oRow.responsibilityLevelCode || "PRIMARY"
				}))
			};
		},

		_hasDeveloperResponsibility: function (oProfile) {
			return !!oProfile && Number(oProfile.workloadLimit) > 0 && (oProfile.responsibilities || []).some(oRow => oRow.active !== false && oRow.componentCategoryID);
		},

		_addResponsibility: function (sModel) {
			const oModel = this.getModel(sModel);
			const sPath = "/developerProfile/responsibilities";
			const aRows = oModel.getProperty(sPath) || [];
			oModel.setProperty(sPath, aRows.concat({ componentCategoryID: "", sapModuleID: null, responsibilityLevelCode: "PRIMARY", active: true }));
			if (sModel === "invite") this._updateInviteState();
		},

		_removeResponsibility: function (sModel, oEvent) {
			const oModel = this.getModel(sModel);
			const sPath = "/developerProfile/responsibilities";
			const iIndex = Number(oEvent.getSource().getBindingContext(sModel).getPath().split("/").pop());
			const aRows = (oModel.getProperty(sPath) || []).slice();
			aRows.splice(iIndex, 1);
			oModel.setProperty(sPath, aRows);
			if (sModel === "invite") this._updateInviteState();
		},

		_readDeveloperProfile: async function (sUserID) {
			const oOperation = this.getView().getModel().bindContext("/readDeveloperProfile(...)");
			oOperation.setParameter("userID", sUserID);
			const oContext = await oOperation.invoke("$direct");
			return (oContext || oOperation.getBoundContext()).requestObject();
		},

		_ensureDeveloperCatalogs: async function () {
			if (this.getModel("catalogs").getProperty("/loaded")) return;
			const oODataModel = this.getView().getModel();
			const load = async (sPath, mParameters) => (await oODataModel.bindList(sPath, null, null, null, mParameters).requestContexts(0, 200)).map(oContext => oContext.getObject());
			const [aAvailability, aLevels, aModules, aCategories] = await Promise.all([
				load("/AvailabilityStatuses", { $filter: "active eq true" }),
				load("/ResponsibilityLevels", { $filter: "active eq true" }),
				load("/SAPModules", { $filter: "active eq true" }),
				load("/ComponentCategories", { $filter: "active eq true", $expand: "component,defectCategory" })
			]);
			const sAnySapModule = await this._text("anySapModule");
			this.getModel("catalogs").setData({
				loaded: true,
				availabilityStatuses: aAvailability,
				responsibilityLevels: aLevels,
				sapModules: [{ ID: "", name: sAnySapModule }, ...aModules],
				componentCategories: aCategories.map(oRow => ({ ...oRow, label: `${oRow.component?.name || ""} — ${oRow.defectCategory?.name || ""}` }))
			});
		},

		_openAccessDialog: async function (oData) {
			this.getModel("access").setData({ ...this._emptyAccessChange(), ...oData });
			if (!this._accessDialog) {
				this._accessDialog = await Fragment.load({
					id: this.getView().getId(),
					name: "idts.useradministrationui.fragment.ManageAccess",
					controller: this
				});
				this.getView().addDependent(this._accessDialog);
			}
			this._accessDialog.open();
		},

		_invokeAction: async function (sAction, mParameters, sSuccessTextKey) {
			this.getModel("view").setProperty("/busy", true);
			try {
				const oOperation = this.getView().getModel().bindContext(`/${sAction}(...)`);
				Object.entries(mParameters).forEach(([sName, vValue]) => oOperation.setParameter(sName, vValue));
				await oOperation.invoke("$direct");
				await this._loadRequests("");
				MessageToast.show(await this._text(sSuccessTextKey));
				return true;
			} catch {
				MessageBox.error(await this._text("accessChangeFailed"));
				return false;
			} finally {
				this.getModel("view").setProperty("/busy", false);
			}
		},

		_confirm: async function (sTextKey) {
			const sText = await this._text(sTextKey);
			return new Promise(resolve => MessageBox.confirm(sText, {
				onClose: sAction => resolve(sAction === MessageBox.Action.OK)
			}));
		},

		_rowFromEvent: function (oEvent) {
			return oEvent?.getSource?.().getBindingContext("requests")?.getObject?.() || null;
		},

		_loadRequests: async function (sQuery) {
			const sNormalizedQuery = (sQuery || "").trim().toLowerCase();
			const iRequest = (this._searchRequest || 0) + 1;
			this._searchRequest = iRequest;
			this.getModel("view").setProperty("/busy", true);
			try {
				const oOperation = this.getView().getModel().bindContext("/searchOnboarding(...)");
				oOperation.setParameter("query", sNormalizedQuery);
				const oResultContext = await oOperation.invoke("$direct");
				const oResult = await (oResultContext || oOperation.getBoundContext()).requestObject();
				const aItems = Array.isArray(oResult) ? oResult : (oResult?.value || []);
				if (iRequest === this._searchRequest) {
					this.getModel("requests").setProperty("/items", aItems);
				}
			} catch {
				if (iRequest === this._searchRequest) {
					MessageBox.error(await this._text("requestListFailed"));
				}
			} finally {
				if (iRequest === this._searchRequest) {
					this.getModel("view").setProperty("/busy", false);
				}
			}
		},

		_text: async function (sKey) {
			const oBundle = await this.getResourceBundle();
			return oBundle.getText(sKey);
		}
	});
});
