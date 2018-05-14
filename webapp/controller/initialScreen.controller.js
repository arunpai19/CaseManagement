sap.ui.define([
	"zm209_chng_req/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"zm209_chng_req/util/formatter"
], function(BaseController, JSONModel, Filter, FilterOperator, MessageBox, formatter) {
	"use strict";

	return BaseController.extend("zm209_chng_req.controller.initialScreen", {
		formatter: formatter,
		// function for intialization of the screen fields
		//functions for visiblity of the fields

		onInit: function() {
			this.modelInitialize();
			this.onValueIntialize();
			this.propControl();
			this.docAttachmentModel();
			this.noftifTypeReset();
		},

		onWrongInput: function(oEvent) {

			if (oEvent.getSource().getSelectedKey() === "" && oEvent.getParameter("newValue") !== "") {
				oEvent.getSource().setValue("");
				sap.m.MessageBox.error("Invalid Data entry");
			} else if (oEvent.getSource().getSelectedKey() !== null && oEvent.getSource().getSelectedKey() !== undefined) {
				oEvent.getSource().getCustomData()[0].setKey(oEvent.getSource().getSelectedKey());
			}
		},
		onKeyReset: function(oEvent) { //reset the value in Iput field if direct entry is done

			var Value = oEvent.getParameter("newValue");
			if (Value === "") {
				oEvent.getSource().getCustomData()["0"].setKey("");
			}
		},
		setNull: function(oEvent) { // if unwanted data is set in the drop down  it should rejected
			if (oEvent.getSource().getSelectedKey() === "") {
				oEvent.getSource().setValue("");
			}
		},
		docNumberChange: function(oEvent) {
			var newDocNum = oEvent.getParameter("newValue");
			if (newDocNum === "") {
				var attachModel = this.getView().getModel("oAttachmentModel");
				attachModel.setProperty("/AttachVersion", "");
				attachModel.setProperty("/AttachPart", "");
				attachModel.setProperty("/AttachDesciption", "");
			}
		},
		onValueIntialize: function() { // function to set the description on the detailed fragment view
			var value = {
				"Program": "",
				"SubType": "",
				"Category": "",
				"Project": "",
				"AssetNumber": ""
			};
			var valueModel = new JSONModel();
			valueModel.setData(value);
			this.getView().setModel(valueModel, "valueModel");

		},
		noftifTypeReset: function() { // model for the different types of notification on the screen

			var checkBoxModel = new JSONModel({
				"Fleet": "",
				"Eng": "",
				"Emp": "",
				"Taf": ""

			});
			this.getView().setModel(checkBoxModel, "checkBoxModel");
			var value = this.getView().getModel("valueModel");
			value.setProperty("/Project", "");

		},
		propControl: function() { // function to control the visibilty  of simpleform and the button 
			var oVisibleModel = new JSONModel({
				nextVisible: true,
				backVisible: false,
				createVisible: false,
				warShipForm: false,
				baseForm: false

			});
			this.getView().setModel(oVisibleModel, "oVisibleModel");
		},
		docAttachmentModel: function() { //  function for creation of model for attachment data 
			var oAttachmentModel = new JSONModel({
				Type: "",
				TypeValue: "",
				AttachNumber: "",
				AttachVersion: "",
				AttachPart: "",
				AttachDesciption: ""
			});
			this.getView().setModel(oAttachmentModel, "oAttachmentModel");
		},

		modelInitialize: function() { // model for all the fields , model for quotation, notification , cr linked, attachmet and the dropDowns
			var dropdownData = {

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
				Curr: []

			};

			var Dropdown = new JSONModel();
			Dropdown.setData(dropdownData);
			this.getView().setModel(Dropdown, "dropDown");

			var crModel = new JSONModel();
			this.crArr = [];
			crModel.setData(this.crArr);
			this.getView().setModel(crModel, "crModel");

			var notificationModel = new JSONModel();
			this.notifArr = [];
			notificationModel.setData(this.notifArr);
			this.getView().setModel(notificationModel, "notificationModel");

			var quotationModel = new JSONModel();
			this.quotationArr = [];
			quotationModel.setData(this.quotationArr);
			this.getView().setModel(quotationModel, "quotationModel");

			var engAttachModel = new JSONModel();
			this.attachArr = [];
			engAttachModel.setData(this.attachArr);
			this.getView().setModel(engAttachModel, "engAttachModel");
			var FieldDataModel = new JSONModel();
			this.getView().setModel(FieldDataModel, "FieldDataModel");

		},

		comboModelFunction: function(array, intialFilter, advanceFilter) { // common service call function for the all the combo box in the creation screen 
			var defaultoModel = this.getOwnerComponent().getModel();
			var dropModel = this.getView().getModel("dropDown");
			var oFilters = [];
			return new Promise(function(resolve, reject) {
				var serviceUrl = "/SearchHelpSet";
				if (advanceFilter !== undefined && advanceFilter !== null) {
					oFilters = [new Filter("FieldName", FilterOperator.EQ, intialFilter),
						new Filter("Filter", FilterOperator.EQ, advanceFilter)
					];
				} else {
					oFilters = [new Filter("FieldName", FilterOperator.EQ, intialFilter)];
				}
				var mParameters = {

					filters: oFilters,
					success: function(oData, response) {
						dropModel.getData()[array] = oData.results;
						dropModel.updateBindings();
						resolve();

					}.bind(this),
					error: function(oError) {
						reject();
					}
				};
				defaultoModel.read(serviceUrl, mParameters);
			});
		},

		warShipForm: function() { // on click of the warship button this function is executed
			var visibleMOdel = this.getView().getModel("oVisibleModel");
			visibleMOdel.setProperty("/warShipForm", true);
			visibleMOdel.setProperty("/baseForm", false);

		},
		nullSegmentData: function() { //on change of the buttons on the segmented  button tab
			this.modelInitialize();
			this.noftifTypeReset();
		},

		baseForm: function() { // on the click of the base button this function is executed
			var visibleMOdel = this.getView().getModel("oVisibleModel");
			visibleMOdel.setProperty("/warShipForm", false);
			visibleMOdel.setProperty("/baseForm", true);

		},
		ptsForm: function() {
			// this.getView().byId().setVisible(false);
		},

		goBackInitial: function() { // getting back to the initial screen with all the buttons in active state

			this.propControl();
			this.getView().byId("segmentButton").setEnabled(true);
			this.getView().byId("fields").destroyItems();

			var key = this.getView().byId("segmentButton").getSelectedKey();
			var buttons = this.getView().byId("segmentButton").getItems();
			if (key === "war") {
				buttons[0].firePress();
			}
			if (key === "base") {
				buttons[1].firePress();
			}
			if (key === "pts") {
				buttons[2].firePress();
			}

		},
		setModelToFrag: function(oEvent) { //adding the desired model to the fragment is handled here
			this.input = oEvent.getParameter("id");
			this.Dialog.setModel(this.getBaseModel());
			this.Dialog.setModel(this.getResourceModel(), "i18n");
			this.Dialog.open();
		},

		handleValueHelpProject: function(oEvent) { // project search help is handled
			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.projectSearchHelp", this);
			this.setModelToFrag(oEvent);

		},

		handleValueHelpFloc: function(oEvent) { // project search help is handled

			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.flocSearchHelp", this);
			this.setModelToFrag(oEvent);
		},

		handleValueHelpPrjMng: function(oEvent) { // project manager search help is handled

			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.prjMngSearchHelp", this);
			this.setModelToFrag(oEvent);
		},

		handleValueHelpProgMng: function(oEvent) { // progrmme manager  search help is handled

			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.progMngSearchHelp", this);
			this.setModelToFrag(oEvent);
		},

		handleValueHelpPriorityF: function(oEvent) { // priority(Fleet) ,search help is handled

			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.priorityFleetSearchHelp", this);
			this.setModelToFrag(oEvent);
		},
		handleValueHelpPriorityE: function(oEvent) { // priority(Engineering) ,search help is handled

			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.priorityEngSearchHelp", this);
			this.setModelToFrag(oEvent);
		},

		handleValueHelpPlnNotif: function(oEvent) { // planning Notification search help is handled

			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.plnNotifSearchHelp", this);
			this.setModelToFrag(oEvent);
		},
		handleValueHelpClient: function(oEvent) { // Client search help is handled

			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.clientSearchHelp", this);
			this.setModelToFrag(oEvent);
		},

		handleValueHelpDocTyp: function(oEvent) { // DocType search help is handled

			this.docAttachmentModel();
			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.docTypeSearchHelp", this);
			this.setModelToFrag(oEvent);
		},
		handleValueHelpAssetNo: function(oEvent) { // Asset Eq no search help is handled

			this.Dialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.SearchHelpFrag.asssetNoSearchHelp", this);
			this.setModelToFrag(oEvent);
		},

		wildSearch: function(oEvent) { // search function for value helps   
			var value = oEvent.getParameter("value");
			var fieldName = oEvent.getSource().getCustomData()["0"].getValue();
			var fieldKey = oEvent.getSource().getCustomData()["0"].getKey();
			if (fieldKey !== "") {
				var items = {
					path: '/SearchHelpSet',
					filters: [new sap.ui.model.Filter("FieldName", sap.ui.model.FilterOperator.EQ, fieldName),
						new sap.ui.model.Filter("Filter", sap.ui.model.FilterOperator.Contains, value),
						new sap.ui.model.Filter("Param2", sap.ui.model.FilterOperator.Contains, fieldKey)
					],
					template: new sap.m.StandardListItem({
						title: "{Value}",
						description: "{Description}"
					})
				};
			} else {
				var items = {
					path: '/SearchHelpSet',
					filters: [new sap.ui.model.Filter("FieldName", sap.ui.model.FilterOperator.EQ, fieldName),
						new sap.ui.model.Filter("Filter", sap.ui.model.FilterOperator.Contains, value)
					],
					template: new sap.m.StandardListItem({
						title: "{Value}",
						description: "{Description}"
					})
				};
			}
			var list = oEvent.getSource().getAggregation("_dialog").getContent()[1];
			list.bindItems(items);

		},
		onNotifTypeChange: function(oEvent) { // on click of check box this function is executed , this call the servcie according to the new notification selected
			this.modelInitialize();
			var value = this.getView().getModel("valueModel");
			value.setProperty("/Project", "");
			this.getView().byId("warShipProject").getCustomData()[0].setKey("");
			var busyIndicator = new sap.m.BusyDialog();
			var checkBoxModel = this.getView().getModel("checkBoxModel");

			var advanceFilter;
			if (oEvent.getParameter("selected") !== false) {
				var type = oEvent.getSource().getName();
				busyIndicator.open();
				if (type === "Fleet") {
					advanceFilter = "F";
					checkBoxModel.setProperty("/Eng", false);
					checkBoxModel.setProperty("/Emp", false);
					checkBoxModel.setProperty("/Taf", false);

				}
				if (type === "Engineering") {
					advanceFilter = "EN";
					checkBoxModel.setProperty("/Fleet", false);
					checkBoxModel.setProperty("/Emp", false);
					checkBoxModel.setProperty("/Taf", false);
				}
				if (type === "EMP") {
					advanceFilter = "EMP";
					checkBoxModel.setProperty("/Fleet", false);
					checkBoxModel.setProperty("/Eng", false);
					checkBoxModel.setProperty("/Taf", false);

				}
				if (type === "TAF") {
					advanceFilter = "TAF";
					checkBoxModel.setProperty("/Fleet", false);
					checkBoxModel.setProperty("/Eng", false);
					checkBoxModel.setProperty("/Emp", false);

				}
				this.getView().byId("warShipProject").setEnabled(true);
				Promise.all([this.comboModelFunction("SubType", "ZZ_CRSUTYP", advanceFilter), this.comboModelFunction("Categorisation",
						"ZZ_Categorisation", advanceFilter), this.comboModelFunction("AssetNumber", "ASSETNUMBER"), this.comboModelFunction(
						"ProgramArea", "ZZ_PROG_AREA", advanceFilter)]).then(
						function() {

							busyIndicator.close();
						})
					.catch(function(sErrorText) {
						busyIndicator.close();
					});
			} else {
				var comboModel = this.getView().getModel("dropDown").getData();
				comboModel.Project = [];
				comboModel.SubType = [];
				comboModel.Categorisation = [];
				comboModel.ProgramArea = [];
				comboModel.AssetNumber = [];

				this.getView().getModel("dropDown").updateBindings();
			}
		},

		intialMandtField: function() { // checking entry on the mandatory fields 
			var FiledMand = this.getView().getModel("FieldDataModel");
			var SubType = FiledMand.getProperty("/SubType");
			var category = FiledMand.getProperty("/Categorisation");
			if (SubType !== "" && category !== "" && SubType !== undefined && category !== undefined) {
				return 1;
			} else {
				return 0;
			}

		},

		fetchAllfileds: function() { // after entering all the fields in the initial screen this function is executed using next button to fetch all the remaining fields for the particular notification type
			var busyIndicator = new sap.m.BusyDialog();
			var checkBoxModel = this.getView().getModel("checkBoxModel");

			var typeEng = checkBoxModel.getProperty("/Eng");
			var typeFleet = checkBoxModel.getProperty("/Fleet");
			var typeTaf = checkBoxModel.getProperty("/Taf");
			var typeEmp = checkBoxModel.getProperty("/Emp");
			if (typeEng === true || typeFleet === true || typeEmp === true || typeTaf === true) {
				var mandtFileds = this.intialMandtField();
				if (mandtFileds === 1) {
					busyIndicator.open();
					this.getView().byId("segmentButton").setEnabled(false);
					var VisibleModel = this.getView().getModel("oVisibleModel");
					VisibleModel.setProperty("/warShipForm", false);
					VisibleModel.setProperty("/baseForm", false);
					VisibleModel.setProperty("/nextVisible", false);
					VisibleModel.setProperty("/backVisible", true);
					VisibleModel.setProperty("/createVisible", true);

					var advanceFilter;
					var extraFields;

					if (typeEng === true || typeFleet === true) {
						if (typeEng === true) {

							advanceFilter = "EN";
							extraFields = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.engineering", this);
							this.getView().byId("fields").addItem(extraFields);

						}
						if (typeFleet === true) {
							advanceFilter = "F";

							extraFields = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.fleet", this);
							this.getView().byId("fields").addItem(extraFields);

						}

					}
					if (typeEmp === true || typeTaf === true) {
						if (typeEmp === true) {
							advanceFilter = "EMP";
							extraFields = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.Emp", this);
							this.getView().byId("fields").addItem(
								extraFields);
						}
						if (typeTaf === true) {
							advanceFilter = "TAF";
							extraFields = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.Taf", this);
							this.getView().byId("fields").addItem(extraFields);

						}

					}
					Promise.all([this.comboModelFunction("COM", "ZZ_COMINPUT", advanceFilter),
						this.comboModelFunction("TAF", "ZZ_TAF_REQ", advanceFilter),
						this.comboModelFunction("Acceptance", "ZZ_ACCPTLVL", advanceFilter),
						this.comboModelFunction("Stores", "ZZ_STOREPRO", advanceFilter),
						this.comboModelFunction("Itar", "ZZ_ITARCTL", advanceFilter),
						this.comboModelFunction("Enhancement", "ZZ_ENHFIT", advanceFilter),
						this.comboModelFunction("ApprovalTemplate", "APPROVAL_TEMPLATE", advanceFilter),
						this.comboModelFunction("Curr", "CURRENCY"),
						this.comboModelFunction("EmpPriority", "ZZ_CAT_ASS", advanceFilter),
						this.comboModelFunction("FundingStream", "ZZ_CDEL_RDEL", advanceFilter)
					]).then(
						function() {
							busyIndicator.close();
						})

					.catch(function(sErrorText) {
						busyIndicator.close();
					});
					//Call Start_up service to populate the Raised By
					var myModel = new JSONModel();
			            myModel.loadData("/sap/bc/ui2/start_up");
			            myModel.attachRequestCompleted(function () {
			                var modelData = myModel.getData();
			                var fullName = modelData.fullName ? modelData.fullName : "";
			                this.getView().getModel("FieldDataModel").setProperty("/RaisedBy", fullName);
			            }.bind(this));
				} else {
					sap.m.MessageBox.error("Please Fill all the mandatory Fileds");
				}
			} else {
				sap.m.MessageBox.error("Select atleast on notification Type ");
			}
		},
		handleHelpConfirm: function(oevent) { //confirm function for valuehelp 
			this.getView().byId(this.input).setSelectedKey(null);
			var helpData = oevent.getParameter("selectedItems")["0"].getDescription();
			var helpKey = oevent.getParameter("selectedItems")["0"].getTitle();
			this.getView().byId(this.input).setValue(helpData);
			this.getView().byId(this.input).getCustomData()["0"].setKey(helpKey);
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
		addItemToList: function(oEvent) { // adding item to the specific list in fleet , engineering , eng and taf
			var Item = oEvent.getSource().getAlt();
			var selectionCheck = this.getView().getModel("checkBoxModel").getData();
			var checkFleet = selectionCheck.Fleet;
			var checkEmp = selectionCheck.Emp;
			var checkTaf = selectionCheck.Taf;
			var advanceFilter;
			var typeFilter;

			var dropView = this.getView();
			if (!this.dropDialog) {
				this.dropDialog = sap.ui.xmlfragment(dropView.getId(), "zm209_chng_req.fragments.dropDownHelp", this);
			}
			this.getView().addDependent(this.dropDialog);
			this.dropDialog.setTitle("Select " + Item);
			this.getView().byId("dropLabel").setText(Item + ":");
			this.getView().byId("okButton").getCustomData()["0"].setValue(Item);
			if (Item === "CR") {
				advanceFilter = "CR_NOTIFICATION";
			}
			if (Item === "Quotation") {
				advanceFilter = "QUOTATION";
			}
			if (Item === "Notification") {
				advanceFilter = "NOTIFICATION";
			}
			if (checkFleet === true && Item === "CR") {
				typeFilter = "F";
			}
			if (checkEmp === true && Item === "CR") {
				typeFilter = "EMP";
			}
			if (checkTaf === true && Item === "CR") {
				typeFilter = "TAF";
			}

			this.comboModelFunction("addField", advanceFilter, typeFilter).then(function() {
					var tempmodel = this.getView().getModel("dropDown");
					this.dropDialog.setModel(tempmodel, "dropDown");
					this.getView().byId("notifValueData").setSelectedKey("");
					this.dropDialog.open();
				}.bind(this))
				.catch(function(sErrorText) {

				});

		},
		setValToList: function(oEvent) { //for setting the selected value in the drop down fragment to the list
			var Item = oEvent.getSource().getCustomData()["0"].getValue();
			var key = "unique";
			var length;
			var initiaModelData;
			var dropDownSelected = this.getView().byId("notifValueData").getSelectedItem();
			if (dropDownSelected !== null) {
				var index = dropDownSelected.getBindingContext("dropDown").getPath().split("/")[2];
				if (Item === "CR") {
					var objCr = {};

					objCr.CrNotification = this.dropDialog.getModel("dropDown").getData().addField[index].Value;
					objCr.Type = this.dropDialog.getModel("dropDown").getData().addField[index].Param1;
					objCr.Description = this.dropDialog.getModel("dropDown").getData().addField[index].Description;

					length = this.getView().getModel("crModel").getData().length;
					initiaModelData = this.getView().getModel("crModel").getData();
					key = this.onDuplicationCheck(objCr, initiaModelData, length, key);
					if (key === "unique") {
						this.crArr.push(objCr);
					}

					this.getView().getModel("crModel").updateBindings();

				}
				if (Item === "Notification") {
					var objNotif = {};

					objNotif.Notification = this.getView().getModel("dropDown").getData().addField[index].Value;
					objNotif.Type = this.getView().getModel("dropDown").getData().addField[index].Param1;
					objNotif.Description = this.getView().getModel("dropDown").getData().addField[index].Description;

					length = this.getView().getModel("notificationModel").getData().length;
					initiaModelData = this.getView().getModel("notificationModel").getData();
					key = this.onDuplicationCheck(objNotif, initiaModelData, length, key);

					if (key === "unique") {
						this.notifArr.push(objNotif);
					}

					this.getView().getModel("notificationModel").updateBindings();
				}

				if (Item === "Quotation") {
					var objQuotation = {};

					objQuotation.Quotation = this.getView().getModel("dropDown").getData().addField[index].Value;
					objQuotation.Description = this.getView().getModel("dropDown").getData().addField[index].Description;
					length = this.getView().getModel("quotationModel").getData().length;
					initiaModelData = this.getView().getModel("quotationModel").getData();
					key = this.onDuplicationCheck(objQuotation, initiaModelData, length, key);
					if (key === "unique") {
						this.quotationArr.push(objQuotation);
					}

					this.getView().getModel("quotationModel").updateBindings();
				}

				this.dropDialog.close();
				this.getView().byId("notifValueData").setValue("");
			} else {
				MessageBox.information("Select Item from dropdown");
			}
		},

		createCr: function() { // function to create the cr for all the four types of notification
			var defaultoModel = this.getOwnerComponent().getModel();
			var initialData = this.getView().getModel("FieldDataModel").getData();
			var serviceUrl = "/NotificationHeaderSet";
			var selectionCheck = this.getView().getModel("checkBoxModel").getData();
			var checkEng = selectionCheck.Eng;
			var checkFleet = selectionCheck.Fleet;
			var checkEmp = selectionCheck.Emp;
			var checkTaf = selectionCheck.Taf;
			var payload;
			if (checkFleet === true) {
				initialData.Type = "ZC";
				payload = {};

				var ship = this.getView().byId("fleetShip").getSelected();
				var Space = this.getView().byId("fleetSpace").getSelected();
				var Asbestos = this.getView().byId("fleetAsbestos").getSelected();

				payload = initialData;
				if (ship === true) {
					payload.ShipHazard = 'X';

				}
				if (Space === true) {
					payload.ConfinedSpace = 'X';
				}
				if (Asbestos === true) {
					payload.Asbestos = 'X';
				}
				payload.NotificationLinks = this.getView().getModel("notificationModel").getData();
				payload.CRLinks = this.spliceTypeData(this.getView().getModel("crModel").getData());
				payload.Quotations = this.getView().getModel("quotationModel").getData();

			}
			if (checkEng === true) {
				initialData.Type = "ZD";

				var not = this.getView().byId("engNotCheck").getSelected();
				var started = this.getView().byId("engStartedCheck").getSelected();
				var completed = this.getView().byId("engCompleteCheck").getSelected();

				payload = initialData;
				if (not === true) {
					payload.NotStarted = 'X';

				}
				if (started === true) {
					payload.Started = 'X';
				}
				if (completed === true) {
					payload.Complete = 'X';
				}

				payload = {};
				payload = initialData;

				payload.Quotations = this.getView().getModel("quotationModel").getData();
				payload.Attachments = this.getView().getModel("engAttachModel").getData();

			}

			if (checkTaf === true) {
				initialData.Type = "ZF";

				payload = {};
				payload = initialData;
				payload.Variants = this.getView().byId("variantTotal").getValue().toString();
				payload.Quotations = this.getView().getModel("quotationModel").getData();
				payload.CRLinks = this.spliceTypeData(this.getView().getModel("crModel").getData());

			}
			if (checkEmp === true) {
				initialData.Type = "ZE";

				payload = {};
				payload.Variants = this.getView().byId("variantTotal").getValue().toString();
				// payload.PlannedModYear": "2017",
				payload = initialData;

				payload.Quotations = this.getView().getModel("quotationModel").getData();
				payload.CRLinks = this.spliceTypeData(this.getView().getModel("crModel").getData());
			}
			initialData.RaisedBy = "";// Pass Raised by as Empty 
			var mParameters = {

				success: function(oData, response) {
					this.getView().byId("fields").destroyItems();
					var visibleMOdel = this.getView().getModel("oVisibleModel");
					visibleMOdel.setProperty("/warShipForm", true);
					visibleMOdel.setProperty("/nextVisible", true);
					visibleMOdel.setProperty("/backVisible", false);
					visibleMOdel.setProperty("/createVisible", false);
					this.modelInitialize();
					this.onValueIntialize();
					this.propControl();
					this.docAttachmentModel();
					this.noftifTypeReset();
					this.getView().byId("segmentButton").setEnabled(true);

					var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
					MessageBox.success(
						"Cr Created with NotifNumber:" + oData.NotifNumber, {
							styleClass: bCompact ? "sapUiSizeCompact" : "",
							onClose: function() {
								sap.ui.core.BusyIndicator.show();
								//Navigate to the Master Detail Screen. Pass the Notif Type
								var sFleet = payload.Type,
								   oNotifModel = this.getView().getModel("NotifType");
							 	   oNotifModel.setProperty("/notifType",payload.Type);
							 	   oNotifModel.setProperty("/notifNumber",oData.NotifNumber);
								if(this.getOwnerComponent().oListSelector._oList !== undefined){
									var oListSelector = this.getOwnerComponent().oListSelector;
									oListSelector.setBoundMasterList(oListSelector._oList);
									//Filter based on the engineering Type
									var aFilters = [new sap.ui.model.Filter("Type", sap.ui.model.FilterOperator.Contains, sFleet)];
									oListSelector._oList.getBinding("items").filter(aFilters);
								}
								
								this.getRouter().navTo("object", {
									Type: sFleet,
									objectId: oData.NotifNumber
								});
							}.bind(this)

						}
					);
				}.bind(this),
				error: function(oError) {
					sap.m.MessageToast.show("Error");

				}
			};
			defaultoModel.create(serviceUrl, payload, mParameters);

		},

		cancelItemDialog: function() {
			this.dropDialog.close();
		},
		deleteListItem: function(oEvent) { // delete the items from the list 
			var deletionIndex;
			var type = oEvent.getSource().getParent().getHeaderToolbar().getContent()[2].getProperty("alt");
			if (type === "CR") {
				deletionIndex = oEvent.getParameter("listItem").getBindingContext("crModel").getPath().substring(1, 2);
				this.crArr.splice(deletionIndex, 1);
				this.getView().getModel("crModel").updateBindings();
			}
			if (type === "Notification") {
				deletionIndex = oEvent.getParameter("listItem").getBindingContext("notificationModel").getPath().substring(1, 2);
				this.notifArr.splice(deletionIndex, 1);
				this.getView().getModel("notificationModel").updateBindings();
			}
			if (type === "Quotation") {
				deletionIndex = oEvent.getParameter("listItem").getBindingContext("quotationModel").getPath().substring(1, 2);
				this.quotationArr.splice(deletionIndex, 1);
				this.getView().getModel("quotationModel").updateBindings();
			}

			if (type === "Attachment") {

				deletionIndex = oEvent.getParameter("listItem").getBindingContext("engAttachModel").getPath().substring(1, 2);
				this.attachArr.splice(deletionIndex, 1);
				this.getView().getModel("engAttachModel").updateBindings();
			}

		},
		addEngAttachment: function(oEvent) { // open the attachment dialog
			var attach = this.getView();
			this.attachDialog = sap.ui.xmlfragment(attach.getId(), "zm209_chng_req.fragments.attachment", this);
			this.getView().addDependent(this.attachDialog);
			this.attachDialog.open();
		},
		setAttachToList: function(oEvent) { // attaching the value from dialog to the list
			var objAttach = {};
			var key = "unique";
			var attachmentModel = this.getView().getModel("oAttachmentModel");
			objAttach.DocumentType = attachmentModel.getProperty("/Type");
			objAttach.DocumentNumber = attachmentModel.getProperty("/AttachNumber");
			objAttach.DocumentVersion = attachmentModel.getProperty("/AttachVersion");
			objAttach.DocumentPart = attachmentModel.getProperty("/AttachPart");
			objAttach.Description = attachmentModel.getProperty("/AttachDesciption");

			if (objAttach.DocumentType !== "" && objAttach.DocumentNumber !== "") {
				var length = this.getView().getModel("engAttachModel").getData().length;
				var attachModelData = this.getView().getModel("engAttachModel").getData();

				for (var i = 0; i < length; i++) {
					if (attachModelData[i].DocumentType === objAttach.DocumentType &&
						attachModelData[i].DocumentNumber === objAttach.DocumentNumber &&
						attachModelData[i].DocumentVersion === objAttach.DocumentVersion
					) {
						key = "same";
						MessageBox.information("Please select Differernt Document Type and Documnet Number");
						break;
					} else {
						key = "unique";
					}

				}
				if (key === "unique") {
					this.attachArr.push(objAttach);
				}

				this.getView().getModel("engAttachModel").updateBindings();

				this.attachDialog.destroy(true);
				this.docAttachmentModel();
			} else {
				MessageBox.information("Please select Document Type and Document Number");
			}
		},
		cancelAttachDialog: function() {
			this.attachDialog.destroy(true);
			this.docAttachmentModel();

		},
		attachDocValueHelp: function() // value help for the document number based on type  selected 

		{
			var defaultoModel = this.getOwnerComponent().getModel();
			var docModel = new JSONModel();
			var Type = this.getView().getModel("oAttachmentModel").getProperty("/Type");

			var oFilters = [new Filter("DocumentType", FilterOperator.EQ, Type)];
			var serviceUrl = "/AttachmentsSet";
			var mParameters = {
				filters: oFilters,
				success: function(oData, response) {
					docModel.setData(oData);
					docModel.updateBindings();

				},
				error: function(oError) {
					sap.m.MessageToast.show("error");
				}
			};
			defaultoModel.read(serviceUrl, mParameters);

			var attachDoc = this.getView();

			this.DocIdDialog = sap.ui.xmlfragment(attachDoc.getId(), "zm209_chng_req.fragments.SearchHelpFrag.searchAttachment", this);

			this.getView().addDependent(this.DocIdDialog);
			this.DocIdDialog.setModel(docModel, "docModel");
			this.DocIdDialog.open();
		},
		handleAttchDcoConfirm: function(oEvent) { // adding the attachment data to the list
			var helpData = oEvent.getParameter("selectedItems")["0"].getTitle();
			var attachData = this.DocIdDialog.getModel("docModel").getData().results;
			var index = oEvent.getParameter("selectedItems")["0"].getBindingContext("docModel").getPath().split("/")[2];
			var attachmentModel = this.getView().getModel("oAttachmentModel");
			attachmentModel.setProperty("/AttachNumber", helpData);
			attachmentModel.setProperty("/AttachVersion", attachData[index].DocumentVersion);
			attachmentModel.setProperty("/AttachPart", attachData[index].DocumentPart);
			attachmentModel.setProperty("/AttachDesciption", attachData[index].Description);

		},
		handleSearch: function(oEvent) { // handle Search functionallity for the F4 help

			var sValue = oEvent.getParameter("value");

			var
				oFilter =

				new Filter({
					path: "DocumentNumber",
					operator: FilterOperator.Contains,
					value1: sValue
				});

			oEvent.getSource().getBinding("items").filter([oFilter]);
		},
		onChgCostValue: function(event) { // calculating the total  of all the rows and final total 

			var row = event.getSource().getParent().getCells();
			var val1 = formatter.stringToInt(row[1].getValue());
			var val2 = formatter.stringToInt(row[2].getValue());
			var val3 = formatter.stringToInt(row[3].getValue());
			var val4 = formatter.stringToInt(row[4].getValue());

			var Total = val1 + val2 + val3 + val4;
			row[5].setValue(Total);
			var Totalfield = event.getSource().getParent().getParent().getItems();
			var overallTotal = formatter.stringToInt(Totalfield[0].getCells()[5].getValue()) + formatter.stringToInt(Totalfield[1].getCells()[5]
					.getValue()) +
				formatter.stringToInt(Totalfield[2].getCells()[5].getValue());
			Totalfield[3].getCells()[5].setValue(overallTotal);
		},
		currencyChange: function(event) {
			this.setNull(event); // adding the currency to the field
			var currencyKey = event.getSource().getSelectedKey();
			this.getView().byId("variantTotal").setCurrency(currencyKey);
		},
		handleHelpClose: function() {
			this.Dialog.destroy(true);
		}
	});
});