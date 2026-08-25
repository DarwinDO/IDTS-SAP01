sap.ui.define([
	"./BaseController",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function (BaseController, Fragment, JSONModel, MessageBox, MessageToast) {
	"use strict";

	const CATALOG_CONFIG = Object.freeze({
		SAP_MODULE: { entity: "CatalogSAPModules", fields: ["code", "name"] },
		APPLICATION_COMPONENT: { entity: "CatalogApplicationComponents", fields: ["code", "name", "componentType"] },
		DEFECT_CATEGORY: { entity: "CatalogDefectCategories", fields: ["code", "name", "categoryType"] },
		COMPONENT_CATEGORY: { entity: "CatalogComponentCategories", fields: ["component_ID", "defectCategory_ID"] }
	});

	return BaseController.extend("idts.useradministrationui.controller.Main", {
		onInit: function () {
			const oSessionState = this._readActiveUsersSessionState();
			this.setModel(new JSONModel({
				busy: false,
				selectedTab: oSessionState.selectedTab,
				selectedAccessTab: oSessionState.selectedAccessTab,
				selectedDeveloperTab: oSessionState.selectedDeveloperTab,
				selectedOperationsTab: oSessionState.selectedOperationsTab
			}), "view");
			this.setModel(new JSONModel(this._emptyInvite()), "invite");
			this.setModel(new JSONModel(this._emptyAccessChange()), "access");
			this.setModel(new JSONModel(this._emptyAccessLifecycle()), "lifecycle");
			this.setModel(new JSONModel(this._emptyExistingIdentityLink()), "existingLink");
			this.setModel(new JSONModel(this._emptyDeveloperAdministration()), "developer");
			this.setModel(new JSONModel({
				availabilityStatuses: [],
				responsibilityLevels: [],
				sapModules: [],
				componentCategories: [],
				loaded: false,
				busy: false,
				error: false
			}), "developerCatalogs");
			this.setModel(new JSONModel({
				selectedType: "SAP_MODULE",
				allItems: [],
				items: [],
				query: "",
				includeInactive: false,
				loaded: false,
				busy: false,
				error: false,
				componentOptions: [],
				defectOptions: [],
				edit: null,
				impact: null
			}), "businessCatalogs");
			this.setModel(new JSONModel({ items: [] }), "requests");
			this.setModel(new JSONModel({ items: [], query: oSessionState.deliveryQuery, status: oSessionState.deliveryStatus, nextSkip: 0, pageSize: 25, hasMore: false, loaded: false, busy: false, error: false, selected: null, detailsBusy: false }), "deliveries");
			this.setModel(new JSONModel({ items: [], state: oSessionState.operationState, operationType: oSessionState.operationType, nextSkip: 0, pageSize: 25, hasMore: false, loaded: false, busy: false, error: false, selected: null, detailsBusy: false }), "operations");
			this.setModel(new JSONModel({ items: [], action: oSessionState.auditAction, result: oSessionState.auditResult, from: oSessionState.auditFrom, to: oSessionState.auditTo, nextSkip: 0, pageSize: 25, hasMore: false, loaded: false, busy: false, error: false, selected: null, detailsBusy: false }), "audit");
			this.setModel(new JSONModel({ emailDeliveryState: "UNKNOWN", provisioningBrokerState: "UNKNOWN", lastSuccessfulReconciliationAt: null, loaded: false, busy: false, error: false }), "adminReadiness");
			this.setModel(new JSONModel({
				items: [],
				developerItems: [],
				query: oSessionState.query,
				includeNonActive: oSessionState.includeNonActive,
				pageSize: 100,
				nextSkip: 0,
				hasMore: false,
				loaded: false,
				busy: false,
				error: false,
				details: null,
				detailsBusy: false
			}), "activeUsers");
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
			const sSelectedTab = this.getModel("view").getProperty("/selectedTab");
			const sSelectedAccessTab = this.getModel("view").getProperty("/selectedAccessTab");
			if (sSelectedTab === "developers" || (sSelectedTab === "access" && sSelectedAccessTab === "activeUsers")) {
				await this._ensureActiveUsersLoaded();
			}
			if (sSelectedTab === "businessCatalogs") await this._loadCatalogs();
			if (sSelectedTab === "operations") await this._ensureOperationsLoaded();
			if (sSelectedTab === "audit") await this._ensureAuditLoaded();
		},

		onSearch: async function (oEvent) {
			await this._loadRequests(oEvent.getParameter("query") || "");
		},

		onTabSelect: async function (oEvent) {
			const sKey = oEvent.getParameter("key") || oEvent.getSource().getSelectedKey();
			this.getModel("view").setProperty("/selectedTab", sKey);
			this._saveActiveUsersSessionState();
			if ((sKey === "developers" || (sKey === "access" && this.getModel("view").getProperty("/selectedAccessTab") === "activeUsers")) && !this.getModel("activeUsers").getProperty("/loaded")) {
				await this._ensureActiveUsersLoaded();
			}
			if (sKey === "businessCatalogs" && !this.getModel("businessCatalogs").getProperty("/loaded")) {
				await this._loadCatalogs();
			}
			if (sKey === "operations") await this._ensureOperationsLoaded();
			if (sKey === "audit") await this._ensureAuditLoaded();
		},

		onAccessTabSelect: async function (oEvent) {
			const sKey = oEvent.getParameter("key") || oEvent.getSource().getSelectedKey();
			this.getModel("view").setProperty("/selectedAccessTab", sKey);
			this._saveActiveUsersSessionState();
			if (sKey === "activeUsers") await this._ensureActiveUsersLoaded();
		},

		onDeveloperTabSelect: async function (oEvent) {
			const sKey = oEvent.getParameter("key") || oEvent.getSource().getSelectedKey();
			this.getModel("view").setProperty("/selectedDeveloperTab", sKey);
			this._saveActiveUsersSessionState();
			await this._ensureActiveUsersLoaded();
		},

		onOperationsTabSelect: async function (oEvent) {
			const sKey = oEvent.getParameter("key") || oEvent.getSource().getSelectedKey();
			this.getModel("view").setProperty("/selectedOperationsTab", sKey);
			this._saveActiveUsersSessionState();
			if (sKey === "deliveries") await this._loadDeliveries();
			if (sKey === "provisioning") await this._loadOperations();
		},

		onDeliverySearch: async function (oEvent) {
			this.getModel("deliveries").setProperty("/query", oEvent.getParameter("query") || oEvent.getParameter("value") || "");
			this._saveActiveUsersSessionState();
			await this._loadDeliveries();
		},

		onDeliveryStatusChange: async function (oEvent) {
			this.getModel("deliveries").setProperty("/status", oEvent.getParameter("selectedItem")?.getKey?.() || "");
			this._saveActiveUsersSessionState();
			await this._loadDeliveries();
		},

		onProvisioningFilterChange: async function () {
			this._saveActiveUsersSessionState();
			await this._loadOperations();
		},

		onAuditFilterChange: async function () {
			this._saveActiveUsersSessionState();
			await this._loadAudit();
		},

		onLoadMoreDeliveries: async function () {
			const oModel = this.getModel("deliveries");
			if (oModel.getProperty("/hasMore") && !oModel.getProperty("/busy")) await this._loadDeliveries(undefined, true);
		},

		onLoadMoreOperations: async function () {
			const oModel = this.getModel("operations");
			if (oModel.getProperty("/hasMore") && !oModel.getProperty("/busy")) await this._loadOperations(undefined, true);
		},

		onLoadMoreAudit: async function () {
			const oModel = this.getModel("audit");
			if (oModel.getProperty("/hasMore") && !oModel.getProperty("/busy")) await this._loadAudit(undefined, true);
		},

		onRetryOnboardingDelivery: async function (oEvent) {
			const oRow = this._operationsRowFromEvent(oEvent, "deliveries");
			if (!oRow || !await this._confirm("retryDeliveryConfirmation")) return;
			await this._invokeOperationsAction("retryOnboardingDelivery", {
				deliveryID: oRow.deliveryID,
				expectedModifiedAt: oRow.modifiedAt
			}, "deliveryRetryQueued", "deliveries");
		},

		onRefreshOperations: async function () {
			const sSubtab = this.getModel("view").getProperty("/selectedOperationsTab") || "deliveries";
			if (sSubtab === "deliveries") await this._loadDeliveries();
			if (sSubtab === "provisioning") await this._loadOperations();
			await this._loadReadiness();
		},

		onRefreshAudit: async function () {
			await this._loadAudit();
		},

		onOpenDeliveryDetails: async function (oEvent) {
			const oRow = this._operationsRowFromEvent(oEvent, "deliveries");
			if (!oRow) return;
			this.getModel("deliveries").setProperty("/selected", oRow);
			if (!this._deliveryDetailsDialog) {
				this._deliveryDetailsDialog = await Fragment.load({ id: this.getView().getId(), name: "idts.useradministrationui.fragment.DeliveryDetails", controller: this });
				this.getView().addDependent(this._deliveryDetailsDialog);
			}
			this._deliveryDetailsDialog.open();
		},

		onCloseDeliveryDetails: function () {
			this._deliveryDetailsDialog?.close();
			this.getModel("deliveries").setProperty("/selected", null);
		},

		onOpenOperationDetails: async function (oEvent) {
			const oRow = this._operationsRowFromEvent(oEvent, "operations");
			if (!oRow) return;
			this.getModel("operations").setProperty("/selected", oRow);
			if (!this._operationDetailsDialog) {
				this._operationDetailsDialog = await Fragment.load({ id: this.getView().getId(), name: "idts.useradministrationui.fragment.OperationDetails", controller: this });
				this.getView().addDependent(this._operationDetailsDialog);
			}
			this._operationDetailsDialog.open();
		},

		onCloseOperationDetails: function () {
			this._operationDetailsDialog?.close();
			this.getModel("operations").setProperty("/selected", null);
		},

		onOpenAuditDetails: async function (oEvent) {
			const oRow = this._operationsRowFromEvent(oEvent, "audit");
			if (!oRow) return;
			this.getModel("audit").setProperty("/selected", oRow);
			if (!this._auditDetailsDialog) {
				this._auditDetailsDialog = await Fragment.load({ id: this.getView().getId(), name: "idts.useradministrationui.fragment.AuditDetails", controller: this });
				this.getView().addDependent(this._auditDetailsDialog);
			}
			this._auditDetailsDialog.open();
		},

		onCloseAuditDetails: function () {
			this._auditDetailsDialog?.close();
			this.getModel("audit").setProperty("/selected", null);
		},

		onActiveUsersSearch: async function (oEvent) {
			const sQuery = oEvent.getParameter("query") || oEvent.getParameter("value") || "";
			this.getModel("activeUsers").setProperty("/query", sQuery);
			this._saveActiveUsersSessionState();
			await this._loadActiveUsers(sQuery);
		},

		onActiveUsersFilterChange: async function (oEvent) {
			this.getModel("activeUsers").setProperty("/includeNonActive", oEvent.getParameter("selected") === true);
			this._saveActiveUsersSessionState();
			await this._loadActiveUsers();
		},

		onRetryActiveUsers: async function () {
			await this._loadActiveUsers();
		},

		onLoadMoreActiveUsers: async function () {
			const oActiveUsersModel = this.getModel("activeUsers");
			if (!oActiveUsersModel.getProperty("/hasMore") || oActiveUsersModel.getProperty("/busy")) return;
			await this._loadActiveUsers(undefined, true);
		},

		onOpenActiveUserDetails: async function (oEvent) {
			const oRow = this._activeUserRowFromEvent(oEvent);
			if (!oRow?.userID) return;
			const oActiveUsersModel = this.getModel("activeUsers");
			oActiveUsersModel.setProperty("/detailsBusy", true);
			try {
				const oOperation = this.getView().getModel().bindContext("/readActiveUserDetails(...)");
				oOperation.setParameter("userID", oRow.userID);
				await oOperation.invoke("$direct");
				const oContext = oOperation.getBoundContext();
				const oResult = await (oContext ? oContext.requestObject() : {});
				let oDetails = oResult;
				if (Array.isArray(oResult)) {
					oDetails = oResult[0];
				} else if (Array.isArray(oResult?.value)) {
					oDetails = oResult.value[0];
				}
				oActiveUsersModel.setProperty("/details", oDetails ? {
					...oDetails,
					_request: this._requestForActiveUser(oRow.userID)
				} : null);
				if (!this._activeUserDetailsDialog) {
					this._activeUserDetailsDialog = await Fragment.load({
						id: this.getView().getId(),
						name: "idts.useradministrationui.fragment.ActiveUserDetails",
						controller: this
					});
					this.getView().addDependent(this._activeUserDetailsDialog);
				}
				this._activeUserDetailsDialog.open();
			} catch {
				MessageBox.error(await this._text("activeUserDetailsFailed"));
			} finally {
				oActiveUsersModel.setProperty("/detailsBusy", false);
			}
		},

		onCloseActiveUserDetails: function () {
			if (this._activeUserDetailsDialog) this._activeUserDetailsDialog.close();
			this.getModel("activeUsers").setProperty("/details", null);
		},

		onOpenExistingIdentityLink: async function () {
			const oDetails = this.getModel("activeUsers").getProperty("/details");
			if (!oDetails?.linkEligible || !oDetails.userID) return;
			this.getModel("existingLink").setData({
				...this._emptyExistingIdentityLink(),
				row: {
					userID: oDetails.userID,
					displayName: oDetails.displayName,
					email: oDetails.email,
					businessRole: oDetails.businessRole,
					linkEligible: oDetails.linkEligible
				}
			});
			if (!this._existingIdentityLinkDialog) {
				this._existingIdentityLinkDialog = await Fragment.load({
					id: this.getView().getId(),
					name: "idts.useradministrationui.fragment.LinkExistingIdentity",
					controller: this
				});
				this.getView().addDependent(this._existingIdentityLinkDialog);
			}
			this._existingIdentityLinkDialog.open();
		},

		onExistingIdentityLinkFieldChange: function (oEvent) {
			const oModel = this.getModel("existingLink");
			const sValue = oEvent?.getParameter?.("value");
			if (typeof sValue === "string") {
				oModel.setProperty("/email", sValue);
				oModel.setProperty("/emailTouched", true);
				oModel.setProperty("/emailValid", this._isValidEmail(sValue));
			}
		},

		onConfirmExistingIdentityLink: async function () {
			const oModel = this.getModel("existingLink");
			const oLink = oModel.getData();
			if (oLink.submitting || !oLink.row?.linkEligible || !oLink.row?.userID) return;
			const sEmail = (oLink.email || "").trim();
			if (!this._isValidEmail(sEmail)) {
				oModel.setProperty("/emailTouched", true);
				oModel.setProperty("/emailValid", false);
				MessageBox.warning(await this._text("invalidEmail"));
				return;
			}
			oModel.setProperty("/submitting", true);
			const bSuccess = await this._invokeAction("requestExistingUserIdentityLink", {
				userID: oLink.row.userID,
				email: sEmail.toLowerCase()
			}, "identityLinkQueued", true);
			oModel.setProperty("/submitting", false);
			if (bSuccess) {
				this._existingIdentityLinkDialog.close();
				oModel.setData(this._emptyExistingIdentityLink());
			}
		},

		onCancelExistingIdentityLink: function () {
			if (this._existingIdentityLinkDialog) this._existingIdentityLinkDialog.close();
			this.getModel("existingLink").setData(this._emptyExistingIdentityLink());
		},

		onOpenActiveUserRoleChange: async function () {
			const oDetails = this.getModel("activeUsers").getProperty("/details");
			if (oDetails?.accessState !== "ACTIVE") return;
			await this._openRoleChangeForRow(oDetails._request);
		},

		onOpenActiveUserSuspend: async function () {
			await this._openActiveUserLifecycle("SUSPEND", "ACTIVE", "suspendAccess", "suspendWarning", "suspendAccess");
		},

		onOpenActiveUserReactivate: async function () {
			await this._openActiveUserLifecycle("REACTIVATE", "SUSPENDED", "reactivateAccess", "reactivateWarning", "reactivateAccess");
		},

		onOpenActiveUserRevoke: async function () {
			await this._openActiveUserLifecycle("REVOKE", "ACTIVE", "revokeAccess", "revokeWarning", "revokeAccess");
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

		onCancelExistingLinkInvitation: async function (oEvent) {
			const oRow = this._rowFromEvent(oEvent);
			if (!oRow?.cancelEligible || !await this._confirm("cancelExistingLinkConfirmation")) return;
			await this._invokeAction("cancelExistingUserIdentityLink", {
				requestID: oRow.ID,
				expectedVersion: oRow.provisioningVersion
			}, "existingLinkCancelled", true);
		},

		_openRoleChangeForRow: async function (oRow) {
			if (!oRow) return;
			await this._openAccessDialog({
				mode: "CHANGE_ROLE",
				title: await this._text("changeRole"),
				confirmText: await this._text("changeRole"),
				warning: await this._text("roleChangeWarning"),
				row: oRow,
				currentRole: oRow.requestedRole_code,
				role: oRow.requestedRole_code,
				userAdminRequested: oRow.userAdminRequested === true,
				developerProfile: null
			});
		},

		onAccessRoleChange: async function (oEvent) {
			const sRole = oEvent.getSource().getSelectedKey();
			const oAccessModel = this.getModel("access");
			oAccessModel.setProperty("/role", sRole);
			if (sRole !== "PM") {
				oAccessModel.setProperty("/userAdminRequested", false);
			}
			if (sRole === "DEVELOPER" && oAccessModel.getProperty("/currentRole") !== "DEVELOPER") {
				await this._ensureDeveloperCatalogs();
				oAccessModel.setProperty("/developerProfile", this._emptyDeveloperProfile());
			} else {
				oAccessModel.setProperty("/developerProfile", null);
			}
		},

		onConfirmAccessChange: async function () {
			const oAccessModel = this.getModel("access");
			const oAccess = oAccessModel.getData();
			const sReason = (oAccess.reason || "").trim();
			const bRoleChange = oAccess.mode === "CHANGE_ROLE";
			if (bRoleChange && oAccess.currentRole === oAccess.role) {
				MessageBox.warning(await this._text("roleChangeRequiresDifferentRole"));
				return;
			}
			if (!sReason) {
				MessageBox.warning(await this._text("reasonRequired"));
				return;
			}
			if (!await this._confirm(bRoleChange ? "changeRoleConfirmation" : "revokeConfirmation")) return;
			oAccessModel.setProperty("/submitting", true);
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
			}, bRoleChange ? "changeRoleQueued" : "revokeQueued", true);
			oAccessModel.setProperty("/submitting", false);
			if (bSuccess) {
				this._accessDialog.close();
				oAccessModel.setData(this._emptyAccessChange());
			}
		},

		onConfirmAccessLifecycle: async function () {
			const oLifecycleModel = this.getModel("lifecycle");
			const oLifecycle = oLifecycleModel.getData();
			if (oLifecycle.submitting) return;
			const sReason = (oLifecycle.reason || "").trim();
			if (!sReason) {
				MessageBox.warning(await this._text("reasonRequired"));
				return;
			}
			const mActions = {
				SUSPEND: ["requestSuspend", "suspendQueued"],
				REACTIVATE: ["requestReactivate", "reactivateQueued"],
				REVOKE: ["requestRevoke", "revokeQueued"]
			};
			const aAction = mActions[oLifecycle.mode];
			if (!aAction || !oLifecycle.row?.activeUser_ID) return;
			if (!await this._confirm(`${oLifecycle.mode.toLowerCase()}Confirmation`)) return;
			oLifecycleModel.setProperty("/submitting", true);
			const bSuccess = await this._invokeAction(aAction[0], {
				userID: oLifecycle.row.activeUser_ID,
				reason: sReason,
				expectedVersion: oLifecycle.row.provisioningVersion
			}, aAction[1], true);
			oLifecycleModel.setProperty("/submitting", false);
			if (bSuccess) {
				this._accessLifecycleDialog.close();
				oLifecycleModel.setData(this._emptyAccessLifecycle());
			}
		},

		onCancelAccessChange: function () {
			this._accessDialog.close();
			this.getModel("access").setData(this._emptyAccessChange());
		},

		onCancelAccessLifecycle: function () {
			this._accessLifecycleDialog.close();
			this.getModel("lifecycle").setData(this._emptyAccessLifecycle());
		},

		onRetryAccessOperation: async function (oEvent) {
			const oRow = this._rowFromEvent(oEvent) || this._operationsRowFromEvent(oEvent, "operations");
			if (!oRow || (!oRow.latestOperation_ID && !oRow.operationID) || !await this._confirm("retryConfirmation")) {
				return;
			}
			if (oRow.operationID) {
				if (oRow.canRetry === false) return;
				await this._invokeOperationsAction("retryAccessOperation", {
					operationID: oRow.operationID,
					expectedVersion: oRow.expectedVersion
				}, "retryQueued", "operations");
				return;
			}
			await this._invokeAction("retryAccessOperation", {
				operationID: oRow.latestOperation_ID,
				expectedVersion: oRow.provisioningVersion
			}, "retryQueued", true);
		},

		onReconcileAccessOperation: async function (oEvent) {
			const oRow = this._rowFromEvent(oEvent) || this._operationsRowFromEvent(oEvent, "operations");
			if (!oRow || (!oRow.latestOperation_ID && !oRow.operationID) || !await this._confirm("reconcileConfirmation")) {
				return;
			}
			if (oRow.operationID) {
				if (oRow.canReconcile === false) return;
				await this._invokeOperationsAction("reconcileAccessOperation", {
					operationID: oRow.operationID,
					expectedVersion: oRow.expectedVersion
				}, "reconcileQueued", "operations");
				return;
			}
			await this._invokeAction("reconcileAccessOperation", {
				operationID: oRow.latestOperation_ID,
				expectedVersion: oRow.provisioningVersion
			}, "reconcileQueued", true);
		},

		onOpenDeveloperProfile: async function (oEvent) {
			const oRow = this._rowFromEvent(oEvent) || this._activeUserRowFromEvent(oEvent) || this.getModel("activeUsers").getProperty("/details");
			const sUserID = oRow?.activeUser_ID || oRow?.userID;
			if (!sUserID) return;
			await this._ensureDeveloperCatalogs();
			try {
				const oProfile = await this._readDeveloperProfile(sUserID);
				this.getModel("developer").setData({
					...this._emptyDeveloperAdministration(),
					userID: sUserID,
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
			// Khóa đồng bộ trước confirm để hai click nhanh không tạo hai optimistic-version request.
			if (this._developerProfileSubmitting || oData.submitting) return;
			if (!(oData.reason || "").trim()) {
				MessageBox.warning(await this._text("reasonRequired"));
				return;
			}
			this._developerProfileSubmitting = true;
			this.getModel("developer").setProperty("/submitting", true);
			try {
				if (!await this._confirm("developerProfileConfirmation")) return;
				const bSuccess = await this._invokeAction("updateDeveloperProfile", {
					userID: oData.userID,
					desiredProfile: this._developerProfileForRole("DEVELOPER", oData.developerProfile),
					reason: oData.reason.trim(),
					expectedVersion: oData.expectedVersion
				}, "developerProfileUpdated", true);
				if (bSuccess) this._developerDialog.close();
			} finally {
				this._developerProfileSubmitting = false;
				this.getModel("developer").setProperty("/submitting", false);
			}
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
				currentRole: "",
				role: "TESTER",
				userAdminRequested: false,
				reason: "",
				submitting: false,
				developerProfile: null
			};
		},

		_emptyAccessLifecycle: function () {
			return {
				mode: "",
				title: "",
				confirmText: "",
				warning: "",
				row: null,
				reason: "",
				submitting: false
			};
		},

		_emptyExistingIdentityLink: function () {
			return {
				row: null,
				email: "",
				emailTouched: false,
				emailValid: false,
				submitting: false
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
			return { userID: null, expectedVersion: 0, openBugImpactCount: 0, reason: "", submitting: false, developerProfile: this._emptyDeveloperProfile() };
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
			const oCatalogModel = this.getModel("developerCatalogs");
			if (oCatalogModel.getProperty("/loaded")) return;
			oCatalogModel.setProperty("/busy", true);
			oCatalogModel.setProperty("/error", false);
			const oODataModel = this.getView().getModel();
			const load = async (sPath, mParameters) => (await oODataModel.bindList(sPath, null, null, null, mParameters).requestContexts(0, 200)).map(oContext => oContext.getObject());
			try {
				const [aAvailability, aLevels, aModules, aCategories] = await Promise.all([
					load("/AvailabilityStatuses", { $filter: "active eq true" }),
					load("/ResponsibilityLevels", { $filter: "active eq true" }),
					load("/SAPModules", { $filter: "active eq true" }),
					load("/ComponentCategories", { $filter: "active eq true", $expand: "component,defectCategory" })
				]);
				const sAnySapModule = await this._text("anySapModule");
				oCatalogModel.setData({
					loaded: true,
					busy: false,
					error: false,
					availabilityStatuses: aAvailability,
					responsibilityLevels: aLevels,
					sapModules: [{ ID: "", name: sAnySapModule }, ...aModules],
					componentCategories: aCategories.map(oRow => ({ ...oRow, label: `${oRow.component?.name || ""} — ${oRow.defectCategory?.name || ""}` }))
				});
			} catch (oError) {
				oCatalogModel.setProperty("/error", true);
				throw oError;
			} finally {
				oCatalogModel.setProperty("/busy", false);
			}
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

		_openActiveUserLifecycle: async function (sMode, sState, sTitleKey, sWarningKey, sConfirmKey) {
			const oDetails = this.getModel("activeUsers").getProperty("/details");
			if (oDetails?.accessState !== sState || !oDetails._request) return;
			await this._openAccessLifecycleDialog({
				mode: sMode,
				title: await this._text(sTitleKey),
				confirmText: await this._text(sConfirmKey),
				warning: await this._text(sWarningKey),
				row: oDetails._request,
				buttonType: sMode === "REACTIVATE" ? "Accept" : "Negative"
			});
		},

		_openAccessLifecycleDialog: async function (oData) {
			this.getModel("lifecycle").setData({ ...this._emptyAccessLifecycle(), ...oData });
			if (!this._accessLifecycleDialog) {
				this._accessLifecycleDialog = await Fragment.load({
					id: this.getView().getId(),
					name: "idts.useradministrationui.fragment.ConfirmAccessLifecycle",
					controller: this
				});
				this.getView().addDependent(this._accessLifecycleDialog);
			}
			this._accessLifecycleDialog.open();
		},

		onCatalogTypeChange: async function (oEvent) {
			this.getModel("businessCatalogs").setProperty("/selectedType", oEvent.getParameter("key") || oEvent.getSource().getSelectedKey() || "SAP_MODULE");
			await this._loadCatalogs();
		},

		onCatalogSearch: function (oEvent) {
			this.getModel("businessCatalogs").setProperty("/query", oEvent.getParameter("query") || oEvent.getParameter("value") || "");
			this._applyCatalogFilters();
		},

		onCatalogInactiveFilterChange: function (oEvent) {
			this.getModel("businessCatalogs").setProperty("/includeInactive", oEvent.getParameter("selected") === true);
			this._applyCatalogFilters();
		},

		onRetryCatalogs: async function () {
			await this._loadCatalogs();
		},

		onOpenCatalogCreate: async function () {
			await this._ensureCatalogLookups();
			this.getModel("businessCatalogs").setProperty("/edit", {
				mode: "CREATE",
				code: "",
				name: "",
				componentType: "",
				categoryType: "",
				["component_ID"]: "",
				["defectCategory_ID"]: "",
				submitting: false,
				validation: {}
			});
			await this._openCatalogEditDialog();
		},

		onOpenCatalogEdit: async function (oEvent) {
			const oRow = this._catalogRowFromEvent(oEvent);
			if (!oRow) return;
			await this._ensureCatalogLookups();
			this.getModel("businessCatalogs").setProperty("/edit", {
				mode: "UPDATE",
				row: oRow,
				code: oRow.code || "",
				name: oRow.name || "",
				["component_ID"]: oRow["component_ID"] || "",
				["defectCategory_ID"]: oRow["defectCategory_ID"] || "",
				componentType: oRow.componentType || "",
				categoryType: oRow.categoryType || "",
				submitting: false,
				validation: {}
			});
			await this._openCatalogEditDialog();
		},

		_openCatalogEditDialog: async function () {
			if (!this._catalogEditDialog) {
				this._catalogEditDialog = await Fragment.load({
					id: this.getView().getId(),
					name: "idts.useradministrationui.fragment.EditCatalogItem",
					controller: this
				});
				this.getView().addDependent(this._catalogEditDialog);
			}
			this._catalogEditDialog.open();
		},

		onConfirmCatalogEdit: async function () {
			const oCatalogModel = this.getModel("businessCatalogs");
			const oEdit = oCatalogModel.getProperty("/edit");
			if (!oEdit || oEdit.submitting) return;
			const sType = oCatalogModel.getProperty("/selectedType");
			const oConfig = CATALOG_CONFIG[sType];
			const oPayload = Object.fromEntries(oConfig.fields.map(sField => [sField, String(oEdit[sField] || "").trim()]));
			const mValidation = {};
			if (sType !== "COMPONENT_CATEGORY" && (!oPayload.code || !oPayload.name)) {
				if (!oPayload.code) mValidation.code = await this._text("catalogCodeRequired");
				if (!oPayload.name) mValidation.name = await this._text("catalogNameRequired");
			}
			if (sType === "COMPONENT_CATEGORY" && (!oPayload.component_ID || !oPayload.defectCategory_ID)) {
				if (!oPayload.component_ID) mValidation["component_ID"] = await this._text("catalogComponentRequired");
				if (!oPayload.defectCategory_ID) mValidation["defectCategory_ID"] = await this._text("catalogDefectCategoryRequired");
			}
			if (Object.keys(mValidation).length > 0) {
				oCatalogModel.setProperty("/edit/validation", mValidation);
				MessageBox.warning(await this._text("catalogRequiredFields"));
				return;
			}
			oCatalogModel.setProperty("/edit/validation", {});
			oCatalogModel.setProperty("/edit/submitting", true);
			try {
				if (oEdit.mode === "CREATE") {
					const oODataModel = this.getView().getModel();
					const oList = oODataModel.bindList(`/${oConfig.entity}`, null, null, null, { $$updateGroupId: "catalogChanges" });
					const oCreatedContext = oList.create({ ...oPayload, active: true });
					await this._submitCatalogChanges([oCreatedContext.created()]);
				} else {
					const aChanges = Object.entries(oPayload).map(([sField, vValue]) => oEdit.row._context.setProperty(sField, vValue, "catalogChanges"));
					await this._submitCatalogChanges(aChanges);
				}
				this._catalogEditDialog.close();
				MessageToast.show(await this._text("catalogSaved"));
				await this._loadCatalogs();
			} catch {
				MessageBox.error(await this._text("catalogChangeFailed"));
			} finally {
				oCatalogModel.setProperty("/edit/submitting", false);
			}
		},

		_submitCatalogChanges: async function (aChangePromises) {
			await this.getView().getModel().submitBatch("catalogChanges");
			await Promise.all((aChangePromises || []).filter(oPromise => oPromise && typeof oPromise.then === "function"));
		},

		onCancelCatalogEdit: function () {
			this._catalogEditDialog?.close();
		},

		onToggleCatalogActive: async function (oEvent) {
			const oRow = this._catalogRowFromEvent(oEvent);
			if (!oRow) return;
			if (!oRow.active) {
				await this._updateCatalogRow(oRow, { active: true });
				return;
			}
			const oCatalogModel = this.getModel("businessCatalogs");
			oCatalogModel.setProperty("/busy", true);
			try {
				const oOperation = this.getView().getModel().bindContext("/readCatalogImpact(...)");
				oOperation.setParameter("catalogType", oCatalogModel.getProperty("/selectedType"));
				oOperation.setParameter("catalogID", oRow.ID);
				await oOperation.invoke("$direct");
				const oResult = await oOperation.getBoundContext().requestObject();
				oCatalogModel.setProperty("/impact", { ...oResult, row: oRow, reason: "", submitting: false });
				if (!this._catalogImpactDialog) {
					this._catalogImpactDialog = await Fragment.load({
						id: this.getView().getId(),
						name: "idts.useradministrationui.fragment.CatalogImpact",
						controller: this
					});
					this.getView().addDependent(this._catalogImpactDialog);
				}
				this._catalogImpactDialog.open();
			} catch {
				MessageBox.error(await this._text("catalogImpactFailed"));
			} finally {
				oCatalogModel.setProperty("/busy", false);
			}
		},

		onConfirmCatalogDeactivation: async function () {
			const oCatalogModel = this.getModel("businessCatalogs");
			const oImpact = oCatalogModel.getProperty("/impact");
			const sReason = String(oImpact?.reason || "").trim();
			if (!oImpact?.row || !sReason || oImpact.submitting) return;
			oCatalogModel.setProperty("/impact/submitting", true);
			const bSuccess = await this._updateCatalogRow(oImpact.row, { active: false, administrationReason: sReason });
			oCatalogModel.setProperty("/impact/submitting", false);
			if (bSuccess) this._catalogImpactDialog.close();
		},

		onCancelCatalogImpact: function () {
			this._catalogImpactDialog?.close();
		},

		_updateCatalogRow: async function (oRow, mChanges) {
			try {
				const aChanges = Object.entries(mChanges).map(([sField, vValue]) => oRow._context.setProperty(sField, vValue, "catalogChanges"));
				await this._submitCatalogChanges(aChanges);
				MessageToast.show(await this._text("catalogSaved"));
				await this._loadCatalogs();
				return true;
			} catch {
				MessageBox.error(await this._text("catalogChangeFailed"));
				return false;
			}
		},

		_loadCatalogs: async function () {
			const oCatalogModel = this.getModel("businessCatalogs");
			const oConfig = CATALOG_CONFIG[oCatalogModel.getProperty("/selectedType")];
			oCatalogModel.setProperty("/busy", true);
			oCatalogModel.setProperty("/error", false);
			try {
				await this._ensureCatalogLookups(true);
				const oBinding = this.getView().getModel().bindList(`/${oConfig.entity}`, null, null, null, { $$updateGroupId: "catalogChanges" });
				const aContexts = await oBinding.requestContexts(0, Infinity);
				const aItems = await Promise.all(aContexts.map(async oContext => ({ ...(await oContext.requestObject()), _context: oContext })));
				const aComponents = oCatalogModel.getProperty("/componentOptions") || [];
				const aDefects = oCatalogModel.getProperty("/defectOptions") || [];
				const mComponents = Object.fromEntries(aComponents.map(oItem => [oItem.ID, oItem.name]));
				const mDefects = Object.fromEntries(aDefects.map(oItem => [oItem.ID, oItem.name]));
				oCatalogModel.setProperty("/allItems", aItems.map(oItem => ({
					...oItem,
					displayCode: oItem.code || "—",
					displayName: oItem.name || `${mComponents[oItem.component_ID] || "Unknown component"} / ${mDefects[oItem.defectCategory_ID] || "Unknown category"}`,
					displayType: oItem.componentType || oItem.categoryType || "—"
				})));
				oCatalogModel.setProperty("/loaded", true);
				this._applyCatalogFilters();
			} catch {
				oCatalogModel.setProperty("/error", true);
			} finally {
				oCatalogModel.setProperty("/busy", false);
			}
		},

		_ensureCatalogLookups: async function (bRefresh) {
			const oCatalogModel = this.getModel("businessCatalogs");
			if (!bRefresh && oCatalogModel.getProperty("/componentOptions")?.length && oCatalogModel.getProperty("/defectOptions")?.length) return;
			const fnRead = async sEntity => {
				const oBinding = this.getView().getModel().bindList(`/${sEntity}`);
				const aContexts = await oBinding.requestContexts(0, Infinity);
				return Promise.all(aContexts.map(oContext => oContext.requestObject()));
			};
			const [aComponents, aDefects] = await Promise.all([fnRead("CatalogApplicationComponents"), fnRead("CatalogDefectCategories")]);
			oCatalogModel.setProperty("/componentOptions", aComponents.filter(oItem => oItem.active));
			oCatalogModel.setProperty("/defectOptions", aDefects.filter(oItem => oItem.active));
		},

		_applyCatalogFilters: function () {
			const oCatalogModel = this.getModel("businessCatalogs");
			const sQuery = String(oCatalogModel.getProperty("/query") || "").trim().toLowerCase();
			const bIncludeInactive = oCatalogModel.getProperty("/includeInactive") === true;
			const aItems = oCatalogModel.getProperty("/allItems") || [];
			oCatalogModel.setProperty("/items", aItems.filter(oItem =>
				(bIncludeInactive || oItem.active) && (!sQuery || `${oItem.displayCode} ${oItem.displayName} ${oItem.displayType}`.toLowerCase().includes(sQuery))
			));
		},

		_catalogRowFromEvent: function (oEvent) {
			return oEvent?.getSource?.().getBindingContext("businessCatalogs")?.getObject?.() || null;
		},

		_invokeAction: async function (sAction, mParameters, sSuccessTextKey, bReloadActiveUsers) {
			this.getModel("view").setProperty("/busy", true);
			try {
				const oOperation = this.getView().getModel().bindContext(`/${sAction}(...)`);
				Object.entries(mParameters).forEach(([sName, vValue]) => oOperation.setParameter(sName, vValue));
				await oOperation.invoke("$direct");
				await this._loadRequests("");
				if (bReloadActiveUsers === true && this.getModel("activeUsers")) await this._loadActiveUsers();
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

		_activeUserRowFromEvent: function (oEvent) {
			return oEvent?.getSource?.().getBindingContext("activeUsers")?.getObject?.() || null;
		},

		_operationsRowFromEvent: function (oEvent, sModelName) {
			return oEvent?.getSource?.().getBindingContext(sModelName)?.getObject?.() || null;
		},

		_requestForActiveUser: function (sUserID) {
			return (this.getModel("requests")?.getProperty("/items") || []).find(oRow => oRow.activeUser_ID === sUserID) || null;
		},

		_ensureActiveUsersLoaded: function () {
			const oActiveUsersModel = this.getModel("activeUsers");
			if (oActiveUsersModel.getProperty("/loaded")) return Promise.resolve();
			if (!this._activeUsersLoadPromise) {
				this._activeUsersLoadPromise = this._loadActiveUsers().finally(() => {
					this._activeUsersLoadPromise = null;
				});
			}
			return this._activeUsersLoadPromise;
		},

		_loadActiveUsers: async function (sQuery, bAppend) {
			const oActiveUsersModel = this.getModel("activeUsers");
			const bAppending = bAppend === true;
			const sNormalizedQuery = (sQuery === undefined ? oActiveUsersModel.getProperty("/query") : sQuery || "").trim().toLowerCase();
			const iPageSize = Number(oActiveUsersModel.getProperty("/pageSize")) || 100;
			const iSkip = bAppending ? Number(oActiveUsersModel.getProperty("/nextSkip")) || 0 : 0;
			const iRequest = (this._activeUsersRequest || 0) + 1;
			this._activeUsersRequest = iRequest;
			oActiveUsersModel.setProperty("/query", sNormalizedQuery);
			if (!bAppending) {
				oActiveUsersModel.setProperty("/items", []);
				oActiveUsersModel.setProperty("/developerItems", []);
				oActiveUsersModel.setProperty("/nextSkip", 0);
				oActiveUsersModel.setProperty("/hasMore", false);
				oActiveUsersModel.setProperty("/loaded", false);
			}
			oActiveUsersModel.setProperty("/busy", true);
			oActiveUsersModel.setProperty("/error", false);
			try {
				const oOperation = this.getView().getModel().bindContext("/searchActiveUsers(...)");
				oOperation.setParameter("query", sNormalizedQuery);
				oOperation.setParameter("includeNonActive", oActiveUsersModel.getProperty("/includeNonActive") === true);
				oOperation.setParameter("skip", iSkip);
				oOperation.setParameter("top", iPageSize);
				await oOperation.invoke("$direct");
				const oContext = oOperation.getBoundContext();
				const oResult = await (oContext ? oContext.requestObject() : {});
				const aItems = Array.isArray(oResult) ? oResult : (oResult?.value || []);
				if (iRequest === this._activeUsersRequest) {
					const aExistingItems = bAppending ? oActiveUsersModel.getProperty("/items") || [] : [];
					const oExistingIDs = new Set(aExistingItems.map(oRow => oRow.userID));
					const aCombinedItems = aExistingItems.concat(aItems.filter(oRow => !oExistingIDs.has(oRow.userID)));
					oActiveUsersModel.setProperty("/items", aCombinedItems);
					oActiveUsersModel.setProperty("/developerItems", aCombinedItems.filter(oRow => oRow.businessRole === "DEVELOPER"));
					oActiveUsersModel.setProperty("/nextSkip", iSkip + aItems.length);
					oActiveUsersModel.setProperty("/hasMore", aItems.length === iPageSize);
					oActiveUsersModel.setProperty("/loaded", true);
				}
			} catch {
				if (iRequest === this._activeUsersRequest) {
					oActiveUsersModel.setProperty("/error", true);
				}
			} finally {
				if (iRequest === this._activeUsersRequest) {
					oActiveUsersModel.setProperty("/busy", false);
				}
			}
		},

		_ensureOperationsLoaded: function () {
			const sSubtab = this.getModel("view").getProperty("/selectedOperationsTab") || "deliveries";
			const oModel = sSubtab === "deliveries" ? this.getModel("deliveries") : this.getModel("operations");
			if (!oModel.getProperty("/loaded")) {
				return Promise.all([sSubtab === "deliveries" ? this._loadDeliveries() : this._loadOperations(), this._loadReadiness()]);
			}
			return this._loadReadiness();
		},

		_ensureAuditLoaded: function () {
			return this.getModel("audit").getProperty("/loaded") ? Promise.resolve() : this._loadAudit();
		},

		_loadReadiness: async function () {
			const oModel = this.getModel("adminReadiness");
			oModel.setProperty("/busy", true);
			oModel.setProperty("/error", false);
			try {
				const oOperation = this.getView().getModel().bindContext("/readAdministrationReadiness(...)");
				const vInvocationResult = await oOperation.invoke("$direct");
				const oContext = typeof vInvocationResult?.requestObject === "function"
					? vInvocationResult
					: oOperation.getBoundContext?.();
				const vContextResult = oContext && typeof oContext.requestObject === "function"
					? await oContext.requestObject()
					: undefined;
				const oResult = vContextResult === undefined ? vInvocationResult : vContextResult;
				const oStructuredResult = oResult && typeof oResult === "object" && oResult.value && typeof oResult.value === "object"
					? oResult.value
					: oResult;
				oModel.setData({ ...(oStructuredResult || {}), loaded: true, busy: false, error: false });
			} catch {
				oModel.setProperty("/error", true);
			} finally {
				oModel.setProperty("/busy", false);
			}
		},

		_loadDeliveries: async function (_sQuery, bAppend) {
			const oModel = this.getModel("deliveries");
			const bAppending = bAppend === true;
			const iRequest = (this._deliveriesRequest || 0) + 1;
			this._deliveriesRequest = iRequest;
			const iSkip = bAppending ? Number(oModel.getProperty("/nextSkip")) || 0 : 0;
			const iPageSize = Number(oModel.getProperty("/pageSize")) || 25;
			if (!bAppending) {
				oModel.setProperty("/items", []);
				oModel.setProperty("/nextSkip", 0);
				oModel.setProperty("/hasMore", false);
			}
			oModel.setProperty("/busy", true);
			oModel.setProperty("/error", false);
			try {
				const oOperation = this.getView().getModel().bindContext("/searchOnboardingDeliveries(...)");
				oOperation.setParameter("status", oModel.getProperty("/status") || null);
				oOperation.setParameter("query", oModel.getProperty("/query") || "");
				oOperation.setParameter("skip", iSkip);
				oOperation.setParameter("top", iPageSize);
				await oOperation.invoke("$direct");
				const oContext = oOperation.getBoundContext();
				const oResult = await (oContext ? oContext.requestObject() : {});
				const aItems = Array.isArray(oResult) ? oResult : (oResult?.value || []);
				const aExisting = bAppending ? oModel.getProperty("/items") || [] : [];
				if (iRequest === this._deliveriesRequest) {
					oModel.setProperty("/items", aExisting.concat(aItems));
					oModel.setProperty("/nextSkip", iSkip + aItems.length);
					oModel.setProperty("/hasMore", aItems.length === iPageSize);
					oModel.setProperty("/loaded", true);
				}
			} catch {
				if (iRequest === this._deliveriesRequest) oModel.setProperty("/error", true);
			} finally {
				if (iRequest === this._deliveriesRequest) oModel.setProperty("/busy", false);
			}
		},

		_loadOperations: async function (_unused, bAppend) {
			const oModel = this.getModel("operations");
			const bAppending = bAppend === true;
			const iRequest = (this._operationsRequest || 0) + 1;
			this._operationsRequest = iRequest;
			const iSkip = bAppending ? Number(oModel.getProperty("/nextSkip")) || 0 : 0;
			const iPageSize = Number(oModel.getProperty("/pageSize")) || 25;
			if (!bAppending) {
				oModel.setProperty("/items", []);
				oModel.setProperty("/nextSkip", 0);
				oModel.setProperty("/hasMore", false);
			}
			oModel.setProperty("/busy", true);
			oModel.setProperty("/error", false);
			try {
				const oOperation = this.getView().getModel().bindContext("/searchAccessOperations(...)");
				oOperation.setParameter("state", oModel.getProperty("/state") || null);
				oOperation.setParameter("operationType", oModel.getProperty("/operationType") || null);
				oOperation.setParameter("skip", iSkip);
				oOperation.setParameter("top", iPageSize);
				await oOperation.invoke("$direct");
				const oContext = oOperation.getBoundContext();
				const oResult = await (oContext ? oContext.requestObject() : {});
				const aItems = Array.isArray(oResult) ? oResult : (oResult?.value || []);
				const aExisting = bAppending ? oModel.getProperty("/items") || [] : [];
				if (iRequest === this._operationsRequest) {
					oModel.setProperty("/items", aExisting.concat(aItems));
					oModel.setProperty("/nextSkip", iSkip + aItems.length);
					oModel.setProperty("/hasMore", aItems.length === iPageSize);
					oModel.setProperty("/loaded", true);
				}
			} catch {
				if (iRequest === this._operationsRequest) oModel.setProperty("/error", true);
			} finally {
				if (iRequest === this._operationsRequest) oModel.setProperty("/busy", false);
			}
		},

		_loadAudit: async function (_unused, bAppend) {
			const oModel = this.getModel("audit");
			const bAppending = bAppend === true;
			const iRequest = (this._auditRequest || 0) + 1;
			this._auditRequest = iRequest;
			const iSkip = bAppending ? Number(oModel.getProperty("/nextSkip")) || 0 : 0;
			const iPageSize = Number(oModel.getProperty("/pageSize")) || 25;
			if (!bAppending) {
				oModel.setProperty("/items", []);
				oModel.setProperty("/nextSkip", 0);
				oModel.setProperty("/hasMore", false);
			}
			oModel.setProperty("/busy", true);
			oModel.setProperty("/error", false);
			try {
				const oOperation = this.getView().getModel().bindContext("/searchAccessAuditEvents(...)");
				oOperation.setParameter("action", oModel.getProperty("/action") || null);
				oOperation.setParameter("result", oModel.getProperty("/result") || null);
				oOperation.setParameter("from", this._normalizeAuditDate(oModel.getProperty("/from"), false));
				oOperation.setParameter("to", this._normalizeAuditDate(oModel.getProperty("/to"), true));
				oOperation.setParameter("skip", iSkip);
				oOperation.setParameter("top", iPageSize);
				await oOperation.invoke("$direct");
				const oContext = oOperation.getBoundContext();
				const oResult = await (oContext ? oContext.requestObject() : {});
				const aItems = Array.isArray(oResult) ? oResult : (oResult?.value || []);
				const aExisting = bAppending ? oModel.getProperty("/items") || [] : [];
				if (iRequest === this._auditRequest) {
					oModel.setProperty("/items", aExisting.concat(aItems));
					oModel.setProperty("/nextSkip", iSkip + aItems.length);
					oModel.setProperty("/hasMore", aItems.length === iPageSize);
					oModel.setProperty("/loaded", true);
				}
			} catch {
				if (iRequest === this._auditRequest) oModel.setProperty("/error", true);
			} finally {
				if (iRequest === this._auditRequest) oModel.setProperty("/busy", false);
			}
		},

		_normalizeAuditDate: function (sValue, bEndOfDay) {
			if (sValue instanceof Date) {
				return Number.isNaN(sValue.getTime()) ? null : sValue.toISOString();
			}
			const sDate = typeof sValue === "string" ? sValue.trim() : "";
			if (!sDate) return null;
			if (/^\d{4}-\d{2}-\d{2}$/.test(sDate)) {
				const oDate = new Date(`${sDate}T00:00:00.000Z`);
				if (Number.isNaN(oDate.getTime()) || oDate.toISOString().slice(0, 10) !== sDate) return null;
				return `${sDate}T${bEndOfDay ? "23:59:59.999" : "00:00:00.000"}Z`;
			}
			const oDate = new Date(sDate);
			return Number.isNaN(oDate.getTime()) ? null : oDate.toISOString();
		},

		_invokeOperationsAction: async function (sAction, mParameters, sSuccessTextKey, sReloadModel) {
			this.getModel("view").setProperty("/busy", true);
			try {
				const oOperation = this.getView().getModel().bindContext(`/${sAction}(...)`);
				Object.entries(mParameters).forEach(([sName, vValue]) => oOperation.setParameter(sName, vValue));
				await oOperation.invoke("$direct");
				if (sReloadModel === "deliveries") await this._loadDeliveries();
				if (sReloadModel === "operations") await this._loadOperations();
				if (sReloadModel === "audit") await this._loadAudit();
				await this._loadReadiness();
				MessageToast.show(await this._text(sSuccessTextKey));
				return true;
			} catch {
				MessageBox.error(await this._text("operationsActionFailed"));
				return false;
			} finally {
				this.getModel("view").setProperty("/busy", false);
			}
		},

		_readActiveUsersSessionState: function () {
			const oDefault = { selectedTab: "access", selectedAccessTab: "requests", selectedDeveloperTab: "developerResponsibilities", selectedOperationsTab: "deliveries", query: "", includeNonActive: false, deliveryQuery: "", deliveryStatus: "", operationState: "", operationType: "", auditAction: "", auditResult: "", auditFrom: "", auditTo: "" };
			if (typeof window === "undefined" || !window.sessionStorage) return oDefault;
			try {
				const oSaved = JSON.parse(window.sessionStorage.getItem("idts.userAdministration.activeUsers") || "{}");
				const sLegacyTab = oSaved.selectedTab;
				let sSelectedTab = oDefault.selectedTab;
				if (["access", "developers", "businessCatalogs", "operations", "audit"].includes(sLegacyTab)) sSelectedTab = sLegacyTab;
				if (["requests", "activeUsers"].includes(sLegacyTab)) sSelectedTab = "access";
				if (sLegacyTab === "developerResponsibilities") sSelectedTab = "developers";
				let sSelectedAccessTab = oDefault.selectedAccessTab;
				if (["requests", "activeUsers"].includes(oSaved.selectedAccessTab)) sSelectedAccessTab = oSaved.selectedAccessTab;
				else if (["requests", "activeUsers"].includes(sLegacyTab)) sSelectedAccessTab = sLegacyTab;
				return {
					selectedTab: sSelectedTab,
					selectedAccessTab: sSelectedAccessTab,
					selectedDeveloperTab: oSaved.selectedDeveloperTab === "developerResponsibilities" ? oSaved.selectedDeveloperTab : oDefault.selectedDeveloperTab,
					selectedOperationsTab: ["deliveries", "provisioning"].includes(oSaved.selectedOperationsTab) ? oSaved.selectedOperationsTab : oDefault.selectedOperationsTab,
					query: typeof oSaved.query === "string" ? oSaved.query : oDefault.query,
					includeNonActive: oSaved.includeNonActive === true,
					deliveryQuery: typeof oSaved.deliveryQuery === "string" ? oSaved.deliveryQuery : oDefault.deliveryQuery,
					deliveryStatus: typeof oSaved.deliveryStatus === "string" ? oSaved.deliveryStatus : oDefault.deliveryStatus,
					operationState: typeof oSaved.operationState === "string" ? oSaved.operationState : oDefault.operationState,
					operationType: typeof oSaved.operationType === "string" ? oSaved.operationType : oDefault.operationType,
					auditAction: typeof oSaved.auditAction === "string" ? oSaved.auditAction : oDefault.auditAction,
					auditResult: typeof oSaved.auditResult === "string" ? oSaved.auditResult : oDefault.auditResult,
					auditFrom: typeof oSaved.auditFrom === "string" ? oSaved.auditFrom : oDefault.auditFrom,
					auditTo: typeof oSaved.auditTo === "string" ? oSaved.auditTo : oDefault.auditTo
				};
			} catch {
				return oDefault;
			}
		},

		_saveActiveUsersSessionState: function () {
			if (typeof window === "undefined" || !window.sessionStorage) return;
			try {
				const oViewModel = this.getModel("view");
				const oActiveUsersModel = this.getModel("activeUsers");
				window.sessionStorage.setItem("idts.userAdministration.activeUsers", JSON.stringify({
					selectedTab: oViewModel.getProperty("/selectedTab"),
					selectedAccessTab: oViewModel.getProperty("/selectedAccessTab"),
					selectedDeveloperTab: oViewModel.getProperty("/selectedDeveloperTab"),
					selectedOperationsTab: oViewModel.getProperty("/selectedOperationsTab"),
					query: oActiveUsersModel.getProperty("/query") || "",
					includeNonActive: oActiveUsersModel.getProperty("/includeNonActive") === true,
					deliveryQuery: this.getModel("deliveries")?.getProperty("/query") || "",
					deliveryStatus: this.getModel("deliveries")?.getProperty("/status") || "",
					operationState: this.getModel("operations")?.getProperty("/state") || "",
					operationType: this.getModel("operations")?.getProperty("/operationType") || "",
					auditAction: this.getModel("audit")?.getProperty("/action") || "",
					auditResult: this.getModel("audit")?.getProperty("/result") || "",
					auditFrom: this.getModel("audit")?.getProperty("/from") || "",
					auditTo: this.getModel("audit")?.getProperty("/to") || ""
				}));
			} catch {
				// Lưu bộ lọc chỉ là tiện ích; không được chặn việc tải dữ liệu chỉ đọc.
			}
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
