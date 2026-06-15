sap.ui.define([
    "sap/fe/core/PageController",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/ListItem",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Sorter"
], function (
    PageController,
    MessageBox,
    MessageToast,
    ListItem,
    Filter,
    FilterOperator,
    JSONModel,
    Sorter
) {
    "use strict";

    var REQUIRED_CONTROLS = [
        "applicationComponent",
        "defectCategory",
        "priority",
        "severity",
        "title",
        "description",
        "stepsToReproduce",
        "actualResult",
        "expectedResult"
    ];

    return PageController.extend("idts.bugmanagementui.ext.view.GuidedCreateBug", {
        onInit: function () {
            PageController.prototype.onInit.apply(this, arguments);
            this.getView().setModel(new JSONModel(this._emptyForm()), "form");
            this._bindApplicationComponents();
        },

        onWizardComplete: function () {
            this.getView().getModel("form").setProperty("/canCreate", true);
        },

        onSAPModuleChange: function (oEvent) {
            var sModuleID = oEvent.getSource().getSelectedKey();
            var oFormModel = this.getView().getModel("form");

            oFormModel.setProperty("/applicationComponent_ID", "");
            oFormModel.setProperty("/defectCategory_ID", "");
            oFormModel.setProperty("/categoryEnabled", false);
            this.byId("defectCategory").unbindItems();
            this._bindApplicationComponents(sModuleID);
        },

        onApplicationComponentChange: function (oEvent) {
            var sComponentID = oEvent.getSource().getSelectedKey();
            var oCategory = this.byId("defectCategory");
            var oFormModel = this.getView().getModel("form");

            oFormModel.setProperty("/defectCategory_ID", "");
            oCategory.unbindItems();

            if (!sComponentID) {
                oFormModel.setProperty("/categoryEnabled", false);
                return;
            }

            oCategory.bindItems({
                path: "/ComponentCategories",
                filters: [
                    new Filter("component_ID", FilterOperator.EQ, sComponentID),
                    new Filter("active", FilterOperator.EQ, true)
                ],
                parameters: {
                    $expand: "defectCategory($select=code,name)"
                },
                sorter: new Sorter("defectCategory/name"),
                template: new ListItem({
                    key: "{defectCategory_ID}",
                    text: "{defectCategory/name}",
                    additionalText: "{defectCategory/code}"
                }),
                templateShareable: false
            });
            oFormModel.setProperty("/categoryEnabled", true);
        },

        onCancel: function () {
            this.routing.navigateToRoute("BugsList");
        },

        onCreate: async function () {
            var oView = this.getView();
            var oFormModel = oView.getModel("form");

            if (!this._validateRequiredFields()) {
                MessageBox.error(this._text("guidedValidationError"));
                return;
            }

            oFormModel.setProperty("/busy", true);

            try {
                var oListBinding = oView.getModel().bindList("/Bugs");
                var oDraftContext = oListBinding.create(this._payload());
                await oDraftContext.created();
                var sBugID = oDraftContext.getProperty("ID");

                var oActivationBinding = oView.getModel().bindContext(
                    "BugService.draftActivate(...)",
                    oDraftContext
                );
                await oActivationBinding.execute();
                var oActiveContext = oView.getModel()
                    .bindContext(
                        "/Bugs(ID=" + sBugID + ",IsActiveEntity=true)"
                    )
                    .getBoundContext();
                await oActiveContext.requestObject();
                MessageToast.show(this._text("guidedCreateSuccess"));

                if (oActiveContext) {
                    this.routing.navigate(oActiveContext);
                    return;
                }

                this.routing.navigateToRoute("BugsList");
            } catch (oError) {
                MessageBox.error(oError.message || this._text("guidedCreateError"));
            } finally {
                oFormModel.setProperty("/busy", false);
            }
        },

        _bindApplicationComponents: function (sModuleID) {
            var oComponent = this.byId("applicationComponent");

            oComponent.unbindItems();

            if (sModuleID) {
                oComponent.bindItems({
                    path: "/SAPModuleComponents",
                    filters: [
                        new Filter("sapModule_ID", FilterOperator.EQ, sModuleID),
                        new Filter("active", FilterOperator.EQ, true)
                    ],
                    parameters: {
                        $expand: "component($select=code,name)"
                    },
                    sorter: new Sorter("component/name"),
                    template: new ListItem({
                        key: "{component_ID}",
                        text: "{component/name}",
                        additionalText: "{component/code}"
                    }),
                    templateShareable: false
                });
                return;
            }

            oComponent.bindItems({
                path: "/ApplicationComponents",
                filters: [
                    new Filter("active", FilterOperator.EQ, true)
                ],
                sorter: new Sorter("name"),
                template: new ListItem({
                    key: "{ID}",
                    text: "{name}",
                    additionalText: "{code}"
                }),
                templateShareable: false
            });
        },

        _validateRequiredFields: function () {
            var bValid = true;

            REQUIRED_CONTROLS.forEach(function (sControlID) {
                var oControl = this.byId(sControlID);
                var vValue = oControl.isA("sap.m.ComboBox")
                    ? oControl.getSelectedKey()
                    : oControl.getValue();
                var bControlValid = Boolean(String(vValue || "").trim());

                oControl.setValueState(bControlValid ? "None" : "Error");
                oControl.setValueStateText(bControlValid ? "" : this._text("requiredFieldError"));
                bValid = bControlValid && bValid;
            }, this);

            return bValid;
        },

        _payload: function () {
            var oData = this.getView().getModel("form").getData();
            var oPayload = {
                title: oData.title.trim(),
                description: oData.description.trim(),
                priority_code: oData.priority_code,
                severity_code: oData.severity_code,
                applicationComponent_ID: oData.applicationComponent_ID,
                defectCategory_ID: oData.defectCategory_ID,
                stepsToReproduce: oData.stepsToReproduce.trim(),
                actualResult: oData.actualResult.trim(),
                expectedResult: oData.expectedResult.trim()
            };

            [
                "sapModule_ID",
                "environment_code",
                "environmentDetail",
                "testCaseRef",
                "testRunRef",
                "dueDate"
            ].forEach(function (sField) {
                if (oData[sField]) {
                    oPayload[sField] = oData[sField];
                }
            });

            return oPayload;
        },

        _emptyForm: function () {
            return {
                busy: false,
                canCreate: false,
                categoryEnabled: false,
                title: "",
                description: "",
                priority_code: "",
                severity_code: "",
                environment_code: "",
                environmentDetail: "",
                sapModule_ID: "",
                applicationComponent_ID: "",
                defectCategory_ID: "",
                stepsToReproduce: "",
                actualResult: "",
                expectedResult: "",
                testCaseRef: "",
                testRunRef: "",
                dueDate: ""
            };
        },

        _text: function (sKey) {
            return this.getView().getModel("i18n").getResourceBundle().getText(sKey);
        }
    });
});
