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
			this.setModel(new JSONModel({ items: [] }), "requests");
			this._loadRequests("");
		},

		onSearch: async function (oEvent) {
			await this._loadRequests(oEvent.getParameter("query") || "");
		},

		onOpenInvite: async function () {
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

		_updateInviteState: function () {
			const oInviteModel = this.getModel("invite");
			const oInvite = oInviteModel.getData();
			const bEmailValid = this._isValidEmail(oInvite.email);
			oInviteModel.setProperty("/emailValid", bEmailValid);
			oInviteModel.setProperty("/canSubmit", bEmailValid && ["PM", "TESTER", "DEVELOPER"].includes(oInvite.role));
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
				submitting: false
			};
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
			const oBundle = await this.getModel("i18n").getResourceBundle();
			return oBundle.getText(sKey);
		}
	});
});
