sap.ui.define([], function() {
	"use strict";

	return {

		stringToInt: function(value) {
			if (value === "") {
				return 0;
			} else {
				return parseInt(value);
			}

		},
		alignKeyDesc:function(desc,key)
		{
			return desc + key  ;
		},
		currencyValue: function(sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},
		GWtoUIDateObject: function(sDate) {
			if (sDate !== null && sDate !== "" && sDate !== undefined) {
				var date = sDate.getDate();
				if (date < 10) {
					date = "0" + date;
				}
				var month = sDate.getMonth() + 1;
				if (month < 10) {
					month = "0" + month;
				}
				var year = sDate.getFullYear();
				var finalValue = "" + date + "-" + month + "-" + year;
				return finalValue;
			}
		},
		approvalRoutesDecline: function(status) {
			if (status === "PEND") {
				return "white";
			} else if (status === "RQST") {
				return "#CCCCCC";
			} else if (status === "HOLD") {
				return "#CCCCCC";
			} else if (status === "RJCT") {
				return "red";
			} else if (status === "APPV") {
				return "#CCCCCC";
			}

		},
		approvalRoutesStatusVisible: function(status) {
			if (status === "PEND" || status === null || status === '') {
				return false;
			} else {
				return true;
			}

		},
		approvalRoutesNotification: function(status) {
			if (status === "PEND") {
				return "white";
			} else if (status === "RQST") {
				return "#CCCCCC";
			} else if (status === "HOLD") {
				return "Amber";
			} else if (status === "RJCT") {
				return "#CCCCCC";
			} else if (status === "APPV") {
				return "#CCCCCC";
			}

		},
		approvalRoutesAccept: function(status) {
			if (status === "PEND") {
				return "white";
			} else if (status === "RQST") {
				return "#CCCCCC";
			} else if (status === "HOLD") {
				return "#CCCCCC";
			} else if (status === "RJCT") {
				return "#CCCCCC";
			} else if (status === "APPV") {
				return "green";
			}

		},
		datepickerFormatter: function(date) {
			if (date === null || date === "") {
				return;
			}
			var oFormatDate = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd"
			});
			return oFormatDate.format(date);
		},
		handleNull: function(dDate) {
			if (dDate === null || dDate === "") {
				return "-";
			} else {
				return dDate;
			}
		},
		displayControlEnable: function(value) {
			if (value === 'R') {
				return false;
			} else {
				return true;
			}
		},
		displayControlRequired: function(value) {
			if (value === 'M') {
				return true;
			} else {
				return false;
			}
		},
		handleDateNull: function(dDate){
			if(dDate === null){
				return '';
			}
			else{
				return dDate;
			}
		}		
	};
});