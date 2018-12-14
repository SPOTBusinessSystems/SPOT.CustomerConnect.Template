(function () {
    'use strict';

    angular
    .module('app')
    .controller('PickupController', PickupController);

    PickupController.$inject = ['$rootScope', '$scope', 'dialogs', 'blockUI', '$state', 'settingsService', 'dataService', 'userService', 'configService', '$ocLazyLoad', '$filter'];

    function PickupController($rootScope, $scope, dialogs, blockUI, $state, settingsService, dataService, userService, configService, $ocLazyLoad, $filter) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'PickupController';

        activate();

        function activate() {
            $scope.Customer = userService.getCustomer();
            $scope.Settings = configService.getProfile();
            $scope.Route = {};

            // Initialize variables.
            $scope.Pickup = { Comments: '', Instructions: '', Date: null, DeliveryDate: null, Visit: 'Pickup', DeliveryComments: '', AcceptTerms: false, selectedPickup: null, selectedDelivery: null };
            $scope.pickupTimeSlot = '';
            $scope.deliveryTimeSlot = '';


            $scope.PickupList = [];
            $scope.DeliveryList = [];
            var DeliveryListIndex = {};

            $scope.disableDeliveryOptions = $scope.Settings["Request Visits"]["Disable Delivery Options"] == '1';


            $scope.isActive = true;

            validateRoute();

            function validateRoute() {

                if ($scope.Customer["RequestState"] && $scope.Customer["RequestState"] == 'RP') {
                    $scope.isActive = false;
                    dialogs.notify('Unavailable', 'You have not yet been assigned a delivery route');
                }
            }

            if ($scope.isActive)
                dataService.route.getPickupVisits().then(function (data) {
                    if (data.Failed) {
                        dialogs.error('Pickup Schedule Error', data.Message);
                        return;
                    }

                    $scope.Visits = data.ReturnObject;


                    $scope.displayAddress();
                    $scope.initPickup();
                    $scope.initDelivery();

                    initDeliveryListIndex();
                });

            function initDeliveryListIndex() {
                DeliveryListIndex = {};

                for (var i = 0; i < $scope.Visits.PickupDeliveryAssociationList.length; i++) {
                    var x = $scope.Visits.PickupDeliveryAssociationList[i];
                    if (DeliveryListIndex[x.PickupVisitOrdinal] == null)
                        DeliveryListIndex[x.PickupVisitOrdinal] = {};

                    for (var j = 0; j < x.DeliveryList.length; j++) {
                        var y = x.DeliveryList[j];
                        DeliveryListIndex[x.PickupVisitOrdinal][y.DeliveryVisitOrdinal] = y;
                    }
                }
            }

            $scope.initPickup = function () {
                var xL = $scope.PickupList;
                xL.length = 0;

                var vL = $scope.Visits.PickupVisits;

                for (var i = 0; i < vL.length; i++) {
                    var v = vL[i];
                    var x = {
                        Ordinal: v.Ordinal,
                        Date: v.ETAStart,
                        TimeRange: getTimeRangeTitle(v),
                        Comment: getComment(v),
                        IsRoute: v.RouteIsInSession,
                    };
                    xL.push(x);
                }
            };

            $scope.initDelivery = function () {
                var xL = $scope.DeliveryList;
                xL.length = 0;

                var vL = $scope.Visits.DeliveryVisits;

                for (var i = 0; i < vL.length; i++) {
                    var v = vL[i];
                    var x = {
                        Ordinal: v.Ordinal,
                        Date: v.ETAStart,
                        TimeRange: getTimeRangeTitle(v),
                        Comment: getComment(v),
                        IsRoute: v.RouteIsInSession,
                        IsVisible: true
                    };
                    xL.push(x);
                }

                updateDeliveryList(getDefaultPickupIndex());
            };

            function getDefaultPickupIndex() {

                if (!$scope.PickupList || $scope.PickupList.length == 0)
                    return -1;

                var v1 = -1;    // in route, in session, not suspended
                var v2 = -1;    // in route, not suspended
                var v3 = -1;    // in session, not suspended
                var v4 = -1;    // not suspended
                var v5 = -1;    // first one suspended


                for (var i = 0; i < $scope.PickupList.length; i++) {
                    var v = $scope.PickupList[i];

                    if (v.ServiceIsSuspended) {
                        if (v5 < 0)
                            v5 = v.Ordinal;

                        continue;
                    }

                    if (v.CustomerIsScheduled)
                        return v.Ordinal;

                    if (v.CustomerIsInRoute) {
                        if (v.RouteIsInSession && v1 < 0) {
                            v1 = v.Ordinal;
                            continue;
                        }

                        if (v2 < 0) {
                            v2 = v.Ordinal;
                            continue;
                        }
                    }
                    else {
                        if (v.RouteIsInSession && v3 < 0) {
                            v3 = v.Ordinal;
                            continue;
                        }

                        if (v4 < 0) {
                            v4 = v.Ordinal;
                            continue;
                        }
                    }
                }

                // i don't return the values in the loop above, as I can't necessarily vouch for the sequence of possibilities
                if (v1 >= 0)
                    return v1;
                if (v2 >= 0)
                    return v2;
                if (v3 >= 0)
                    return v3;
                if (v4 >= 0)
                    return v4;
                if (v5 >= 0)
                    return v5;

                return 0;
            }


            function getTimeRangeTitle(v) {

                if (v.TimeRange)
                    return v.TimeRange;

                var d = moment(v.ETAStart);

                var d2 = moment(v.ETAStart).add(v.ETADuration, 'm');

                //round time to 15 minutes
                d.minute(15 * Math.floor(d.minute() / 15));
                d2.minute(15 * Math.floor(d2.minute() / 15));

                return d.format("h:mmA").toLowerCase() + " - " + d2.format("h:mmA").toLowerCase();
            }

            function getTimeRangeValue(v) {

                if (v.TimeRange)
                    return v.TimeRange;

                return "Custom";
            }

            function getStartTime(v) {
                if (v.TimeRange)
                    return "";

                var t = moment(v.ETAStart);
                return t.format("h:mm AA");
            }

            function getEndTime(v) {
                if (v.TimeRange)
                    return "";

                var tEnd = moment(v.ETAStart).add(v.ETADuration, 'm');
                return tEnd.format("h:mm AA");
            }


            function getComment(v) {
                if (v.ServiceIsSuspended)
                    return "Service Suspended";

                var sh = getGridScheduledID(v);

                var res;

                if (sh == 1)
                    res = "Already Scheduled";
                if (sh == 2)
                    res = "Regulary Scheduled";

                if (v.ServiceFee > 0) {
                    if (res)
                        res += ", ";

                    res += "Expedite Fee: " + $filter('localizedCurrency')(v.ServiceFee);
                    return res;
                }

                if (v.Rush && v.Rush.isRush && v.Rush.RushSurcharge) {
                    if (res)
                        res += ", ";
                    res += v.Rush.RushCaption + ": " + $filter('localizedCurrency')(v.Rush.RushSurcharge);
                }

                return res;
            }

            function getGridScheduledID(v) {
                if (!v.CustomerIsScheduled)
                    return 0;

                if (!v.ScheduledVisitID)
                    return 2;

                return 1;
            }

            function IsScheduled(v) {

                if (v == null)
                    return false;

                if (!v.ServiceIsSuspended && v.CustomerIsScheduled)
                    return true;

                return false;
            }

            $scope.isRequestPickup = function () {

                if ($scope.Pickup.selectedPickup == null)
                    return true;

                var p = $scope.Visits.PickupVisits[$scope.Pickup.selectedPickup];
                if (IsScheduled(p)) {
                    if (p.ScheduledVisitID)
                        return false;

                    if ($scope.Pickup.selectedDelivery == null)
                        return true;
                    var d = $scope.Visits.DeliveryVisits[$scope.Pickup.selectedDelivery];

                    if (IsScheduled(d)) {
                        if (d.ScheduledVisitID)
                            return false;
                    }
                }

                return true;
            }

            function updateDeliveryList(pickupIndex) {

                var dVisible = {};

                for (var i = 0; i < $scope.Visits.PickupDeliveryAssociationList.length; i++) {
                    var aL = $scope.Visits.PickupDeliveryAssociationList[i];

                    if (aL.PickupVisitOrdinal == pickupIndex) {
                        for (var j = 0; j < aL.DeliveryList.length; j++) {
                            dVisible[aL.DeliveryList[j].DeliveryVisitOrdinal] = aL.DeliveryList[j];
                        }
                    }
                }

                for (var i = 0; i < $scope.DeliveryList.length; i++) {
                    var d = $scope.DeliveryList[i];

                    if (dVisible[i]) {
                        d.IsVisible = true;
                        d.Rush = dVisible[i];
                    }
                    else {
                        d.IsVisible = false;
                        if (i == $scope.Pickup.selectedDelivery)
                            $scope.Pickup.selectedDelivery = null;
                    }
                }
            }

            $scope.onPickupChanged = function () {
                updateDeliveryList($scope.Pickup.selectedPickup);
            }

            $scope.displayAddress = function () {

                var a = { isVisible: false };
                $scope.Address = a;

                var v = $scope.Visits;

                if (!v || !v.PickupVisits || !v.PickupVisits.length)
                    return;

                var aa = v.PickupVisits[0].Address;

                a.Address1 = aa.Address1;
                a.Address2 = aa.Address2;

                a.Addressee = aa.Addressee;
                a.City = aa.City;
                a.State = aa.State;
                a.Zip = aa.Zip;
                a.isVisible = true;
            };


            // Find customer route.
            if ($scope.Customer.RouteID !== '') {
                for (var i = 0; i < $scope.Settings.Routes.length; i++) {
                    if ($scope.Settings.Routes[i].RouteID == $scope.Customer.RouteID) {
                        $scope.Route = $scope.Settings.Routes[i];
                        break;
                    }
                }
            }

            if ($scope.Settings.Pickup["Allow Delivery Date Selection"] == '1') {
                $scope.Pickup.Visit = 'Both Pickup and Delivery';
            }

            $scope.resetForm = function () {
                $state.reload();
            }


            $scope.requestPickup = function () {

                if (!$scope.Customer.IsAR && !isCreditCardValid()) {
                    var d = dialogs.error("Schedule Route Pickup", "Please add valid Credit Card");
                    d.result.then(function () {
                        $state.go('account');
                    });
                    return;
                }


                if ($scope.Pickup.selectedPickup == null) {
                    dialogs.notify("Schedule Route Pickup", "Please select a 'Pickup' visit");
                    return;
                }


                var pv = $scope.Pickup.selectedPickup == null ? null : $scope.Visits.PickupVisits[$scope.Pickup.selectedPickup];
                var dv = $scope.Pickup.selectedDelivery == null ? null : $scope.Visits.DeliveryVisits[$scope.Pickup.selectedDelivery];


                //if (pv.CustomerIsScheduled && pv.ScheduledVisitID)
                if ((!pv.ServiceIsSuspended && pv.CustomerIsScheduled && pv.ScheduledVisitID) &&
                   !(dv && !dv.ServiceIsSuspended && dv.CustomerIsScheduled && dv.ScheduledVisitID)) {
                    dialogs.notify("Schedule Route Pickup", "The Pickup visit has already been requested");
                    return;
                }

                if ((dv && !dv.ServiceIsSuspended && dv.CustomerIsScheduled && dv.ScheduledVisitID) &&
                   !(!pv.ServiceIsSuspended && pv.CustomerIsScheduled && pv.ScheduledVisitID)) {
                    dialogs.notify("Schedule Route Pickup", "The Delivery visit has already been requested");
                    return;
                }

                //if (!pv.ServiceIsSuspended && pv.CustomerIsScheduled && (dv == null || (!dv.ServiceIsSuspended && dv.CustomerIsScheduled)))
                if ((!pv.ServiceIsSuspended && pv.CustomerIsScheduled && pv.ScheduledVisitID) &&
                    (dv && !dv.ServiceIsSuspended && dv.CustomerIsScheduled && dv.ScheduledVisitID)) {
                    dialogs.notify("Schedule Route Pickup", "Both visits have already been requested");
                    return;
                }


                if (isSameDayPickupScheduled(pv)) {
                    dialogs.notify("Schedule Route Pickup", "A Pickup visit has already been scheduled for this date");
                    return;
                }


                if (isSameDayDeliveryScheduled(dv)) {
                    dialogs.notify("Schedule Route Pickup", "A Delivery visit has already been scheduled for this date");
                    return;
                }


                var args = {};

                if ($scope.Settings.Pickup['Terms and Conditions Acceptance Required'] == 1) {

                    if (!$scope.Pickup.AcceptTerms) {
                        dialogs.error('Error', 'Please accept Terms & Conditions');
                        return;
                    }
                    args.AcceptTerms = $scope.Pickup.AcceptTerms ? 1 : 0;
                }

                var pt = moment(pv.ETAStart);
                args.VisitType = "Pickup";
                args.PickupDate = pt.format("MM/DD/YYYY");

                if (pv.RouteIsInSession) {
                    args.RouteSessionID = pv.RouteSessionID;
                    args.InsertAsStopNumber = pv.InsertAsStopNumber;
                    args.ETAOffset = pv.ETAOffset;
                    args.DetourTime = pv.DetourTime;
                    args.DetourDistance = pv.DetourDistance;
                }

                args.Comments = $scope.Pickup.Comments;
                args.InstructionsRequests = '';

                args.PickupTimeRange = getTimeRangeValue(pv);
                args.PickupStartTime = getStartTime(pv);
                args.PickupEndTime = getEndTime(pv);

                args.PickupRouteID = pv.RouteID;
                args.PickupRouteName = pv.RouteName;
                args.PickupAddress = {};
                args.PickupAddress.AddressTypeID = pv.Address.AddressTypeID;
                args.PickupAddress.Address1 = pv.Address.Address1;
                args.PickupAddress.Address2 = pv.Address.Address2;
                args.PickupAddress.City = pv.Address.City;
                args.PickupAddress.State = pv.Address.State;
                args.PickupAddress.Zip = pv.Address.Zip;

                args.PickupIsRegular = pv.CustomerIsScheduled && !pv.ScheduledVisitID;
                args.PickupIsCancelled = pv.ServiceIsSuspended;

                if (dv != null && !dv.CustomerIsScheduled) {
                    var dvETA = moment(dv.ETAStart);

                    var dt = moment(dv.ETAStart);
                    args.VisitType = "Both Pickup and Delivery";

                    args.DeliveryDate = dt.Date;

                    args.DeliveryType = 1;
                    args.DeliveryComments = "";

                    args.DeliveryTimeRange = getTimeRangeValue(dv);
                    args.DeliveryStartTime = getStartTime(dv);
                    args.DeliveryEndTime = getEndTime(dv);

                    args.DeliveryRouteID = dv.RouteID;
                    args.DeliveryRouteName = dv.RouteName;

                    args.DeliveryAddress = {};
                    args.DeliveryAddress.AddressTypeID = dv.Address.AddressTypeID;
                    args.DeliveryAddress.Address1 = dv.Address.Address1;
                    args.DeliveryAddress.Address2 = dv.Address.Address2;
                    args.DeliveryAddress.City = dv.Address.City;
                    args.DeliveryAddress.State = dv.Address.State;
                    args.DeliveryAddress.Zip = dv.Address.Zip;

                    args.DeliveryIsRegular = dv.CustomerIsScheduled && !dv.ScheduledVisitID;
                    args.DeliveryIsCancelled = dv.ServiceIsSuspended;
                }

                if (pv.ServiceFee > 0) {
                    args.PickupServiceFee = pv.ServiceFee;
                    args.PickupServiceFeeAdjName = pv.ServiceFeeAdjName;
                }

                if (dv != null) {
                    var rush = DeliveryListIndex[pv.Ordinal][dv.Ordinal];

                    if (rush.IsRush) {
                        args.DeliveryIsRush = rush.IsRush;
                        args.DeliveryRushCaption = rush.RushCaption;
                        args.DeliveryRushFee = rush.RushSurcharge;
                        args.DeliveryRushFeeAdjName = rush.RushSurchargeAdjName;
                        args.DeliveryRushDate = dv.ETAStart;
                    }
                }

                dataService.route.savePickup(args).then(function (data) {
                    if (!data.Failed) {
                        dialogs.notify('Success', "Your requested visits have been successfully scheduled");
                        $scope.resetForm();
                    } else {
                        dialogs.error('Error', data.Message);
                    }
                });
            }


            function isCreditCardValid() {

                var cc = $scope.Customer.CreditCards;

                for (var i = 0; i < cc.length; i++) {
                    var c = cc[i];
                    if (c.CardDisabled)
                        continue;
                    var exp = moment(c.CardExpiration).format("MM/YY");
                    if (CustomerConnect.Util.Validate.CCExpiration(exp))
                        return true;
                }
                return false;
            }

            function isSameDayPickupScheduled(pv) {
                var pvETA = moment(pv.ETAStart);

                for (var i = 0; i < $scope.Visits.PickupVisits.length; i++) {
                    if (i == pv.Ordinal)
                        continue;

                    var v = $scope.Visits.PickupVisits[i];

                    if (!v.ServiceIsSuspended && v.CustomerIsScheduled && moment(v.ETAStart).isSame(pvETA, 'day'))
                        return true;
                }

                return false;
            }


            function isSameDayDeliveryScheduled(dv) {

                if (dv == null || dv.CustomerIsScheduled)
                    return false;

                var dvETA = moment(dv.ETAStart);

                for (var i = 0; i < $scope.Visits.DeliveryVisits.length; i++) {
                    if (i == dv.Ordinal)
                        continue;

                    var v = $scope.Visits.DeliveryVisits[i];

                    if (!v.ServiceIsSuspended && v.CustomerIsScheduled && moment(v.ETAStart).isSame(dvETA, 'day'))
                        return true;
                }

                return false;
            }

            $scope.cancelPickup = function () {

                if ($scope.Pickup.selectedPickup == null) {
                    dialogs.notify("Cancel Route Pickup", "Please select a 'Pickup' visit to process");
                    return;
                }

                var pv = $scope.Pickup.selectedPickup == null ? null : $scope.Visits.PickupVisits[$scope.Pickup.selectedPickup];

                if (pv.RouteIsInSession) {
                    dialogs.notify("Cancel Route Pickup", "The route vehicle is en route, and this visit request may no longer be cancelled");
                    return;
                }


                dataService.route.deletePickup(pv.ScheduledVisitID, pv.ETAStart).then(function (data) {
                    if (data.Failed) {
                        dialogs.error('Error', data.Message);
                        return;
                    }

                    if ($scope.Pickup.selectedDelivery != null) {

                        var dv = $scope.Pickup.selectedDelivery == null ? null : $scope.Visits.DeliveryVisits[$scope.Pickup.selectedDelivery];

                        if (pv.CustomerIsScheduled && !pv.ScheduledVisitID && dv.CustomerIsScheduled && !dv.ScheduledVisitID)
                            dataService.route.deletePickup(dv.ScheduledVisitID, dv.ETAStart).then(function (data2) {
                                if (data2.Failed) {
                                    dialogs.error('Error', data.Message);
                                    return;
                                }

                                dialogs.notify('Success', "Your visit cancellation was processed successfully");
                                $scope.resetForm();
                            });
                    }


                    dialogs.notify('Success', "Your visit cancellation was processed successfully");
                    $scope.resetForm();
                    return;
                });
            }

        };
    };
})();