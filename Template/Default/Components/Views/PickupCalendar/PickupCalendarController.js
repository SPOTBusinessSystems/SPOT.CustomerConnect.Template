(function () {
    'use strict';

    angular
    .module('app')
    .controller('PickupCalendarController', PickupCalendarController);

    PickupCalendarController.$inject = ['$rootScope', '$scope', 'dialogs', 'blockUI', '$state', 'settingsService', 'dataService', 'userService', 'configService', '$ocLazyLoad'];

    function PickupCalendarController($rootScope, $scope, dialogs, blockUI, $state, settingsService, dataService, userService, configService, $ocLazyLoad) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'PickupOldController';

        activate();

        function activate() {
            $scope.Customer = userService.getCustomer();
            $scope.Settings = configService.getProfile();
            $scope.Route = {};
            $scope.DisabledDates = {};

            $scope.DaysAfterPickup = Number($scope.Settings.Pickup["Minimum Days After Pickup"]);


            // The number of days after the pickup date. Default is 2 days.
            if (Number($scope.Settings.Pickup["Minimum Days After Pickup"]) != 'NaN') {
                $scope.DaysAfterPickup = Number($scope.Settings.Pickup["Minimum Days After Pickup"]);
            } else {
                $scope.DaysAfterPickup = 2;
            }

            // Determines if the date is selectable
            $scope.invalidDay = function (index) {
                if (index == 0) {
                    index = 7;
                }

                return ($scope.Customer.RouteDays.charAt(index - 1) == '-');
            };

            $scope.addTimeString = function (date, time) {
                try {
                    if (typeof time === "undefined" || time.isBlank()) {
                        return date;
                    }

                    var parts = time.split(":");

                    var hour = 0;
                    var minute = 0;
                    var second = 0;

                    date = moment(date).startOf('day');

                    // hour
                    if (parts.length >= 1) {
                        date = date.hours(parts[0]);
                    }

                    // minute
                    if (parts.length >= 2) {
                        date = date.minutes(parts[1]);
                    }

                    // second
                    if (parts.length >= 3) {
                        date = date.seconds(parts[2]);
                    }

                    return date.toDate();
                }
                catch (ex) {
                    return date;
                }
            };

            $scope.findNextDate = function (date) {
                // Skip invalid days - Only allow looping 30 days. If not found by then, no valid min delivery date exists.
                var i = 0;

                while ($scope.invalidDay(new Date(date).getDay()) && i < 30) {
                    date = new Date(date).addDays(1);
                    i++;
                }

                return date;
            }

            // Excludes non-business days
            $scope.getMinDeliveryDate = function (date) {
                var x = new Date(date);
                x = $scope.addBusinessDays(x, $scope.DaysAfterPickup);
                x = $scope.findNextDate(x);
                return x;
            };

            $scope.addBusinessDays = function (date, n) {
                var d = date;

                for (var i = 0; i < n;) {
                    var dow = d.getDay();
                    if (dow != 0 && dow != 6)
                        i++;
                    d = d.addDays(1);
                }
                return d;
            }

            // Retrieve Timeslots if we need to show the time.
            if ($scope.Settings.TimeSlots == null && $scope.Settings.Pickup["Allow Time Selection"] == '1') {
                dataService.settings.getTimeSlots().then(function (data) {
                    if (!data.Failed) {
                        $scope.Settings.TimeSlots = data.ReturnObject;
                        configService.setProfile($scope.Settings);
                    } else {
                        dialogs.error('Error', 'Unable to display allowed time slots.');
                    }
                })
            }

            // Retrieve Holidays
            {
                dataService.route.getHolidays().then(function (data) {
                    if (!data.Failed) {
                        setExcludedDays(data.ReturnObject);
                        setPickupDateOptions();
                    }
                })
            }

            function setExcludedDays(holidays) {
                var a;

                var routeID = $scope.Customer.RouteID;
                if (routeID && routeID != "00000000-0000-0000-0000-000000000000") {
                    a = holidays.HolidayScheduleAssignments[routeID];

                    if (a && a.AssignmentType != 'R')
                        console.log("Invalid AssignmentType" + a.AssignmentType);
                }

                if (!a) {
                    var storeID = $scope.Customer.AccountNodeID;
                    a = holidays.HolidayScheduleAssignments[storeID];

                    if (!a) {
                        console.log("Undefined HolidayScheduleAssignments for store " + storeID);
                        return;
                    }

                    if (a.AssignmentType != 'S')
                        console.log("Invalid AssignmentType" + a.AssignmentType);
                }

                if (!a) {
                    console.log("Undefined HolidayScheduleAssignments for route " + routeID);
                    return;
                }

                var name = a.HolidayScheduleName;
                var e = holidays.HolidaySchedules[name].Entries;
                for (var i = 0; i < e.length; i++) {
                    var startDate = moment(e[i].StartDate);
                    var endDate = moment(e[i].EndDate);

                    while (startDate < endDate) {
                        $scope.DisabledDates[startDate.format('YYYY-MM-DD')] = true;
                        startDate.add(1, 'd');
                    }
                }
            }

            // Initialize variables.
            $scope.Pickup = { Comments: '', Instructions: '', Date: null, DeliveryDate: null, Visit: 'Pickup', DeliveryComments: '', AcceptTerms: false };
            $scope.pickupTimeSlot = '';
            $scope.deliveryTimeSlot = '';


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

            var minDate = $scope.addTimeString(Date.now(), $scope.Route.SameDayCutoffTime);

            if (minDate < Date.now()) {
                minDate = moment(minDate).add(1, 'days');
            }

            $scope.cutoffTime = moment(minDate).format('hh:mm A');

            setPickupDateOptions();
            setDeliveryDateOptions();

            $scope.dateFormat = $scope.Settings.General["Data Formats"]["Date Format"].toLowerCase().split("m").join("M"); // Lowercase, then replace all m to M.

            // Determines if the date is selectable
            function isDateDisabled(d) {
                var date = d.date,
                  mode = d.mode;

                var res = (mode === 'day' && ($scope.invalidDay(date.getDay()) || $scope.DisabledDates[moment(date).format("YYYY-MM-DD")]));
                return res;
            }

            // Submit the scheduled pickup
            $scope.schedulePickup = function () {

                if ($scope.Settings.Pickup['Allow Delivery Date Selection'] == '1') {
                    $scope.Pickup.DeliveryDate = moment($scope.Pickup.DeliveryDate).format();
                } else {
                    $scope.Pickup.DeliveryDate = null;
                }

                var pickupDate = moment($scope.Pickup.Date).format("MM/DD/YYYY");
                var deliveryDate = null;

                if ($scope.Pickup.DeliveryDate) {
                    deliveryDate = moment($scope.Pickup.DeliveryDate).format("MM/DD/YYYY");
                }

                // Build data object
                var pickup = {
                    pickupDate: pickupDate,
                    deliveryDate: deliveryDate,
                    comments: $scope.Pickup.Comments,
                    deliveryComments: $scope.Pickup.DeliveryComments,
                    instructionsRequests: $scope.Pickup.Instructions,
                    visitType: $scope.Pickup.Visit
                }

                if ($scope.Settings.Pickup['Allow Time Selection'] == '1') {
                    pickup.pickupDate = moment(moment(pickup.pickupDate).format("MM/DD/YYYY") + " " + $scope.pickupTime.StartTime).format();
                    pickup.pickupTimeRange = $scope.pickupTime.TimeRange;
                    pickup.pickupStartTime = $scope.pickupTime.StartTime;
                    pickup.pickupEndTime = $scope.pickupTime.EndTime;

                    if ($scope.Settings.Pickup['Allow Delivery Date Selection']) {
                        pickup.deliveryDate = moment(moment(pickup.deliveryDate).format("MM/DD/YYYY") + " " + $scope.deliveryTime.StartTime).format();
                        pickup.deliveryTimeRange = $scope.deliveryTime.TimeRange;
                        pickup.deliveryStartTime = $scope.deliveryTime.StartTime;
                        pickup.deliveryEndTime = $scope.deliveryTime.EndTime;
                    }
                }

                if ($scope.Settings.Pickup['Terms and Conditions Acceptance Required'] == 1) {
                    pickup.acceptTerms = $scope.Pickup.AcceptTerms ? 1 : 0;
                }

                dataService.route.savePickup(pickup).then(function (data) {
                    if (!data.Failed) {
                        dialogs.notify('Success', 'Your pickup has been scheduled for ' + moment($scope.Pickup.Date).format($scope.dateFormat.toUpperCase()) + '.');
                        $scope.resetForm();
                    } else {
                        dialogs.error('Error', data.Message);
                    }
                });
            };

            $scope.resetForm = function () {
                $state.reload();
            }

            // Get pending pickups and show dialog.
            $scope.pendingPickups = function () {
                dataService.route.getPendingPickups().then(function (data) {
                    if (!data.Failed) {
                        var p = $ocLazyLoad.load(settingsService.path + 'Components/Dialogs/PickupsController.js');
                        p.then(function () {
                            var dlg = dialogs.create(settingsService.path + 'Components/Dialogs/Pickups.html', 'PickupsController', data.ReturnObject);
                        });
                    } else {
                        dialogs.error('Error', 'Unable to display pending pickups.');
                    }
                });
            };

            function setPickupDateOptions() {
                // Date Control options
                $scope.pickupDateOptions = {
                    formatYear: 'yy',
                    startingDay: 1,
                    minDate: $scope.findNextDate(minDate),
                    maxDate: moment().add(3, 'months'),
                    dateDisabled: isDateDisabled
                };
            }

            function setDeliveryDateOptions() {
                $scope.deliveryDateOptions = {
                    formatYear: 'yy',
                    startingDay: 1,
                    minDate: $scope.getMinDeliveryDate($scope.Pickup.Date),
                    maxDate: moment().add(3, 'months'),
                    dateDisabled: isDateDisabled
                };
            }

            // On date change
            $scope.pickupDateChange = function () {
                // Check to make sure delivery date is not prior to pickup date.
                if ($scope.Settings.Pickup['Allow Delivery Date Selection'] == '1') {
                    setDeliveryDateOptions();

                    if (new Date($scope.Pickup.DeliveryDate) < new Date($scope.deliveryDateOptions.minDate)) {
                        $scope.Pickup.DeliveryDate = $scope.deliveryDateOptions.minDate;
                    }
                }
            };

            // On time slot change, we need the start time to go into the date.
            $scope.pickupTimeChange = function (data) {
                $scope.pickupTime = data;
            };

            $scope.deliveryTimeChange = function (data) {
                $scope.deliveryTime = data;
            }

            // Filters the time slots based on type
            $scope.isPickupTime = function (value) {
                return function (item) {
                    return item.VisitType == 'Pickup';
                }
            }

            // Filters the time slots based on type
            $scope.isDeliveryTime = function (value) {
                return function (item) {
                    return item.VisitType == 'Delivery';
                }
            }
        };
    };
})();