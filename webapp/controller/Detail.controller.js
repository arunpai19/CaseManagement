/*global location */
sap.ui.define([
	"zm209_chng_req/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"zm209_chng_req/util/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function(BaseController, JSONModel, formatter, Filter, FilterOperator, MessageBox, MessageToast) {
	"use strict";

	return BaseController.extend("zm209_chng_req.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				edit: true,
				save: false,
				cancel: false,
				infoEdit: false,
				changesToUpdate: false
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

			this.setDetailModels();
			this.approvalrouteFragment = sap.ui.xmlfragment("approvalrouteFragment", "zm209_chng_req.fragments.Tabs.approvalrouteTab", this.getView()
				.getController());
			this.getView().addDependent(this.approvalrouteFragment);
			this.getView().byId("iconTabBarApproval").insertContent(this.approvalrouteFragment);

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		/**
		 * Perform save operation depending upon the Tab selected.
		 */
		onPressFooterSave: function() {
			var sKey = this.getView().byId("iconTabBar").getSelectedKey();
			switch (sKey) {
				case "infoTab":
					var oInitialData = this.getView().getModel("FieldDataModel").getData();
					var bValid = this.validateControlDataFields(this._displayControlData, oInitialData);
					if (!bValid) {
						MessageToast.show("Enter Mandatory Fields");
						return;
					}
					var bChanged = this.getModel("detailView").getProperty("/changesToUpdate");
					if (!bChanged) {
						MessageToast.show("No Changes to Save");
						return;
					}
					this.postInformationData(oInitialData);
					break;
				case "approvalTab":
					var oDataItem = this.getView().getModel("approvalRouteModel").getData();
					if (oDataItem.length === 0) {
						MessageToast.show("No Records to Save");
						return;
					}
					//Recursion to update the Dates
					var iIndex = 0;
					this._callDateChangeRecursion(oDataItem, iIndex);
					break;
				case "notesTab":
					//this._saveNotesData();
					var oNotesItem = this.newNotes.getModel().getData();
					if (oNotesItem.NotesText.trim() === "") {
						MessageToast.show("Please Enter the text");
						return;
					}
					this.postNotesData(oNotesItem);
					break;
				default:
					break;
			}
		},

		/**
		 * Cancel button will make the screen in the disply mode by replacing the fragments
		 */
		onPressFooterCancel: function() {
			var oView = this.getView(),
			    sKey = oView.byId("iconTabBar").getSelectedKey();
			switch (sKey) {
				case "infoTab":
					this.btnFooterVisibility(true, false, false);
					oView.byId("iconTabBarInform").removeAllContent();
					var infoFragment = sap.ui.xmlfragment("infoDisplayFragment",
						"zm209_chng_req.fragments.Tabs.informationTab", this.getView().getController());
						this.getView().addDependent(infoFragment);
					oView.byId("iconTabBarInform").insertContent(infoFragment);
					/*}*/
					oView.getModel("FieldDataModel").setData([]);
					oView.getParent().getParent().setMode("ShowHideMode");
					this.getModel("detailView").setProperty("/infoEdit", false);
					this.getModel("detailView").setProperty("/changesToUpdate", false);
					break;
				case "approvalTab":
					this.btnFooterVisibility(true, false, false);
					break;
				case "notesTab":
					oView.byId("iconTabBarNotes").removeAllContent();
					oView.byId("iconTabBarNotes").insertContent(this.getView().byId("notesFragment--detail"));
					this.btnFooterVisibility(true, false, false);
					break;
			}	
		},
		/**
		 * Edit button will make the screen editable depending upon the tab selected.
		 */
		onPressFooterEdit: function() {
			var sKey = this.getView().byId("iconTabBar").getSelectedKey();
			switch (sKey) {
				case "infoTab":
					this._formatInformationEditData(false, "");
					break;
				case "attachmentTab":
					this.btnFooterVisibility(false, false, false);
					break;
				case "approvalTab":
					this.btnFooterVisibility(false, true, true);
					break;
				case "notesTab":
					this.btnFooterVisibility(false, false, false);
					break;
				default:
					this.btnFooterVisibility(false, false, false);
					break;
			}
		},
		/**
		 * Event triggered when the tab is selected. This wil make the respective tabs to do the screen visibility
		 * changes
		 * @param oEvent - Get the Icon tab bar Key
		 */
		onSelectIconTab: function(oEvent) {
			if (this.getView().getModel("detailView").getProperty("/changesToUpdate")||
				this.getView().getModel("approvalRouteModel").getData().length > 0) {
				this._checkForSaveAlert();
			}
			this.checkForIconTabSelection(oEvent.getParameters().key);
		},
		checkForIconTabSelection: function(sKey) {
			switch (sKey) {
				case "infoTab":
					if (!this.getModel("detailView").getProperty("/infoEdit")) {
						this.onPressFooterCancel();
					} else {
						this.getView().getParent().getParent().setMode("HideMode");
						this.btnFooterVisibility(false, true, true);
					}
					break;
				case "attachmentTab":
					this.btnFooterVisibility(true, false, false);
					this._setSplitScreenMode();
					break;
				case "approvalTab":
					this._setSplitScreenMode();
					this.btnFooterVisibility(true, false, false);
					var table = sap.ui.core.Fragment.byId("approvalrouteFragment", "apprRouteTable");
					table.getBinding("items").filter([]);
					break;
				case "notesTab":
					this._setSplitScreenMode();
					this.getView().byId("iconTabBarNotes").removeAllContent();
					this.getView().byId("iconTabBarNotes").insertContent(this.getView().byId("notesFragment--detail"));
					this._showTextDecoration("");
					this.btnFooterVisibility(true, false, false);
					break;
				default:
					this._setSplitScreenMode();
					this.btnFooterVisibility(true, false, false);
					break;
			}
		},
		_checkForSaveAlert: function() {
			MessageBox.alert("You have unsaved Data. Do you want to Save the Changes?", {
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				onClose: (jQuery.proxy(function(sAction, oevent) {
					if (sAction === "YES") {
						if (this.getModel("detailView").getProperty("/changesToUpdate")) {
							var oInitialData = this.getView().getModel("FieldDataModel").getData();
							var bValid = this.validateControlDataFields(this._displayControlData, oInitialData);
							if (!bValid) {
								MessageToast.show("Enter Mandatory Fields");
								this.getView().byId("iconTabBar").setSelectedKey("infoTab");
								this.getView().getParent().getParent().setMode("HideMode");
								this.btnFooterVisibility(false, true, true);
								return false;
							}
							this.postInformationData(oInitialData);
							return true;
						}
						else{
							var oDataItem = this.getView().getModel("approvalRouteModel").getData();
							//Recursion to update the Dates
							var iIndex = 0;
							this._callDateChangeRecursion(oDataItem, iIndex);
						}
					} else {
						this.getView().getModel("detailView").setProperty("/changesToUpdate", false);
						return true;
					}
				}, this))
			});
		},
		/**
		 * This will open the Dialog box for attachment if the user is in Edit mode
		 */
		addAttachment: function() {
			//Check  if it is editable
			if (this.getModel("detailView").getProperty("/edit")) {
				MessageToast.show("User not in edit Mode");
				return;
			}
			var oAttach = this.getView();
			this.attachDialog = sap.ui.xmlfragment(oAttach.getId(), "zm209_chng_req.fragments.attachment", this);
			this.getView().addDependent(this.attachDialog);
			this.getView().getModel("oAttachmentModel").setData({
				Type: "",
				AttachNumber: "",
				AttachVersion: "",
				AttachPart: "",
				AttachDesciption: ""
			});
			this.attachDialog.open();
		},
		/**
		 * This will get the fields from the attachment Dialog box and call Post service for the attachments
		 */
		setAttachToList: function(oEvent) {
			var oDefaultoModel = this.getView().getModel(),
				oPayload = {},
				oView = this.getView();
			var attachmentModel = this.getView().getModel("oAttachmentModel");
			oPayload.DocumentType = attachmentModel.getProperty("/Type");
			oPayload.DocumentNumber = attachmentModel.getProperty("/AttachNumber");
			if(oPayload.DocumentType === "" || oPayload.DocumentNumber === ""){
				MessageToast.show("Please enter Document Type and Number");
						return;
			}
			oPayload.DocumentVersion = attachmentModel.getProperty("/AttachVersion");
			oPayload.DocumentPart = attachmentModel.getProperty("/AttachPart");
			oPayload.Description = attachmentModel.getProperty("/AttachDesciption");
			oPayload.NotifNumber = oView.getModel("detailModel").getProperty("/NotifNumber");
			var serviceUrl = "/AttachmentsSet";
			var mParameters = {
				success: function(oData, response) {
					MessageToast.show("Attachment has been added");
					this._callDetailSetService(oView.getModel("detailModel").getProperty("/NotifNumber"));
				}.bind(this),
				error: function(oError) {
					this.showServiceError(oError);
				}.bind(this)
			};
			oDefaultoModel.create(serviceUrl, oPayload, mParameters);
			this.attachDialog.destroy(true);
		},
		/**
		 * This will destroy the dialog fragment
		 */
		cancelAttachDialog: function() {
			this.attachDialog.destroy(true);

		},
		/**
		 * This will call the Dialog frgament of attachments based on the list selection and call the read service
		 * to get the records
		 */
		attachDocValueHelp: function() {
			var oDefaultoModel = this.getOwnerComponent().getModel();
			var oDocModel = new JSONModel();
			var sType = this.getView().getModel("oAttachmentModel").getProperty("/Type");

			var aFilters = [new Filter("DocumentType", FilterOperator.EQ, sType)];
			var sServiceUrl = "/AttachmentsSet";
			var mParameters = {
				filters: aFilters,
				success: function(oData, response) {
					oDocModel.setData(oData);
					oDocModel.updateBindings();
				},
				error: function(oError) {
					this.showServiceError(oError);
				}.bind(this)
			};
			oDefaultoModel.read(sServiceUrl, mParameters);

			var attachDoc = this.getView();
			if (!this.DocIdDialog) {
				this.DocIdDialog = sap.ui.xmlfragment(attachDoc.getId(), "zm209_chng_req.fragments.SearchHelpFrag.searchAttachment", this);
			}
			this.getView().addDependent(this.DocIdDialog);
			this.DocIdDialog.setModel(oDocModel, "docModel");
			this.DocIdDialog.setModel(this.getResourceModel(), "i18n");
			this.DocIdDialog.open();
		},
		/**
		 * This will get the Valuse from the values help of the attachments
		 * to populate it to the attachment dialog fields
		 */
		handleAttchDcoConfirm: function(oEvent) {
			//this.getView().byId("ipAttachNumber").setSelectedKey(null);
			var sHelpData = oEvent.getParameter("selectedItems")["0"].getTitle();
			var iIndex = oEvent.getParameter("selectedItems")["0"].getBindingContext("docModel").getPath().split("/")[2];
			var attachData = this.DocIdDialog.getModel("docModel").getData().results;
			var attachmentModel = this.getView().getModel("oAttachmentModel");
			attachmentModel.setProperty("/AttachNumber", sHelpData);
			attachmentModel.setProperty("/AttachVersion", attachData[iIndex].DocumentVersion);
			attachmentModel.setProperty("/AttachPart", attachData[iIndex].DocumentPart);
			attachmentModel.setProperty("/AttachDesciption", attachData[iIndex].Description);

		},
		/**
		 * This is called for deleting the respective attachments.
		 *  @params: oEvent - Get the Binding of the selected Records
		 */
		deleteListItem: function(oEvent) {
			var oItems = oEvent.getSource().getBindingContext("detailModel").getObject();
			this.removeAttachmentList(oItems);
		},
		/**
		 * This is open the Projects Element Dialog fragment which clicking on add button
		 */
		onAddProjectElements: function() {
			var oView = this.getView();
			if (!this.projectElementsDialog) {
				this.projectElementsDialog = sap.ui.xmlfragment(oView.getId(), "zm209_chng_req.fragments.projectElementsDialog", this);
				this.getView().addDependent(this.projectElementsDialog, this);
			}
			var sKey = this.getView().byId("linkFragment--drpdwnProjectEle").getSelectedKey();
			if (sKey === "") {
				return;
			}
			var oProjModelData = this.popObjForProjEle(sKey);
			var oProjElementModel = new JSONModel();
			this.projectElementsDialog.setModel(oProjElementModel);
			oProjElementModel.setData(oProjModelData);
			this.projectElementsDialog.open();
		},
		/**
		 * This is Call the Post service for creatinf the project elements.
		 * The Values will be taken from the search help
		 */
		pressOkProjectElementsDialog: function(oEvent) {
			var sFieldId,
				sMessage,
				oView = this.getView(),
				sNetwork = "";
			var sKey = oView.byId("linkFragment--drpdwnProjectEle").getSelectedKey(),
				oProjectEleData = this.projectElementsDialog.getModel();
			switch (sKey) {
				case "WBS":
					if (oProjectEleData.getProperty("/projectElem").trim() === "") {
						MessageToast.show("Please enter value");
						return;
					}
					sFieldId = "ZZ_WBS";
					sMessage = "WBS has been created";
					break;
				case "Networks":
					if (oProjectEleData.getProperty("/projectElem").trim() === "") {
						MessageToast.show("Please enter value");
						return;
					}
					sFieldId = "ZZ_NWHEADER";
					sMessage = "Network Header has been created";
					break;
				case "NetworkAct":
					if (oProjectEleData.getProperty("/projectElem").trim() === "" ||
						oProjectEleData.getProperty("/networkAct").trim() === "") {
						MessageToast.show("Please select a value");
						return;
					}
					sFieldId = "ZZ_NWA";
					sMessage = "Network Activites has been created";
					sNetwork = oProjectEleData.getProperty("/networkAct").trim();
					break;
			}
			var oPayload = {};
			oPayload.FieldId = sFieldId;
			oPayload.Network = sNetwork;
			oPayload.Value = oProjectEleData.getProperty("/projectElem").trim();
			oPayload.NotifNumber = oView.getModel("detailModel").getProperty("/NotifNumber");
			this.postProjectElements(oPayload, sMessage);

		},

		/**
		 * This will close the dialog fragment
		 */
		cancelProjectElementsDialog: function() {
			this.projectElementsDialog.close();
		},
		/**
		 * This will call the Search help Fragments based on the Tab selected
		 */
		addItemToList: function(oEvent) { // for fleet
			var sItem = oEvent.getSource().getAlt();
			var bCheckFleet = true;
			var bCheckEmp = false;
			var bCheckTaf = false;
			var sSecondFilter;
			var sTypeFilter;
			var oDropView = this.getView();
			if (!this.dropDialog) {
				this.dropDialog = sap.ui.xmlfragment(oDropView.getId(), "zm209_chng_req.fragments.dropDownHelp", this);
			}
			this.getView().addDependent(this.dropDialog);
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/busy", true);
			if (sItem === "CR") {
				this.dropDialog.setTitle("Select Cr");
				this.getView().byId("dropLabel").setText("Cr Linked :");
				this.getView().byId("okButton").getCustomData()["0"].setValue("CR");
				sSecondFilter = "CR_NOTIFICATION";
			} else if (sItem === "Quotation") {
				this.dropDialog.setTitle("Select Quotation");
				this.getView().byId("dropLabel").setText("Quotation :");
				this.getView().byId("okButton").getCustomData()["0"].setValue("Quotation");
				sSecondFilter = "QUOTATION";

			} else if (sItem === "Notification") {
				this.dropDialog.setTitle("Select Notification");
				this.getView().byId("dropLabel").setText("Notification :");
				this.getView().byId("okButton").getCustomData()["0"].setValue("Notification");
				sSecondFilter = "NOTIFICATION";

			} else if (sItem === "WorkOrder") {
				this.dropDialog.setTitle("Select Order Number");
				this.getView().byId("dropLabel").setText("Order Number :");
				this.getView().byId("okButton").getCustomData()["0"].setValue("WorkOrder");
				sSecondFilter = "ORDER_NO";

			}

			if (bCheckFleet === true && sItem === "CR") {
				sTypeFilter = "F";

			} else if (bCheckEmp === true && sItem === "CR") {
				sTypeFilter = "EMP";

			} else if (bCheckTaf === true && sItem === "CR") {
				sTypeFilter = "TAF";

			}
			//typeFilter = '00010012';
			this.comboModelFunction("addField", sSecondFilter, sTypeFilter).then(function() {
					var tempmodel = this.getView().getModel("dropDown");
					this.dropDialog.setModel(tempmodel, "dropDown");
					this.getView().byId("notifValueData").setSelectedKey("");
					oViewModel.setProperty("/busy", false);
					this.dropDialog.open();
				}.bind(this))
				.catch(function(sErrorText) {
					oViewModel.setProperty("/busy", false);
				});

		},
		/**
		 * This will call the Post service of the respective field ID which is passed and
		 * Call the post service to create  the records
		 */
		setValToList: function(oEvent) { //for fleet
			var sItem = oEvent.getSource().getCustomData()["0"].getValue();
			var sFieldId,
				sMessage;
			if (this.getView().byId("notifValueData").getValue().trim() === "") {
				MessageToast.show("Please select a value");
				return;
			}
			if (sItem === "CR") {
				sFieldId = "ZZ_LINKEDCR";
				sMessage = "Link has been created";
			} else if (sItem === "Notification") {
				sFieldId = "ZZ_LINKEDNOT";
				sMessage = "Notification Link has been created";
			} else if (sItem === "Quotation") {
				sFieldId = "ZZ_QUOTATION";
				sMessage = "Quotation has been created";
			} else if (sItem === "WorkOrder") {
				sFieldId = "ZZ_LINKEDORD";
				sMessage = "Work Order has been created";
			} else if (sItem === "WBS") {
				sFieldId = "ZZ_WBS";
				sMessage = "WBS has been created";
			} else if (sItem === "Networks") {
				sFieldId = "ZZ_NWHEADER";
				sMessage = "Network Header has been created";
			} else if (sItem === "NetworksAct") {
				sFieldId = "ZZ_NWA";
				sMessage = "Network Activites has been created";
			}

			var oDefaultoModel = this.getView().getModel();
			var oPayload = {};
			oPayload.FieldId = sFieldId;
			oPayload.Value = this.getView().byId("notifValueData").getValue().trim();
			oPayload.NotifNumber = this.getView().getModel("detailModel").getProperty("/NotifNumber");
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/busy", true);
			var sServiceUrl = "/ProjectSet";
			var mParameters = {
				success: function(oData, response) {
					MessageToast.show(sMessage);
					this.dropDialog.close();
					oViewModel.setProperty("/busy", false);
					this._callDetailSetService(this.getView().getModel("detailModel").getProperty("/NotifNumber"));
				}.bind(this),
				error: function(oError) {
					this.showServiceError(oError);
					oViewModel.setProperty("/busy", false);
				}.bind(this)
			};
			oDefaultoModel.create(sServiceUrl, oPayload, mParameters);

		},
		/**
		 * This will close the dialog fragment
		 */
		cancelItemDialog: function(oEvent) {
			oEvent.getSource().getParent().close();
		},
		/**
		 * This will open the APproval template fragment and intitilise the models
		 */
		onAddApprovalRoute: function() {
			if (!this.approvalrouteAddFromTemplate) {
				this.approvalrouteAddFromTemplate = sap.ui.xmlfragment("approvalrouteAddFromTemplate",
					"zm209_chng_req.fragments.approvalrouteAddFromTemplate", this);
				this.getView().addDependent(this.approvalrouteAddFromTemplate);
			}
			//
			this._resetCustomTemplateModel();
			this.approvalrouteAddFromTemplate.open();

		},
		/**
		 * Call service to Read the Approval template records and bind it to the drop down
		 */
		onChangeApprovalTemplate: function(oEvent) {
			var oDefaultoModel = this.getOwnerComponent().getModel();
			var sServiceUrl = "/ApprovalRouteSet";
			var oFilters = [new Filter("ApprovalTemp", FilterOperator.EQ, oEvent.getSource().getSelectedKey())];
			var mParameters = {
				filters: oFilters,
				success: function(oData, response) {
					var oDropdown = new JSONModel();
					oDropdown.setData(oData);
					sap.ui.core.Fragment.byId("approvalrouteAddFromTemplate", "approvalTemplate").setModel(oDropdown);

				}.bind(this),
				error: function(oError) {
					this.showServiceError(oError);
				}.bind(this)
			};
			oDefaultoModel.read(sServiceUrl, mParameters);
		},
		/**
		 * Call Post service depending upon the tab selected which will post either the Custom template records
		 * or the add from template recrods
		 */
		addApprovalDialog: function() {
			var sKey = sap.ui.core.Fragment.byId("approvalrouteAddFromTemplate", "idIconTabBarNoIcons").getSelectedKey();
			if (sKey === "customTemplate") {
				this._addCustomTemplate();
			} else {
				this._addFromTemplate();
			}
		},
		/**
		 * Clear all the models and  close  of dialog fragments
		 * or the add from template recrods
		 */
		cancelApprovalDialog: function() {
			this.clearApprovalFieldsAndModels();
			this.approvalrouteAddFromTemplate.close();
		},
		/**
		 * Clear all the models and  close  of dialog fragments
		 * or clear the table selectiong og the approval route template
		 */
		clearApprovalDialog: function() {
			this.clearApprovalFieldsAndModels();
			sap.ui.core.Fragment.byId("approvalrouteAddFromTemplate", "approvalTemplate").removeSelections();
		},
		/**
		 *  This will get the data from the selected object list and bind it to the Notes tab for Save of records
		 * or clear the table selectiong og the approval route template
		 */
		onAddNewNotes: function(oEvent) {
			var oItem = oEvent.getSource().getBindingContext("detailModel").getObject();
			var oDataCopy = JSON.parse(JSON.stringify(oItem));
			this.showNewNotesTab(oDataCopy);
		},
		/**
		 *  When the Approval routes tab Notes icon is selected, check for exisiting or new one and it will navigate to the 
		 * Notes tab and if it new it will go the New notes pop up to enter/Save the texts
		 */
		onPressNotesFromRoutes: function(oEvent) {
			var oItem = oEvent.getSource().getBindingContext("detailModel").getObject(),
				oIconTabBar = this.getView().byId("iconTabBar");
			//Check  if it is editable
			if (this.getModel("detailView").getProperty("/edit") && oItem.Process === 'N') {
				MessageToast.show("User not in edit Mode");
				return;
			}
			if (oItem.Process === 'N') {
				//oItem.NotesText = "";
				var aDataCopy = JSON.parse(JSON.stringify(oItem));
				aDataCopy.Status = "";
				oItem.NotesText = "";
				oIconTabBar.setSelectedKey("notesTab");
				this.showNewNotesTab(aDataCopy);
			} else {
				this._showTextDecoration(oItem.StepKey);
				oIconTabBar.setSelectedKey("notesTab");
				this.btnFooterVisibility(true, false, false);
			}
		},
		/**
		 *  Deletion of the work order based on the table selection and call the remove service method
		 */
		onPressDeleteWorkOrder: function(oEvent) {
			var oItems = oEvent.getSource().getBindingContext("detailModel").getObject();
			this.deleteLinkService("ZZ_LINKEDORD", oItems.WorkOrder, "", "Work Order has been deleted");
		},
		/**
		 *  Deletion of the work order based on the table selection and call the remove service method
		 */
		onPressDeleteCRLinks: function(oEvent) {
			var oItems = oEvent.getSource().getBindingContext("detailModel").getObject();
			this.deleteLinkService("ZZ_LINKEDCR", oItems.CrNotification, "", "CR Link has been deleted");
		},
		/**
		 *  Deletion of the Notification Links based on the table selection and call the remove service method
		 */
		onPressDeleteNotifLink: function(oEvent) {
			var oItems = oEvent.getSource().getBindingContext("detailModel").getObject();
			this.deleteLinkService("ZZ_LINKEDNOT", oItems.Notification, "", "Notification Link has been deleted");
		},
		/**
		 *  Deletion of the Quotation based on the table selection and call the remove service method
		 */
		onPressDeleteQuotation: function(oEvent) {
			var oItems = oEvent.getSource().getBindingContext("detailModel").getObject();
			this.deleteLinkService("ZZ_QUOTATION", oItems.Quotation, "", "Quotation has been deleted");
		},
		/**
		 *  Deletion of the Project Elements based on the table selection and call the remove service method
		 */
		onPressDeleteProJElements: function(oEvent) {
			var oItems = oEvent.getSource().getBindingContext("detailModel").getObject();
			this.deleteLinkService(oItems.FieldId, oItems.Value, oItems.Network, "Project Element has been deleted");
		},
		/**
		 *  Deletion of the approval routes based on the table selection and call the remove service method
		 */
		onPressDeleteApproveRoutes: function(oEvent) {
			var oItems = oEvent.getSource().getBindingContext("detailModel").getObject();
			this.deleteApprovalRoutes(oItems, "Approval Route Step has been deleted");
		},
		/**
		 *  This is for updating the status of the records in the edit mode.
		 *  It will check for the approval status  and if it TSCO, it will not do anything
		 * Else it will call the update service and move to the Notes Tab popup for entering the text and then Save
		 */
		onStatusChange: function(oEvent) {
			//Check  if it is editable
			if (this.getModel("detailView").getProperty("/edit")) {
				MessageToast.show("User not in edit Mode");
				return;
			}
			var oSource = oEvent.getSource(),
				iconTabBar = this.getView().byId("iconTabBar"),
				oItem = oSource.getBindingContext("detailModel").getObject(),
				sSetUserStatus = oSource.getAlt();
			// Validation check if Status can be changed.
			if (!((sSetUserStatus === "APPV" && oItem.AppvFlag === "X") ||
					(sSetUserStatus === "RJCT" && oItem.RjctFlag === "X") ||
					(sSetUserStatus === "HOLD" && oItem.HoldFlag === "X"))) {
				// Continue
				MessageBox.warning(
					"Permission Denied - You don't have permission to approve this step", {
						icon: MessageBox.Icon.Warning,
						title: "Warning",
						actions: [MessageBox.Action.OK],
						onClose: function(oAction) {}
					}
				);
				return;
			}
			var oStatusChangePayload = this.setStatusPayload(this.getView().getModel("detailModel").getProperty("/NotifNumber"), oSource.getAlt(),
				oItem.StepKey, "S", "");
			if ((sSetUserStatus === "RJCT" && oItem.Status === "TSRL") ||
				(sSetUserStatus === "HOLD" && oItem.Status === "TSRL") ||
				(sSetUserStatus === "RQST" && oItem.Status === "TSRL")) {
				iconTabBar.setSelectedKey("notesTab");
				this.showNewNotesTab(oStatusChangePayload);
			} else {
				this.callStatusChangeService(oStatusChangePayload, "Status has been updated", true);
			}
		},
		/**
		 *  When this Icon is visible and selected, it will call the update service
		 *  
		 */
		onPressManualRelease: function(oEvent) {
			var oItem = oEvent.getSource().getBindingContext("detailModel").getObject();
			var oStatusChangePayload = this.setStatusPayload(this.getView().getModel("detailModel").getProperty("/NotifNumber"), "", oItem.StepKey,
				"R", "");
			this.callStatusChangeService(oStatusChangePayload, "Status has been released Manually", true);
		},
		/**
		 *  This will save the Table records for the changed dates and move it to the models
		 */
		handleApprovalRouteDateChange: function(oEvent) {
			var oParameters = oEvent.getParameters();
			var oItem = oEvent.getSource().getBindingContext("detailModel").getObject();
			var oApprData = this.getView().getModel("approvalRouteModel").getData();
			if (!oParameters.valid) {
				MessageToast.show("Date is not Valid");
				return;
			}
			this.updateApprDateChangeModel(oItem, oApprData);
		},
		/**
		 *  Filter of the Approval routes table in the edit mode based on the date selection in the header
		 */
		handleAppRteTFromDateChange: function(oEvent) {
			var dDate = sap.ui.core.Fragment.byId("approvalrouteFragment", "dpToDate").getValue();
			var oParameters = oEvent.getParameters();
			if (!oParameters.valid || dDate === "") {
				return;
			}
			
			this.handleFilterDates(new Date(oParameters.value), new Date(dDate));

		},
		/**
		 *  Filter of the Approval routes table in the edit mode based on the date selection in the header
		 */
		handleAppRteToDateChange: function(oEvent) {
			var dDate = sap.ui.core.Fragment.byId("approvalrouteFragment", "dpFromDate").getValue();
			var oParameters = oEvent.getParameters();
			if (!oParameters.valid || dDate === "") {
				return;
			}
			this.handleFilterDates(new Date(dDate), new Date(oParameters.value));
		},
		/**
		 *  This will call the read service depending upon the selected record and open the Attachment fragments which contains
		 * the upload collection control for download of attachmentz
		 */
		onPressAttachmentLink: function(oEvent) {
			var oViewModel = this.getModel("detailView"),
				oItemList = oEvent.getSource().getBindingContext("detailModel").getObject();
			if (!this.downloadAttachDialog) {
				this.downloadAttachDialog = sap.ui.xmlfragment("downloadAttachFrag", "zm209_chng_req.fragments.downloadAttachment", this.getView()
					.getController());
				this.getView().addDependent(this.downloadAttachDialog);
			}
			oViewModel.setProperty("/busy", true);
			this.attachmentListModel(oItemList).then(function() {
					oViewModel.setProperty("/busy", false);
					this.downloadAttachDialog.open();
				}.bind(this))
				.catch(function(sErrorText) {
					oViewModel.setProperty("/busy", false);
				});
		},
		/**
		 * This will enable/disable the download button
		 * 
		 */
		onSelectionChange: function() {
			var oUploadCollection = sap.ui.core.Fragment.byId("downloadAttachFrag", "UploadCollection");
			// If there's any item selected, sets download button enabled
			if (oUploadCollection.getSelectedItems().length > 0) {
				sap.ui.core.Fragment.byId("downloadAttachFrag", "downloadButton").setEnabled(true);

			} else {
				sap.ui.core.Fragment.byId("downloadAttachFrag", "downloadButton").setEnabled(false);
			}
		},
		/**
		 * This will download the attachment to the local device
		 */
		onDownloadItem: function() {
			var oUploadCollection = sap.ui.core.Fragment.byId("downloadAttachFrag", "UploadCollection");
			var aSelectedItems = oUploadCollection.getSelectedItems();
			if (aSelectedItems) {
				for (var i = 0; i < aSelectedItems.length; i++) {
					oUploadCollection.downloadItem(aSelectedItems[i], true);
				}
			} else {
				MessageToast.show("Select an item to download");
			}
		},
		/**
		 * This will update the Models with the flag values.
		 */
		onSelectHealthSafetyCbox: function(oEvent) {
			var sFlag = oEvent.getParameter("selected") ? 'X' : '';
			var oEditModel = this.getView().getModel("FieldDataModel");
			switch (oEvent.getSource().getText()) {
				case "Asbestos":
					oEditModel.setProperty("/Asbestos", sFlag);
					break;
				case "Confined Space":
					oEditModel.setProperty("/ConfinedSpace", sFlag);
					break;
				case "Ship Hazards":
					oEditModel.setProperty("/ShipHazard", sFlag);
					break;
			}
			this.getView().getModel("detailView").setProperty("/changesToUpdate", true);
		},
		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getOwnerComponent().oListSelector.oWhenListLoadingIsDone.then(
				function() {
					this.getModel().metadataLoaded().then(function() {
						var oViewModel = this.getModel("detailView");
						oViewModel.setProperty("/infoEdit", false);
						oViewModel.setProperty("/busy", false);
						this._callDetailSetService(sObjectId);
						this.checkForIconTabSelection(this.getView().byId("iconTabBar").getSelectedKey());
					}.bind(this));
				}.bind(this),
				function(mParams) {
					if (mParams.error) {
						return;
					}
					this.getRouter().getTargets().display("detailObjectNotFound");
				}.bind(this));
			this.resetDataModel();
			sap.ui.core.BusyIndicator.hide();
		},
		_callDetailSetService: function(sId) {
			return new Promise(function(resolve, reject) {
			var oMainModel = this.getView().getModel();
			var sRequestUri = "/NotificationHeaderSet('" + sId + "')";
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/busy", false);
			oMainModel.read(sRequestUri, {
				urlParameters: {
					$expand: "Attachments,CRLinks,Notes,NotificationLinks,ApprovalRoutes,WorkOrders,Projects,Quotations"
				},
				success: function(oData, response) {
					this.initialiseDetailModel(oData);
					oViewModel.setProperty("/busy", false);
					if (this.getView().getModel("NotifType")) {
						this.getView().getModel("NotifType").setProperty("/notifNumber", sId);
					}
					this.getOwnerComponent().oListSelector.selectAListItem(sRequestUri);
					this._searchHelps(oData.Type);
					resolve();
					//this.checkForIconTabSelection(this.getView().byId("iconTabBar").getSelectedKey());
				}.bind(this),
				error: function(oError) {
					this.showServiceError(oError);
					oViewModel.setProperty("/busy", false);
					reject(oError);
				}.bind(this)
			});
			}.bind(this));
		},
		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		/**
		 * This is required for greying of fields in the approval tabs based on the line item status
		 * Instead of Customdata in the UI,this is taken care in the controller evnt
		 */
		onUpdateFinishedApprovalRoute: function(oEvent) {
			var oTable = oEvent.getSource();
			oTable.getItems().forEach(function(i) {
				var oContext = i.getBindingContext("detailModel").getObject();
				if (oContext.Status === "APPV") {
					i.getCells()[0].addStyleClass("colorGreyed");
					i.getCells()[1].addStyleClass("colorGreyed");
					i.getCells()[2].addStyleClass("colorGreyed");
					i.getCells()[7].addStyleClass("colorGreyed");
				} else {
					i.getCells()[0].removeStyleClass("colorGreyed");
					i.getCells()[1].removeStyleClass("colorGreyed");
					i.getCells()[2].removeStyleClass("colorGreyed");
					i.getCells()[7].removeStyleClass("colorGreyed");
				}
			});
		},
		/**
		 * This method will check for the validation in the Custom template tab of the Approval route dialog fragment
		 * else it will call the  structure the objects and call Post operation method
		 */
		_addCustomTemplate: function() {
			var oDataItem = this.approvalrouteAddFromTemplate.getModel("customTempModel").getData();
			var bValid = this.validateInputs(oDataItem);

			if (!bValid) {
				MessageToast.show("Please enter the values");
				return;
			} else {
				var sNotifNo = this.getView().getModel("detailModel").getProperty("/NotifNumber");
				var oPayload = {},
					items = {};
				oPayload.Step = [];
				oPayload.NotifNumber = sNotifNo;
				items.NotifNumber = sNotifNo;
				items.StepNo = oDataItem.stepNo.trim();
				items.TaskText = oDataItem.stepDesc.trim();
				items.PartnerFunc = oDataItem.partType.trim();
				items.Partner = oDataItem.groupId.trim();
				items.Group = oDataItem.groupDesc.trim();
				items.Notes = oDataItem.notes.trim();
				oPayload.Step.push(items);
				this.postApprovalStep(oPayload);
			}
		},
		/**
		 * This method will check for the validation in the Approval template tab of the Approval route dialog fragment
		 * else it will call the  structure the objects and call Post operation method
		 */
		_addFromTemplate: function() {
			var oTable = sap.ui.core.Fragment.byId("approvalrouteAddFromTemplate", "approvalTemplate"),
				sNotifNum = this.getView().getModel("detailModel").getProperty("/NotifNumber"),
				oPayload = {};
			if (oTable.getSelectedItems().length === 0) {
				MessageToast.show("Please select a template");
				return;
			}
			oPayload.Step = [];
			oPayload.NotifNumber = sNotifNum;
			oTable.getSelectedItems().forEach(function(i) {
				var oBindingContext = i.getBindingContext().getObject();
				var items = {};
				items.NotifNumber = sNotifNum;
				items.ApprovalTemp = oBindingContext.ApprovalTemp;
				items.Step = oBindingContext.Step;
				items.Action = oBindingContext.Action;
				oPayload.Step.push(items);
			}.bind(this));

			this.postApprovalStep(oPayload);
		},
		/**
		 * This Event method will be called on change of the categorisation to make a service call to the control data
		 * and change the Information edit view
		 */
		onChangeOfCategory: function(oEvent) {
			var sCategory = oEvent.getSource().getSelectedKey();
			this._formatInformationEditData(true, sCategory);
			this.getView().getModel("detailView").setProperty("/changesToUpdate", true);
		},
		onInformTabDateChange: function(oEvent) {

		},
		/* =========================================================== */
		/* begin: Handling of Search Helps for various Fields          */
		/* =========================================================== */
		handleHelpConfirm: function(oevent) { //confirm function for valuehelp 
			var oInput = sap.ui.getCore().byId(this.input);
			oInput.setSelectedKey(null);
			var sHelpData = oevent.getParameter("selectedItems")["0"].getDescription();
			var sHelpKey = oevent.getParameter("selectedItems")["0"].getTitle();
			oInput.setValue(sHelpData);
			oInput.getCustomData()["0"].setKey(sHelpKey);

			if (this.relativeInput !== undefined && this.relativeInput !== '') {
				var relativeInput = sap.ui.getCore().byId(this.relativeInput);
				relativeInput.setValue(sHelpData);
				oInput.setValue(sHelpKey);
			} else {
				oInput.setValue(sHelpData);
			}
			//Updated the below model to identify the change of Input State
			if(this.getView().byId("iconTabBar").getSelectedKey() === "infoTab"){
				this.getModel("detailView").setProperty("/changesToUpdate", true);
			}
			this.relativeInput = '';
			this.Dialog.destroy(true);
		},
		handleHelpConfirmDocType: function(oEvent){
			var helpData = oEvent.getParameter("selectedItems")["0"].getDescription();
			var helpKey = oEvent.getParameter("selectedItems")["0"].getTitle(),
			     oModel = this.getView().getModel("oAttachmentModel");
			oModel.setProperty("/TypeValue", helpData);
			oModel.setProperty("/Type", helpKey);
			this.Dialog.destroy(true);
		},
		setModelToFrag: function(oEvent) { //adding the desired model to the fragment is handled here
			this.input = oEvent.getParameter("id");
			this.Dialog.setModel(this.getBaseModel());
			this.Dialog.setModel(this.getResourceModel(), "i18n");
			this.Dialog.open();
		},
		handleValueHelpProject: function(oEvent) {
			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.projectSearchHelp", this);
			this.setModelToFrag(oEvent);
		},
		handleValueHelpFloc: function(oEvent) {
			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.flocSearchHelp", this);
			this.setModelToFrag(oEvent);
		},
		handleValueHelpPrjMng: function(oEvent) {
			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.prjMngSearchHelp", this);
			this.setModelToFrag(oEvent);
		},

		handleValueHelpProgMng: function(oEvent) {
			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.progMngSearchHelp", this);
			this.setModelToFrag(oEvent);
		},

		handleValueHelpPriorityF: function(oEvent) {
			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.priorityFleetSearchHelp", this);
			this.setModelToFrag(oEvent);
		},
		handleValueHelpPriorityE: function(oEvent) {
			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.priorityEngSearchHelp", this);
			this.setModelToFrag(oEvent);
		},

		handleValueHelpPlnNotif: function(oEvent) {
			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.plnNotifSearchHelp", this);
			this.setModelToFrag(oEvent);
		},
		handleValueHelpClient: function(oEvent) {
			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.clientSearchHelp", this);
			this.setModelToFrag(oEvent);
		},

		handleValueHelpDocTyp: function(oEvent) {
			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.docTypeSearchHelp", this);
			this.setModelToFrag(oEvent);
		},
		handleValueHelpAssetNo: function(oEvent) {
			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.asssetNoSearchHelp", this);
			this.setModelToFrag(oEvent);
		},
		handleValueHelpGroupId: function(oEvent) {
			this.input = oEvent.getParameter("id");
			var oDataItem = this.approvalrouteAddFromTemplate.getModel("customTempModel").getData();
			this._filterParams = oDataItem.partType.trim();
			if (this._filterParams === "") {
				MessageToast.show("Please Enter Partner Type");
				return;
			}
			this.relativeInput = "approvalrouteAddFromTemplate--inpGroupDesc";
			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.groupIdSearchHelp", this);
			var aFilter = [];
			var aFilter1 = new Filter("FieldName", FilterOperator.EQ, 'GROUP_ID');
			var aFilter2 = new Filter("Filter", FilterOperator.EQ, "");
			var aFilter3 = new Filter("Param2", FilterOperator.EQ, this._filterParams);
			aFilter.push(new sap.ui.model.Filter([aFilter1, aFilter2, aFilter3], true));
			this.Dialog.setModel(this.getBaseModel());
			this.Dialog.open();
			var oBinding = this.getView().byId("selectDialog").getBinding("items");
			oBinding.filter(aFilter);
		},
		handleValueHelpWBS: function(oEvent) {
			this.input = oEvent.getParameter("id");
			this.relativeInput = this.input;
			this._filterParams = this.getView().getModel("detailModel").getProperty("/Project");
			var oProjectEleData = this.projectElementsDialog.getModel(),
				sFilterValue;

			if (oProjectEleData.getProperty("/projLinkHelpText").trim() === "WBS") {
				sFilterValue = "WBS_ELEMENT";
				this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.wbsSearchHelp", this);
			} else if (oProjectEleData.getProperty("/projLinkHelpText").trim() === "Networks") {
				sFilterValue = "NETWORK_HEADER";
				this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.networkSearchHelp", this);
			}
			var aFilter = [];
			var aFilter1 = new Filter("FieldName", FilterOperator.EQ, sFilterValue);
			var aFilter2 = new Filter("Filter", FilterOperator.EQ, "");
			var aFilter3 = new Filter("Param2", FilterOperator.EQ, this._filterParams);
			aFilter.push(new sap.ui.model.Filter([aFilter1, aFilter2, aFilter3], true));
			this.Dialog.setModel(this.getBaseModel());
			var oBinding = this.getView().byId("selectDialog").getBinding("items");
			oBinding.filter(aFilter);
			this.Dialog.open();
		},
		handleValueHelpNetworkAct: function(oEvent) {
			this.input = oEvent.getParameter("id");
			this.relativeInput = this.input;
			this._filterParams = this.projectElementsDialog.getModel().getProperty("/projectElem").trim();
			if (this._filterParams === "") {
				MessageToast.show("Please Enter Network");
				return;
			}
			var sFilterValue = "NETWORK_ACTIVITY";
			var aFilter = [];
			var aFilter1 = new Filter("FieldName", FilterOperator.EQ, sFilterValue);
			var aFilter2 = new Filter("Filter", FilterOperator.EQ, "");
			var aFilter3 = new Filter("Param2", FilterOperator.EQ, this._filterParams);
			aFilter.push(new sap.ui.model.Filter([aFilter1, aFilter2, aFilter3], true));
			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.networkActSearchHelp", this);
			this.Dialog.setModel(this.getBaseModel());
			var oBinding = this.getView().byId("selectDialog").getBinding("items");
			oBinding.filter(aFilter);
			this.Dialog.open();
		},
		/**
		 * Search functionlity on the Field names.
		 */
		wildSearch: function(oEvent) {
			var value = oEvent.getParameter("value");
			var fieldName = oEvent.getSource().getCustomData()["0"].getValue();
			var aFilter = [];
			var aFilter1 = new Filter("FieldName", FilterOperator.EQ, fieldName);
			var aFilter2 = new Filter("Filter", FilterOperator.Contains, value);

			if (fieldName === "GROUP_ID" || fieldName === "WBS_ELEMENT" ||
				fieldName === "NETWORK_ACTIVITY" || fieldName === "NETWORK_HEADER") {
				var aFilter3 = new Filter("Param2", FilterOperator.EQ, this._filterParams);
				aFilter.push(aFilter1, aFilter2, aFilter3);
			} else {
				aFilter.push(aFilter1, aFilter2);
			}
			var binding = oEvent.getSource().getBinding("items");
			binding.filter(aFilter);
		},
		handleHelpClose: function() {
			this.Dialog.destroy(true);
		},
		handleEndDateChange: function(oEvent) {
			var oParameters = oEvent.getParameters(),
				oView = this.getView();
			var oEditModel = oView.getModel("FieldDataModel");
			if (!oParameters.valid) {
				MessageToast.show("Date is not Valid");
				return;
			}
			oEditModel.setProperty("/EndDate", oParameters.value);
			oView.getModel("detailView").setProperty("/changesToUpdate", true);
		},
		handleStartDateChange: function(oEvent) {
			var oParameters = oEvent.getParameters(),
				oView = this.getView();
			var oEditModel = oView.getModel("FieldDataModel");
			if (!oParameters.valid) {
				MessageToast.show("Date is not Valid");
				return;
			}
			oEditModel.setProperty("/StartDate", oParameters.value);
			oView.getModel("detailView").setProperty("/changesToUpdate", true);
		},
		onChangeInfoUpdated: function() {
			this.getView().getModel("detailView").setProperty("/changesToUpdate", true);
		},
		/**
		 * This will open the Task List - Search Fragments
		 */		
		onPressAddTaskList: function(){
			if (!this.addTaskList) {
				this.addTaskList = sap.ui.xmlfragment(this.getView().getId(),
					"zm209_chng_req.fragments.addTaskList", this);
				this.getView().addDependent(this.addTaskList);
			}
			var oTaskSearchModel = new JSONModel();
			this.addTaskList.setModel(oTaskSearchModel,"taskSearchModel");
			this._resetTaskListModel();
			this.addTaskList.open();
		},
		// TODO: Service is not built
		addTaskListFromDialog: function(){
			var bvalid = this.validateTaskFields();
			if(!bvalid){
				return;
			}
			this.addTaskList.close();
		},
		clearTaskListFromDialog: function(){
			this._resetTaskListModel();
		},
		cancelTaskListFromDialog: function(){
			this.addTaskList.close();
		},
		_resetTaskListModel: function(){
			this.addTaskList.getModel("taskSearchModel").setData({
				group: "",
				groupValueState: "None",
			    counter: "",
			    counterValueState: "None",
			    ctrNo: "",
			    ctrNoValueState: "None"
			});			
		},
		/**
		 * This will validate all the Fields of the Task List Dialog. This wil compare the property for any initial values
		 * If there is any Fields which are initial,the ValueState will be made error
		 */			
		validateTaskFields: function(){
			var oTaskInputModel = this.addTaskList.getModel("taskSearchModel"),
			     oTaskInputData = oTaskInputModel.getData(),
			     bValid = true;
			var aPropertyFields = Object.getOwnPropertyNames(oTaskInputData);
			aPropertyFields.forEach(function(i) {
				if(i.indexOf("ValueState") > 0){
					return;
				}
				if(oTaskInputData[i] === ""){
					if(oTaskInputData[i + "ValueState"] !== "undefined"){
						oTaskInputData[i + "ValueState"] = "Error";
						bValid = false;
					}
				}
				else{
					oTaskInputData[i + "ValueState"] = "None";
				}
			}.bind(this));
			oTaskInputModel.refresh();
			return bValid;
		}
	});

});