(function () {
    'use strict';

    angular
    .module('app')
    .controller('PickupController', PickupController);

    PickupController.$inject = ['$rootScope', '$scope', 'dialogs','blockUI','$state','settingsService','dataService','userService','configService'];

    function PickupController($rootScope, $scope, dialogs, blockUI, $state, settingsService, dataService, userService, configService) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'PickupController';

        activate();

        function activate() {
            $scope.Customer = userService.getCustomer();
            $scope.Settings = configService.getProfile();
            $scope.DaysAfterPickup = Number($scope.Settings.Pickup["Minimum Days After Pickup"]);

            // The number of days after the pickup date. Default is 2 days.
            if (Number($scope.Settings.Pickup["Minimum Days After Pickup"]) != 'NaN') {
                $scope.DaysAfterPickup = Number($scope.Settings.Pickup["Minimum Days After Pickup"]);
            } else
            {
                $scope.DaysAfterPickup = 2;
            }

            // Determines if the date is selectable
            $scope.inValidDay = function (index) {
                if (index == 0) {
                    index = 7;
                }
                return ($scope.Customer.RouteDays.charAt(index - 1) == '-');
            };

            //Test Properties
            //$scope.Settings.Pickup['Allow Delivery Date Selection'] = '1';
            //$scope.Settings.Pickup['Allow Time Selection'] = '1';
            

            // Retrieve Timeslots if we need to show the time.
            if ($scope.Settings.TimeSlots == null && $scope.Settings.Pickup["Allow Time Selection"] == '1') {
                dataService.settings.getTimeSlots().then(function (data) {
                    if (!data.Failed) {
                        $scope.Settings.TimeSlots = data.ReturnObject;
                        configService.setProfile($scope.Settings);
                        console.log($scope.Settings.TimeSlots);
                        console.log($scope.Customer);
                    } else {
                        dialogs.error('Error', 'Unable to display allowed time slots.');
                    }
                })
            }

            // Initialize variables.
            $scope.Pickup = { Comments: '', Instructions: '', Date: null, DeliveryDate: null, Visit: 'Pickup', DeliveryComments: '' };
            $scope.pickupTimeSlot = '';
            $scope.deliveryTimeSlot = '';

            if ($scope.Settings.Pickup["Allow Delivery Date Selection"] == '1') {
                $scope.Pickup.Visit = 'Both Pickup and Delivery';
            }

            // Date Control options
            $scope.pickupDateOptions = {
                formatYear: 'yy',
                startingDay: 1,
                minDate: Date.now(),
                maxDate: moment().add(3, 'months'),
                dateDisabled: disabled
            };

            $scope.deliveryDateOptions = {
                formatYear: 'yy',
                startingDay: 1,
                minDate: new Date($scope.Pickup.Date).addDays($scope.DaysAfterPickup),
                maxDate: moment().add(3, 'months'),
                dateDisabled: disabled
            };

            $scope.dateFormat = $scope.Settings.General["Data Formats"]["Date Format"].toLowerCase().split("m").join("M"); // Lowercase, then replace all m to M.

            // Determines if the date is selectable
            function disabled(data) {
                var date = data.date,
                  mode = data.mode;
                return (mode === 'day' && $scope.inValidDay(date.getDay(), 2));
            }

            // Submit the scheduled pickup
            $scope.schedulePickup = function () {
                console.log($scope);

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

                dataService.route.savePickup(pickup).then(function (data) {
                    if (!data.Failed) {
                        dialogs.notify('Success', 'Your pickup has been scheduled for ' + moment($scope.Pickup.Date).format($scope.dateFormat.toUpperCase()) + '.');
                        $scope.resetForm();
                    } else {
                        dialogs.error('Error', 'Your pickup was not able to be scheduled. Please try again.');
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
                        var dlg = dialogs.create(settingsService.path + 'Components/Dialogs/Pickups.html', 'PickupsController', data.ReturnObject);
                    } else {
                        dialogs.error('Error', 'Unable to display pending pickups.');
                    }
                });
            };

            // On date change
            $scope.pickupDateChange = function () {
                console.log($scope.Settings);
                console.log('Pickup Date Changed');
                // Check to make sure delivery date is not prior to pickup date.
                if ($scope.Settings.Pickup['Allow Delivery Date Selection'] == '1') {
                    $scope.deliveryDateOptions = {
                        formatYear: 'yy',
                        startingDay: 1,
                        minDate: new Date($scope.Pickup.Date).addDays($scope.DaysAfterPickup),
                        maxDate: moment().add(3, 'months'),
                        dateDisabled: disabled
                    };

                    // Skip invalid days
                    while ($scope.inValidDay(new Date($scope.deliveryDateOptions.minDate).getDay())) {
                        $scope.deliveryDateOptions.minDate = new Date($scope.deliveryDateOptions.minDate).addDays(1);
                    }
                    
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