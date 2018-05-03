/*global history */
sap.ui.define([
	"zm209_chng_req/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/GroupHeaderListItem",
	"sap/ui/Device",
	"zm209_chng_req/util/formatter"
], function(BaseController, JSONModel, History, Filter, FilterOperator, GroupHeaderListItem, Device, formatter) {
	"use strict";

	return BaseController.extend("zm209_chng_req.controller.Master", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 * @public
		 */
		onInit: function() {
			// Control state model
			var oList = this.byId("list"),
				oViewModel = this._createViewModel(),
				// Put down master list's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the master list is
				// taken care of by the master list itself.
				iOriginalBusyDelay = oList.getBusyIndicatorDelay();

			this._oList = oList;
			// keeps the filter and search state, Type to get the Notif Type
			this._oListFilterState = {
				aFilter: [],
				aSearch: [],
				type: ''
			};

			this.setModel(oViewModel, "masterView");
			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oList.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for the list
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});
			// 
			if (this.getView().getModel("NotifType") && this.getView().getModel("NotifType").getProperty("/notifType")) {
				this._oListFilterState.type = this.getView().getModel("NotifType").getProperty("/notifType");
			} else {
				// THis will work only when the Browser app is refreshed in the Master detail screen  Since the Notif Type will not
				// be availalbe in the mmodel
				var oHashChanger = new sap.ui.core.routing.HashChanger();
				if (oHashChanger.getHash().indexOf("ZCHNG_REQUEST-display") === 0) {
					this._oListFilterState.type = oHashChanger.getHash().split("ZCHNG_REQUEST-display&/NotificationHeaderSet-")[1].split("/")[0];
				} else {
					this._oListFilterState.type = oHashChanger.getHash().split("-")[1].split("/")[0];
				}
			}

			this.getView().addEventDelegate({
				onBeforeFirstShow: function() {
					this._oListFilterState.aFilter = [new Filter("Type", FilterOperator.Contains, this._oListFilterState.type)];
					this._applyFilterSearch();
					this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
					this.getOwnerComponent().oListSelector.oWhenListLoadingIsDone.then(
							function() {
								this._callMasterService(this._oListFilterState.type);
							}.bind(this));
				}.bind(this)
			});
			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().attachBypassed(this.onBypassed, this);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * After list data is available, this handler method updates the
		 * master list counter and hides the pull to refresh control, if
		 * necessary.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function(oEvent) {
			// update the master list object counter after new data is loaded
			this._updateListItemCount(oEvent.getParameter("total"));
			// hide pull to refresh if necessary
			this.byId("pullToRefresh").hide();
			//This is to select the master When the Data starts growing
			var sNotifNo = this.getView().getModel("NotifType").getProperty("/notifNumber");
			this.getOwnerComponent().oListSelector.selectAListItem("/NotificationHeaderSet('" + sNotifNo + "')");
		},
		/**
		 * Live change for the Master search
		 */
		onLiveChange: function(oEvent) {
			var oItem = oEvent.getSource().getValue();
			if (oItem && oItem.length > 0) {

				var aFilter = [];
				if (oItem) {
					var aFilter1 = new Filter("NotifNumber", FilterOperator.Contains, oItem);
					var aFilter2 = new Filter("Type", FilterOperator.EQ, this._oListFilterState.type);
					aFilter.push(new sap.ui.model.Filter([aFilter1, aFilter2], true));
				} else {
					aFilter = [new Filter("Type", FilterOperator.EQ, this._oListFilterState.type)];
				}

				var oBinding = this._oList.getBinding("items");
				oBinding.filter(aFilter);
			}
		},
		/**
		 * Event handler for the master search field. Applies current
		 * filter value and triggers a new search. If the search field's
		 * 'refresh' button has been pressed, no new search is triggered
		 * and the list binding is refresh instead.
		 * @param {sap.ui.base.Event} oEvent the search event
		 * @public
		 */
		onSearch: function(oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
				return;
			}

			var sQuery = oEvent.getParameter("query");
			var aFilter = [];
			if (sQuery) {
				var aFilter1 = new Filter("NotifNumber", FilterOperator.Contains, sQuery);
				var aFilter2 = new Filter("Type", FilterOperator.EQ, this._oListFilterState.type);
				aFilter.push(new sap.ui.model.Filter([aFilter1, aFilter2], true));
			} else {
				aFilter = [new Filter("Type", FilterOperator.EQ, this._oListFilterState.type)];
			}

			//var oList = this.getView().byId("list");
			var oBinding = this._oList.getBinding("items");
			oBinding.filter(aFilter);

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function() {
			this._oList.getBinding("items").refresh();
		},

		/**
		 * Event handler for the list selection event
		 * @param {sap.ui.base.Event} oEvent the list selectionChange event
		 * @public
		 */
		onSelectionChange: function(oEvent) {
			var oList = oEvent.getSource(),
				bSelected = oEvent.getParameter("selected");

			// skip navigation when deselecting an item in multi selection mode
			if (!(oList.getMode() === "MultiSelect" && !bSelected)) {
				// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
				this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
			}
		},

		/**
		 * Event handler for the bypassed event, which is fired when no routing pattern matched.
		 * If there was an object selected in the master list, that selection is removed.
		 * @public
		 */
		onBypassed: function() {
			this._oList.removeSelections(true);
		},

		/**
		 * Event handler for navigating back.
		 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
		 * If not, it will navigate to the shell home
		 * @public
		 */
		onNavBack: function() {
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getOwnerComponent().oListSelector.clearPromises();                         
			this.getRouter().navTo("InitialScreen");
			
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		_createViewModel: function() {
			return new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "",
				delay: 0,
				title: this.getResourceBundle().getText("masterTitleCount", [0]),
				noDataText: ' ',
				sortBy: "Description",
				groupBy: "None",
				busy: false
			});
		},

		/**
		 * If the master route was hit (empty hash) we have to set
		 * the hash to to the first item in the list as soon as the
		 * listLoading is done and the first item in the list is known
		 * @private
		 */
		_onMasterMatched: function(oEvent) {
	
			this.getOwnerComponent().oListSelector.oWhenListLoadingIsDone.then(
				function(mParams) {
					if (mParams.list.getMode() === "None") {
						return;
					}
					var sObjectId = mParams.firstListitem.getBindingContext().getProperty("NotifNumber");
					this.getRouter().navTo("object", {
						Type: this._oListFilterState.type,
						objectId: sObjectId
					}, true);
				}.bind(this),
				function(mParams) {
					if (mParams.error) {
						return;
					}
					this.getRouter().getTargets().display("detailNoObjectsAvailable");
				}.bind(this)
			);
		},

		/**
		 * Shows the selected item on the detail page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showDetail: function(oItem) {
			var bReplace = !Device.system.phone;
			this.getRouter().navTo("object", {
				Type: this._oListFilterState.type,
				objectId: oItem.getBindingContext().getProperty("NotifNumber")
			}, bReplace);
		},

		/**
		 * Sets the item count on the master list header
		 * @param {integer} iTotalItems the total number of items in the list
		 * @private
		 */
		_updateListItemCount: function(iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			if (this._oList.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
				this.getModel("masterView").setProperty("/title", sTitle);
			}
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @private
		 */
		_applyFilterSearch: function() {
			var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
				oViewModel = this.getModel("masterView");
			this._oList.getBinding("items").filter(aFilters);
			// changes the noDataText of the list in case there are no filter results
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
			} else if (this._oListFilterState.aSearch.length > 0) {
				// only reset the no data text to default when no new search was triggered
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		},

		/**
		 * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
		 * @param {string} sFilterBarText the selected filter value
		 * @private
		 */
		_updateFilterBar: function(sFilterBarText) {
			var oViewModel = this.getModel("masterView");
			oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
		},
		onSemanticAddButtonPress: function() {
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getOwnerComponent().oListSelector.clearPromises();    
			this.getRouter().navTo("InitialScreen");
		},

		/**
		 * This will change the status of the Nofications and the corresponding button will be highlighted in the master
		 */
		onStatusChange: function(oEvent) {
			var oSource = oEvent.getSource();
			var oItem = oEvent.getSource().getBindingContext().getObject();
			var sSetUserStatus = oSource.getAlt();
			// Validation check if Status can be changed.
			if (!((sSetUserStatus === "APPV" && oItem.AppvFlag === "X") ||
					(sSetUserStatus === "RJCT" && oItem.RjctFlag === "X") ||
					(sSetUserStatus === "HOLD" && oItem.HoldFlag === "X"))) {
				sap.m.MessageBox.warning(
					"Permission Denied - You don't have permission to approve this step", {
						icon: sap.m.MessageBox.Icon.Warning,
						title: "Warning",
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function(oAction) {}
					}
				);
				return;
			}
			var oStatusChangePayload = {};
			oStatusChangePayload.NotifNumber = oItem.NotifNumber;
			oStatusChangePayload.Status = sSetUserStatus;
			oStatusChangePayload.StepKey = oItem.StepKey;
			oStatusChangePayload.Process = "S";
			oStatusChangePayload.Notes = "";
			this.callStatusChgFromMaster(oStatusChangePayload, "Status has been updated");
		},
		/**
		 * This is for populating Filter Pop Up screen as Direct binding will not load all the records in the filter.
		 */
		_callMasterService: function(sType) {
			var omainModel = this.getView().getModel();
			/*var oViewModel = this.getModel("masterView");
			oViewModel.setProperty("/busy", true);*/
			var filter1 = new Filter("Type", FilterOperator.EQ, sType);
			var sRequestUri = "/NotificationHeaderSet";
			omainModel.read(sRequestUri, {
				filters: [filter1],
				async: false,
				success: function(oData, response) {
					var oJsonModel = new sap.ui.model.json.JSONModel();
					oJsonModel.setData(oData);
					this.getView().setModel(oJsonModel, 'filterModel');
				}.bind(this),
				error: function(response) {

				}.bind(this)
			});
		},
		/**
		 * This is used to Filter the Fields which will open the fragment to choose the Filter name
		 * Currently this is been done only to Notifcation Number
		 */
		onFilterPress: function() {
			if (!this._valueHelpDialog) {
				this._valueHelpDialog = sap.ui.xmlfragment(this.getView().getId(), "zm209_chng_req.fragments.FilterPopup", this);
				this.getView().addDependent(this._valueHelpDialog);
			}
			var oListdata = this.getView().getModel('filterModel').getData();
			var oFilterObj = this.getFilterObjectRecords(oListdata);
			var oFilterModel = new sap.ui.model.json.JSONModel();
			oFilterModel.setData(oFilterObj);
			this._valueHelpDialog.setModel(oFilterModel);
			this._valueHelpDialog.open();
		},
		/**
		 * This will Filter the Fields depending upon the selection in the fragments
		 */
		onConfirmViewSettingsDialog: function(oEvent) {
			var aFilterItems = oEvent.getParameters().filterItems,
				aFilters = [];
			// update filter state:
			// combine the filter array and the filter string
			aFilterItems.forEach(function(oItem) {
				var filterItem = {};
				switch (oItem.getParent().getText()) {
					case "Notification Number":
						filterItem.NotifNumber = oItem.getText();
						break;
					default:
						break;
				}
				aFilters.push(filterItem);
			});
			var filterdata = [];
			aFilters.forEach(function(a) {
				if (a.NotifNumber) {
					filterdata.push(new Filter("NotifNumber", FilterOperator.Contains, a.NotifNumber));
					filterdata.push(new Filter("Type", FilterOperator.EQ, this._oListFilterState.type));
				} 
			}.bind(this));
			if (filterdata.length === 0) {
				filterdata.push(new Filter("Type", FilterOperator.EQ, this._oListFilterState.type)); //Default
				sap.m.MessageToast.show("No data for the selected combination");
			}
			var oBinding = this._oList.getBinding("items");
			oBinding.filter(filterdata);
		}

	});

});