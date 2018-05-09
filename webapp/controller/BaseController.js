/*global history */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/m/MessageToast",
	"sap/ui/core/ValueState",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(Controller, History, MessageToast, ValueState, JSONModel, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("zm209_chng_req.controller.BaseController", {
		/**
		 * Convenience method for accessing the router in every controller of the application.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function() {
			return this.getOwnerComponent().getRouter();
		},

		/**
		 * Convenience method for getting the view model by name in every controller of the application.
		 * @public
		 * @param {string} sName the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function(sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model in every controller of the application.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function(oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Convenience method for getting the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function() {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Event handler for navigating back.
		 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the master route.
		 * @public
		 */
		onNavBack: function() {
			var sPreviousHash = History.getInstance().getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
				history.go(-1);
			} else {
				this.getRouter().navTo("master", {}, true);
			}
		},
		getBaseModel: function() {
		
			return this.getOwnerComponent().getModel();
		},
		onDuplicationCheck: function(obj, initiaModelData, length, key) {
			if (length !== 0) {
				for (var i = 0; i < length; i++) {
					var attribute = Object.getOwnPropertyNames(initiaModelData[0])[0];
					if (initiaModelData[i][attribute] === obj[attribute]) {
						key = "same";
						sap.m.MessageToast.show("Cr Notification Already Exists");

						break;

					} else {
						key = "unique";

					}
				}
				return key;
			} else {
				key = "unique";
				return key;
			}
		},	
		getResourceModel: function() {
			return this.getView().getModel("i18n");
		},
		spliceTypeData: function(data) {
			for (var i = 0; i < data.length; i++) {
				delete data[i].Type;
			}
			return data;
		},		
		/**
		 * This Will set the Respective Button for Visibile enabled/disabled
		 */
		btnFooterVisibility: function(sEdit, sSave, sCancel) {
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/edit", sEdit);
			oViewModel.setProperty("/save", sSave);
			oViewModel.setProperty("/cancel", sCancel);
		},
		/**
		 * This is a validation which will check if the Mandatory fields have been filled from the Control data Model
		 * and return true/false
		 */
		validateControlDataFields: function(oControlData, oInitialData) {
			var bValid = true;
			oControlData.results.forEach(function(i) {
				if (oInitialData.hasOwnProperty(i.PropertyName) &&
					i.DispControl === "M" && oInitialData[i.PropertyName] === "") {
					bValid = false;
				}
			});
			return bValid;
		},
		/**
		 * This method will call the Approval Date Post service  which will be based on the approvalRouteModel model
		 * and Process will be 'D' for date change
		 * @param sData - Data model to be updated
		 * i - index of the data model
		 */
		_callDateChangeRecursion: function(sData, i) {
			if (typeof sData[i] !== "undefined") {
				var oStatusChangePayload = {};
				oStatusChangePayload.NotifNumber = this.getView().getModel("detailModel").getProperty("/NotifNumber");
				oStatusChangePayload.Status = "";
				oStatusChangePayload.StepKey = sData[i].StepKey;
				oStatusChangePayload.Process = "D";
				oStatusChangePayload.Date = sData[i].Date;
				var URL = "/ApprovalRouteSet";
				this.getOwnerComponent().getModel().create(URL, oStatusChangePayload, {
					success: function(oData) {
						var index = i + 1;
						this._callDateChangeRecursion(sData, index);
					}.bind(this),
					error: function(Error) {
						this.showServiceError(Error);

					}.bind(this)
				});
			} else {
				MessageToast.show("Date has been updated");
				this.getView().getModel("approvalRouteModel").setData([]);
				this.btnFooterVisibility(true, false, false);
			}
		},
		/**
		 * Post method to call the APproval status of the approval tab.Master App will refresh depending upon the 
		 * condition
		 * @param oStatusChangePayload - Payload
		 * sMessage - Toast Messages
		 * masterRefresh- If true, master app will be refreshed
		 */
		callStatusChangeService: function(oStatusChangePayload, sMessage, masterRefresh) {
			var sURL = "/ApprovalRouteSet";
			this.getOwnerComponent().getModel().create(sURL, oStatusChangePayload, {
				success: function(oData) {
					MessageToast.show(sMessage);
					this._callDetailSetService(this.getView().getModel("detailModel").getProperty("/NotifNumber"));
					if (masterRefresh) {
						this.getView().getParent().getParent().getMasterPages()[0].getController().onRefresh();
					}

				}.bind(this),
				error: function(Error) {
					this.showServiceError(Error);
				}.bind(this)
			});
		},
		/**
		 * This will initialise the route model
		 */
		resetDataModel: function() {
			var oDateJsonModel = new sap.ui.model.json.JSONModel();
			oDateJsonModel.setData([]);
			this.getView().setModel(oDateJsonModel, 'approvalRouteModel');
		},
		/**
		 * Method will assign the underline css changes to the Notes tab depending upong the step key
		 */
		_showTextDecoration: function(sStepKey) {
			var oDataItem = this.getView().getModel("detailModel");
			oDataItem.getData().Notes.results.forEach(function(i) {
				if (i.StepKey === sStepKey) {
					i.textDecoration = "true";
					return;
				} else {
					i.textDecoration = "";
				}
			});
			oDataItem.refresh();
		},
		/**
		 * Validate of the inputs from the Approval route templates
		 * @param oDataItem - Items to be posted
		 * @return boolean to check for any empty fields
		 */
		validateInputs: function(oDataItem) {
			var bValid = true;
			if (oDataItem.stepNo.trim() === "") {
				this._setApprovalRouteTemplateValueStates("inpStepNo", "Error");
				bValid = false;
			} else {
				this._setApprovalRouteTemplateValueStates("inpStepNo", "None");
			}
			if (oDataItem.stepDesc.trim() === "") {
				this._setApprovalRouteTemplateValueStates("inpStepDesc", "Error");
				bValid = false;
			} else {
				this._setApprovalRouteTemplateValueStates("inpStepDesc", "None");
			}
			if (oDataItem.partType.trim() === "") {
				this._setApprovalRouteTemplateValueStates("cbPartType", "Error");
				bValid = false;
			} else {
				this._setApprovalRouteTemplateValueStates("cbPartType", "None");
			}
			if (oDataItem.groupId.trim() === "") {
				this._setApprovalRouteTemplateValueStates("inpGroupId", "Error");
				bValid = false;
			} else {
				this._setApprovalRouteTemplateValueStates("inpGroupId", "None");
			}
			if (oDataItem.groupDesc.trim() === "") {
				this._setApprovalRouteTemplateValueStates("inpGroupDesc", "Error");
				bValid = false;
			} else {
				this._setApprovalRouteTemplateValueStates("inpGroupDesc", "None");
			}
			if (oDataItem.notes.trim() === "") {
				this._setApprovalRouteTemplateValueStates("textAreaCustomNotes", "Error");
				bValid = false;
			} else {
				this._setApprovalRouteTemplateValueStates("textAreaCustomNotes", "None");
			}
			return bValid;
		},
		/**
		 * Setting the value state to the fields
		 * @param sId - Field Id
		 * @param sState Error/None
		 */
		_setApprovalRouteTemplateValueStates: function(sId, sState) {
			sap.ui.core.Fragment.byId("approvalrouteAddFromTemplate", sId).setValueState(sState);
		},
		/**
		 * Post Service - Add step service which will post the records from the approval routes tab
		 * It will close the dialog fragments and refresh the app
		 * @param oPayload - Payload for the Post service
		 */
		postApprovalStep: function(oPayload) {
			var oDefaultoModel = this.getOwnerComponent().getModel(),
				oViewModel = this.getModel("detailView"),
				sServiceUrl = "/AddStepSet";
			var mParameters = {
				success: function(oData, response) {
					MessageToast.show("Approval Route Step has been added");
					this._callDetailSetService(this.getView().getModel("detailModel").getProperty("/NotifNumber"));
					this.approvalrouteAddFromTemplate.close();
					oViewModel.setProperty("/busy", false);
				}.bind(this),
				error: function(oError) {
					this.showServiceError(oError);
					oViewModel.setProperty("/busy", false);
				}.bind(this)
			};
			oDefaultoModel.create(sServiceUrl, oPayload, mParameters);
		},
		/**
		 * This method will bind the records from the notes tab to a model and this will  insert a new fragment
		 * in the notes tab and bind the JSON model
		 * @param sItem - Object for setting the notes tab model
		 */
		showNewNotesTab: function(oItem) {
			if (!this.newNotes) {
				this.newNotes = sap.ui.xmlfragment("newNotesFragment", "zm209_chng_req.fragments.Tabs.newNotes", this);
				this.getView().addDependent(this.newNotes);
			}
			oItem.NotesText = "";
			var notesData = new JSONModel();
			notesData.setData(oItem);
			this.newNotes.setModel(notesData);
			this.btnFooterVisibility(false, true, true);
			this.getView().byId("iconTabBarNotes").removeAllContent();
			this.getView().byId("iconTabBarNotes").insertContent(this.newNotes);
		},
		/**
		 * This method will delete the Link service records based on the field id and order number
		 * @param sFieldId - Field ids of the Link
		 * @param sWorkOrder - Order number of the links
		 * @param sMessage - Toast Message
		 */
		deleteLinkService: function(sFieldId, sWorkOrder,sNetwork, sMessage) {
			var oViewModel = this.getModel("detailView");

			oViewModel.setProperty("/busy", true);
			var oDefaultoModel = this.getOwnerComponent().getModel();
			var serviceUrl = "/ProjectSet(FieldId='" + sFieldId + "',NotifNumber='" + this.getView().getModel("detailModel").getProperty(
					"/NotifNumber") + "',Value='" +
				sWorkOrder +
				"',Network='"+ sNetwork +  "')";
			var mParameters = {
				success: function(oData, response) {
					MessageToast.show(sMessage);
					this._callDetailSetService(this.getView().getModel("detailModel").getProperty("/NotifNumber"));
					oViewModel.setProperty("/busy", false);
				}.bind(this),
				error: function(oError) {
					this.showServiceError(oError);
					oViewModel.setProperty("/busy", false);
				}.bind(this)
			};
			oDefaultoModel.remove(serviceUrl, mParameters);
		},
		/**
		 * This method call attachment service to get the list of the attachments and bind it to the model
		 * @param oItemList - Object for the service filter
		 */
		attachmentListModel: function(oItemList) {
			var oDefaultoModel = this.getModel();
			var oDownloadAttachJSONModel = new JSONModel();
			this.downloadAttachDialog.setModel(oDownloadAttachJSONModel, "downloadAttachModel");
			return new Promise(function(resolve, reject) {
				//var serviceUrl = "/AttachmentsSet?$filter=(DocumentType eq " + itemList.DocumentType + " and DocumentNumber eq " + itemList.DocumentNumber + " and DocumentVersion eq " + itemList.DocumentVersion + " and DocumentPart eq " + itemList.DocumentPart + ")";
				var serviceUrl = "/AttachmentsSet";
				var filter = [];
				var filter1 = new Filter({
					filters: [
						new Filter("DocumentType", FilterOperator.EQ, oItemList.DocumentType),
						new Filter("DocumentNumber", FilterOperator.EQ, oItemList.DocumentNumber),
						new Filter("DocumentVersion", FilterOperator.EQ, oItemList.DocumentVersion),
						new Filter("DocumentPart", FilterOperator.EQ, oItemList.DocumentPart)
					],
					and: true
				});
				filter.push(filter1);
				var mParameters = {
					filters: filter,
					success: function(oData, response) {
						oData.results.forEach(function(i) {
							i.uri = "/sap/opu/odata/sap/ZGW_PM_CR_MGMT_SRV/FileSet(FileId='" + i.FileId + "',StoreCat='" + i.StoreCat +
								"',FileName='" + i.FileName + "')/$value";
						});
						oDownloadAttachJSONModel.setData(oData);
						oDownloadAttachJSONModel.updateBindings();
						resolve();

					}.bind(this),
					error: function(oError) {
						reject(oError);
					}
				};
				oDefaultoModel.read(serviceUrl, mParameters);
			}.bind(this));
		},
		/**
		 * This method filter the records in the Approval routes tab basedon the from and to dates
		 * @param sDateFrom - From Date
		 * @param sDateTo - To date
		 */
		handleFilterDates: function(sDateFrom, sDateTo) {
			var afilter = [];
			var aFilter1 = new Filter({
				filters: [
					new Filter("Date", FilterOperator.GE, sDateFrom),
					new Filter("Date", FilterOperator.LE, sDateTo)
				]
			});
			afilter.push(aFilter1);

			var table = sap.ui.core.Fragment.byId("approvalrouteFragment", "apprRouteTable");
			var bind = table.getBinding("items");
			bind.filter(afilter);
		},
		/**
		 * This method will remove the records of fieldvalue which is null and return it.
		 * @param roleData - data records from the service
		 */
		_addRolesPropertyToModel: function(oRoleData) {
			var oControlData = {};
			oRoleData.results.forEach(function(i) {
				if (i.PropertyName !== "") {
					oControlData[i.PropertyName] = i.DispControl;
				}
			}.bind(this));
			return oControlData;
		},
		/**
		 * This method will remove the records of fieldvalue which is null and return it.
		 * @param roleData - data records from the service
		 */
		_callRoleServiceInfoEdit: function(sType, sCategory, sHeadStat, sUserStat) {
			return new Promise(function(resolve, reject) {
				var aFilters = [];
				var oDefaultoModel = this.getOwnerComponent().getModel();
				aFilters = [new Filter("NotType", FilterOperator.EQ, sType),
					new Filter("ZzCategorisation", FilterOperator.EQ, sCategory),
					new Filter("HeadStat", FilterOperator.EQ, sHeadStat),
					new Filter("UserHeadStat", FilterOperator.EQ, sUserStat)
				];
				var mParameters = {
					filters: aFilters,
					success: function(oData, response) {
						resolve(oData);
					},
					error: function(oError) {
						this.showServiceError(oError);
						reject();
					}.bind(this)
				};
				oDefaultoModel.read("/ControlDataSet", mParameters);
			}.bind(this));
		},
		/**
		 * This Event method will not allow the user to enter in the combo box. Only Search help to be used
		 * @param oEvent - Event
		 */
		onWrongInput: function(oEvent) {
			var newValue = oEvent.getParameter("newValue");
			if (newValue !== "") {
				oEvent.getSource().setValue("");
				sap.m.MessageBox.error("Please make use of search help");
				//this.getModel("detailView").setProperty("/changesToUpdate", true);
			}
		},
		/**
		 * This Event method will not allow the user to enter in the input field
		 * @param oEvent - Event
		 */
		onKeyReset: function(oEvent) {
			var Value = oEvent.getParameter("newValue");
			if (Value === "") {
				oEvent.getSource().getCustomData()["0"].setKey("");
			}
		},
		/**
		 * This Event method will not allow the user to enter in the combo box
		 * if unwanted data is set in the drop down  it should rejected
		 * @param oEvent - Event
		 */
		setNull: function(oEvent) {
			if (oEvent.getSource().getSelectedKey() === "") {
				oEvent.getSource().setValue("");
			}
			else{
				this.getModel("detailView").setProperty("/changesToUpdate", true);
			}
		},

		/**
		 * This method will save the data from the information edit tab model and call the post service
		 * @param oInitialData - Data object to be posted
		 */
		postInformationData: function(oInitialData) {
			var oViewModel = this.getModel("detailView"),
				oDefaultoModel = this.getOwnerComponent().getModel(),
				sServiceUrl = "/NotificationHeaderSet";

			var oPayload;
			oPayload = {};
			oPayload = oInitialData;
			oPayload.StartDate = oPayload.StartDate === "" ? null : oPayload.StartDate;
			oPayload.EndDate = oPayload.EndDate === "" ? null : oPayload.EndDate;
			oPayload.NotificationLinks = [];
			oPayload.CRLinks = [];
			oPayload.Quotations = [];
			oPayload.Attachments = [];
			oPayload.ApprovalRoutes = [];
			oPayload.Projects = [];
			oPayload.Notes = [];
			oPayload.WorkOrders = [];
			oPayload.NotifNumber = this.getView().getModel("detailModel").getProperty("/NotifNumber");
			oViewModel.setProperty("/busy", true);
			var mParameters = {
				success: function(oData, response) {
					this.getModel("detailView").setProperty("/changesToUpdate", false);
					this.btnFooterVisibility(true, false, false);
					this._callDetailSetService(oData.NotifNumber);
					this.getView().getModel("FieldDataModel").setData([]);
					this.getView().byId("iconTabBarInform").removeAllContent();
					var infoFragment = sap.ui.xmlfragment("infoDisplayFragment","zm209_chng_req.fragments.Tabs.informationTab", this.getView().getController());
						this.getView().addDependent(infoFragment);
					this.getView().byId("iconTabBarInform").insertContent(infoFragment);
					this.getView().getParent().getParent().setMode("ShowHideMode");
					oViewModel.setProperty("/busy", false);
					oViewModel.setProperty("/infoEdit", false);
					MessageToast.show("Information tab has been updated");
				}.bind(this),
				error: function(oError) {
					this.showServiceError(oError);
					oViewModel.setProperty("/busy", false);

				}.bind(this)
			};
			oDefaultoModel.setRefreshAfterChange(false);// This has to set to false else it will call the Notification Read Set after  Post
			oDefaultoModel.create(sServiceUrl, oPayload, mParameters);
		},
		/**
		 * This method will get the data from the approval or notes tab and call Post operation
		 * @param oDataItem - Data object to be posted Depending upon the status, Message toast ill be called
		 */
		postNotesData: function(oDataItem) {
			var oStatusChangePayload = {};
			oStatusChangePayload.NotifNumber = this.getView().getModel("detailModel").getProperty("/NotifNumber");
			oStatusChangePayload.Status = oDataItem.Status === undefined ? "" : oDataItem.Status;
			oStatusChangePayload.StepKey = oDataItem.StepKey;
			oStatusChangePayload.Process = "S";
			oStatusChangePayload.Notes = oDataItem.NotesText;
			var msgText,
				bMasterRefresh = false;
			if (oStatusChangePayload.Status === "") {
				msgText = "Notes has been updated";
			} else {
				msgText = "Status has been updated";
				bMasterRefresh = true;
			}
			this.callStatusChangeService(oStatusChangePayload, msgText, bMasterRefresh);
			this.getView().byId("iconTabBarNotes").removeAllContent();
			this.getView().byId("iconTabBarNotes").insertContent(this.getView().byId("notesFragment--detail"));
			this.btnFooterVisibility(true, false, false);
		},
		/**
		 * This method will initialise the dropdown models and field data models 
		 */
		setDetailModels: function() {
			var oDropdownData = {
				// Project: [],
				ApprovalTemplate: [],
				SubType: [],
				Categorisation: [],
				ProgramArea: [],
				AssetNumber: [],
				COM: [],
				TAF: [],
				Stores: [],
				Itar: [],
				EmpPriority: [],
				FundingStream: [],
				Enhancement: [],
				Acceptance: [],
				Quotation: [],
				addField: [],
				Curr: [],
				PartnerType: [],
				WBS: [],
				Networks: [],
				NetworkAct: []

			};
			//All the dropdowns are binded to this model
			var oDropdown = new JSONModel();
			oDropdown.setData(oDropdownData);
			this.getView().setModel(oDropdown, "dropDown");
			// THis is to bind Information Edit tab fields
			var oFieldDataModel = new JSONModel();
			this.getView().setModel(oFieldDataModel, "FieldDataModel");
			oFieldDataModel.setData([]);
			//AttachmentModel
			var oAttachmentModel = new JSONModel({
				Type: "",
				AttachNumber: "",
				AttachVersion: "",
				AttachPart: "",
				AttachDesciption: ""
			});
			this.getView().setModel(oAttachmentModel, "oAttachmentModel");
		},
		_searchHelps: function(sType) {
				var secondFilter;
				if (sType === "ZC") {
					secondFilter = "F";
				}
				if (sType === "ZD") {
					secondFilter = "EN";
				}
				if (sType === "ZE") {
					secondFilter = "EMP";
				}
				if (sType === "ZF") {
					secondFilter = "TAF";
				}
                this.comboModelFunction("COM", "ZZ_COMINPUT", secondFilter);
				this.comboModelFunction("TAF", "ZZ_TAF_REQ", secondFilter);
				this.comboModelFunction("Acceptance", "ZZ_ACCPTLVL", secondFilter);
				this.comboModelFunction("Stores", "ZZ_STOREPRO", secondFilter);
				this.comboModelFunction("Itar", "ZZ_ITARCTL", secondFilter);
				this.comboModelFunction("Enhancement", "ZZ_ENHFIT", secondFilter);
				this.comboModelFunction("ApprovalTemplate", "APPROVAL_TEMPLATE", secondFilter);
				this.comboModelFunction("Curr", "CURRENCY");
				this.comboModelFunction("EmpPriority", "ZZ_CAT_ASS", secondFilter);
				this.comboModelFunction("FundingStream", "ZZ_CDEL_RDEL", secondFilter);
				this.comboModelFunction("SubType", "ZZ_CRSUTYP", secondFilter);
				this.comboModelFunction("Project", "PROJECT");
				this.comboModelFunction("Categorisation", "ZZ_Categorisation", secondFilter);
				this.comboModelFunction("AssetNumber", "ASSETNUMBER");
				this.comboModelFunction("ProgramArea", "ZZ_PROG_AREA", secondFilter);
				this.comboModelFunction("PartnerType", "PARTNER_FUNCTION", secondFilter);

		},
		/**
		 * This method will save the date changed records of the approval tab and save it to a model For save Operation
		 * Duplicate entries should be avoided
		 * @param oItem  - Changed data
		 *  @param oApprData  - Existing Data object
		 */
		updateApprDateChangeModel: function(oItem, oApprData) {
			if (oApprData.length > 0) {
				var exist = false;
				oApprData.forEach(function(value) {
					if (value.ApprovalTemp === oItem.ApprovalTemp && value.StepKey === oItem.StepKey && value.Step === oItem.Step) {
						oItem.Date = new Date(value.Date);
						exist = true;
						return;
					}
				});
				if (!exist) {
					oApprData.push(oItem);
				}
			} else {
				oApprData.push(oItem);
			}
		},
		/**
		 * This method create a Payload for status change service
		 * @param sTitle,sStatus,sKey,sProcess,sNotes - values to be passed to the service
		 */
		setStatusPayload: function(sTitle, sStatus, sKey, sProcess, sNotes) {
			var oPayload = {};
			oPayload.NotifNumber = sTitle;
			oPayload.Status = sStatus;
			oPayload.StepKey = sKey;
			oPayload.Process = sProcess;
			oPayload.Notes = sNotes;
			return oPayload;
		},
		/**
		 * This method will clear all the value states of the Dialog fragment
		 */
		clearApprovalFieldsAndModels: function() {
			this._setApprovalRouteTemplateValueStates("inpStepNo", "None");
			this._setApprovalRouteTemplateValueStates("inpStepDesc", "None");
			this._setApprovalRouteTemplateValueStates("cbPartType", "None");
			this._setApprovalRouteTemplateValueStates("inpGroupId", "None");
			this._setApprovalRouteTemplateValueStates("inpGroupDesc", "None");
			this._setApprovalRouteTemplateValueStates("textAreaCustomNotes", "None");
			this._resetCustomTemplateModel();
		},
		/**
		 * This method will reset the models
		 */
		_resetCustomTemplateModel: function() {
			var oCustomTemplateJsonModel = new JSONModel();
			oCustomTemplateJsonModel.setData({
				"stepNo": "",
				"stepDesc": "",
				"groupId": "",
				"partType": "",
				"groupDesc": "",
				"notes": ""
			});
			this.approvalrouteAddFromTemplate.setModel(oCustomTemplateJsonModel, "customTempModel");
		},
		comboModelFunction: function(array, filterValue, secondfilter) {
			var oDefaultoModel = this.getOwnerComponent().getModel();
			var dropModel = this.getView().getModel("dropDown");
			var aFilters = [];
			return new Promise(function(resolve, reject) {
				var serviceUrl = "/SearchHelpSet";
				if (secondfilter !== undefined && secondfilter !== null) {
					aFilters = [new Filter("FieldName", FilterOperator.EQ, filterValue),
						new Filter("Filter", FilterOperator.EQ, secondfilter)
					];
				} else {
					aFilters = [new Filter("FieldName", FilterOperator.EQ, filterValue)];
				}
				var mParameters = {

					filters: aFilters,
					success: function(oData, response) {
						dropModel.getData()[array] = oData.results;
						dropModel.updateBindings();
						resolve();

					}.bind(this),
					error: function(oError) {
						reject();
					}
				};
				oDefaultoModel.read(serviceUrl, mParameters);
			});
		},
		handleSearch: function(oEvent) { // handle Search functionallity for the F4 help
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter({
				filters: [
					new Filter({
						path: "DocumentNumber",
						operator: FilterOperator.Contains,
						value1: sValue
					}),
					new Filter({
						path: "Description",
						operator: FilterOperator.Contains,
						value1: sValue
					})
				],
				and: false
			});

			oEvent.getSource().getBinding("items").filter([oFilter]);
		},
		/**
		 * This method will call remove operations for deleting the attachments in the attachment tab
		 * @param oItems - Objects value to be deleted
		 */
		removeAttachmentList: function(oItems) {
			var oDefaultoModel = this.getOwnerComponent().getModel();
			var sServiceUrl = "/AttachmentsSet(DocumentType='" + oItems.DocumentType + "',DocumentNumber='" + oItems.DocumentNumber +
				"',DocumentVersion='" + oItems.DocumentVersion + "',DocumentPart='" + oItems.DocumentPart + "',NotifNumber='" + this.getView().getModel(
					"detailModel").getProperty("/NotifNumber") + "')";
			var mParameters = {
				success: function(oData, response) {
					MessageToast.show("Attachment has been deleted");
					this._callDetailSetService(this.getView().getModel("detailModel").getProperty("/NotifNumber"));
				}.bind(this),
				error: function(oError) {
					this.showServiceError(oError);
				}.bind(this)
			};
			oDefaultoModel.remove(sServiceUrl, mParameters);
		},
		/**
		 * This method will delete the approval route records in the approval route tab
		 * @param oItems - Payload items to be passed
		 */
		deleteApprovalRoutes: function(oItems, sMessage) {
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/busy", true);
			var oDefaultoModel = this.getOwnerComponent().getModel();
			var sServiceUrl = "/ApprovalRouteSet(NotifNumber='" + this.getView().getModel("detailModel").getProperty("/NotifNumber") +
				"',ApprovalTemp='" + oItems.ApprovalTemp +
				"',Step='" + oItems.Step + "',StepKey='" + oItems.StepKey + "')";
			var mParameters = {
				success: function(oData, response) {
					MessageToast.show(sMessage);
					this._callDetailSetService(this.getView().getModel("detailModel").getProperty("/NotifNumber"));
					oViewModel.setProperty("/busy", false);
				}.bind(this),
				error: function(oError) {
					this.showServiceError(oError);
					oViewModel.setProperty("/busy", false);
				}.bind(this)
			};
			oDefaultoModel.remove(sServiceUrl, mParameters);
		},
		/**
		 * This method will set the detail model with the record from the read service
		 * @param oDetailData - read service record
		 */
		initialiseDetailModel: function(oDetailData) {
			var oView = this.getView();
			if (typeof oView.getModel('detailModel') !== "undefined") {
				oView.getModel('detailModel').setData(oDetailData);
				oView.getModel('detailModel').refresh();

			} else {
				var oJsonModel = new JSONModel();
				oJsonModel.setData(oDetailData);
				oView.setModel(oJsonModel, 'detailModel');

			}
		},
		/**
		 * Error handling of all the service calls made
		 * @param oError - Error object to be passed
		 */
		showServiceError: function(oError) {
			var sErrorText = JSON.parse(oError.responseText).error.message.value;
			sap.m.MessageBox.error(sErrorText, {
				title: "Error",
				onClose: null,
				styleClass: "",
				initialFocus: null,
				textDirection: sap.ui.core.TextDirection.Inherit
			});
		},
		/**
		 * This will call the Role service data to check for the mandatory fields and show the information edit fragments
		 * set the buttons visiblity
		 * @params: sOnChange - Check if there is a chagne in Subtpe, If true, sOnchange will be true else it will be false
		 * sNewCategory - This will have the changed category
		 */
		_formatInformationEditData: function(sOnChange,sNewCategory) {
			// Call role serivce to make the inputs readonly/mandatory
			var oViewModel = this.getModel("detailView"),
				oDetailData = this.getView().getModel('detailModel').getData(),
				sCategory;
				if(sOnChange){
					sCategory = sNewCategory;
				}
				else{
					sCategory = oDetailData.Categorisation;
				}
			oViewModel.setProperty("/busy", true);
			this._callRoleServiceInfoEdit(oDetailData.Type, sCategory, oDetailData.NotifSystemStatus, oDetailData.NotifUserStatus)
				.then(function(oDisplayData) {
					this.getView().getParent().getParent().setMode("HideMode");
					
					if (!this.infoTabEditFrag && !sOnChange) {
						this.infoTabEditFrag = sap.ui.xmlfragment("infoTabEdit", "zm209_chng_req.fragments.Tabs.informationTabEditMode", this);
						this.getView().addDependent(this.infoTabEditFrag, this);
						oViewModel.setProperty("/changesToUpdate", false);
					}
					this._setDataModelsForDisplay(oDisplayData, oDetailData,sCategory);
					if(!sOnChange){
					this.getView().byId("iconTabBarInform").removeAllContent();
					this.getView().byId("iconTabBarInform").insertContent(this.infoTabEditFrag);
					//Button Visibility
					this.btnFooterVisibility(false, true, true);
					}
					oViewModel.setProperty("/infoEdit", false);//This was earlier true to take care of switching tab functionality
					oViewModel.setProperty("/busy", false);

				}.bind(this))
				.catch(function(sErrorText) {
					oViewModel.setProperty("/busy", false);
					this.showServiceError(sErrorText);
				}.bind(this));

		},
		/* This will get the data from the role display service and move it to the Information edit model
		 * @param oDisplayData -Control model for role display
		 * @param oDetailData - Model to get/save the records
		 */
		_setDataModelsForDisplay: function(oDisplayData, oDetailData,sCategory) {
			//Unclone the data models using JSON.parse and not sure whether this is standard
			var oDataCopy = JSON.parse(JSON.stringify(oDetailData));
			var oFormatDate = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-ddT00:00:00"
			});
			//The Date format changes because of uncloning it.Hence need to format it
			oDataCopy.StartDate = oDataCopy.StartDate === null ? oDataCopy.StartDate :  oFormatDate.format(new Date(oDataCopy.StartDate));
			oDataCopy.EndDate = oDataCopy.EndDate === null ? oDataCopy.EndDate :  oFormatDate.format(new Date(oDataCopy.EndDate)); 
			oDataCopy.DateRaised = oFormatDate.format(new Date(oDataCopy.DateRaised));
			oDataCopy.Categorisation = sCategory;
			this.getView().getModel('FieldDataModel').setData(oDataCopy);
			this._displayControlData = oDisplayData;
			var roleData = this._addRolesPropertyToModel(oDisplayData);
			var oDispControlJSONModel = new JSONModel();
			oDispControlJSONModel.setData(roleData);
			this.infoTabEditFrag.setModel(oDispControlJSONModel, 'dispControlModel');
		},
		/**
		 * Post method to call the APproval status in the Master List.Master will refresh After the call is successful
		 * @param oStatusChangePayload - Payload
		 * sMessage - Toast Messages
		 * masterRefresh- If true, master app will be refreshed
		 */
		callStatusChgFromMaster: function(oStatusChangePayload, sMessage) {
			var sURL = "/ApprovalRouteSet";
			this.getModel().create(sURL, oStatusChangePayload, {
				success: function(oData) {
					MessageToast.show(sMessage);
					this.onRefresh();

				}.bind(this),
				error: function(Error) {
					this.showServiceError(Error);
				}.bind(this)
			});
		},
		/**
		 * Filter records for the filter Dialog popup
		 */
		getFilterObjectRecords: function(oListdata) {
			var aNotifNumber = [];
			oListdata.results.forEach(function(a) {
				aNotifNumber.push({
					value: a.NotifNumber
				});
			});
			var oFilterObj = {
				data: [{
					title: "Notification Number",
					items: aNotifNumber
				}]
			};
			return oFilterObj;
		},
		/**
		 * Create an object for the model binding depending upon the Tab bar selected
		 */ 
		popObjForProjEle: function(sKey) {
			var oProjModelData = {};
			switch (sKey) {
				case "WBS":
					oProjModelData = {
						title: "Select WBS",
						projLinkHelpText: "WBS",
						networkVisible: false,
						customValue: "WBS",
						projectElem: "",
						networkAct: ""
					};
					break;
				case "Networks":
					oProjModelData = {
						title: "Select Networks",
						projLinkHelpText: "Networks",
						networkVisible: false,
						customValue: "Networks",
						projectElem: "",
						networkAct: ""
					};
					break;
				case "NetworkAct":
					oProjModelData = {
						title: "Select Network Activities",
						projLinkHelpText: "Networks",
						networkVisible: true,
						customValue: "NetworksAct",
						projectElem: "",
						networkAct: ""
					};
					break;
			}
			return oProjModelData;
		},
		postProjectElements: function(oPayload, sMessage) {
			var sServiceUrl = "/ProjectSet",
				oDefaultoModel = this.getView().getModel();
			var mParameters = {
				success: function(oData, response) {
					MessageToast.show(sMessage);
					this.projectElementsDialog.close();
					this._callDetailSetService(this.getView().getModel("detailModel").getProperty("/NotifNumber"));
				}.bind(this),
				error: function(oError) {
					this.showServiceError(oError);
				}.bind(this)
			};
			oDefaultoModel.create(sServiceUrl, oPayload, mParameters);
		},
		/**
		 * This will change the screen from Full screen back to Split screen
		 */
		 _setSplitScreenMode: function(){
		 	var oSplitApp = this.getView().getParent().getParent();
		 	if (oSplitApp.getMode() === "HideMode") {
							oSplitApp.setMode("ShowHideMode");
			}
		 }		
	});

});