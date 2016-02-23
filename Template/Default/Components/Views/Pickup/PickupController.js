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

            var d = new Date();
            d.setHours(8);
            d.setMinutes(0);
            d.setSeconds(0);

            $scope.Pickup = { Comments: '', Instructions: '', Date: d, DeliveryDate: moment(d).add(1, 'days').format(), Visit: 'Pickup' };

            if ($scope.Settings.Pickup["Allow Delivery Date Selection"] == '1') {
                $scope.Pickup.Visit = 'Both Pickup and Delivery';
            }

            // Date Control
            $scope.dateOptions = {
                formatYear: 'yy',
                startingDay: 1
            };

            $scope.dateFormat = $scope.Settings.General["Data Formats"]["Date Format"].toLowerCase().split("m").join("M"); // Lowercase, then replace all m to M.
            console.log($scope.dateFormat);
            $scope.minDate = Date.now();
            $scope.initDate = Date.now(); // Need to consider valid days.
            $scope.maxDate = moment().add(3, 'months');

            $scope.inValidDay = function (index) {
                if (index == 0) {
                    index = 7;
                }
                return ($scope.Customer.RouteDays.charAt(index - 1) == '-');
            };

            $scope.disabled = function (date, mode) {
                return (mode === 'day' && $scope.inValidDay(date.getDay()));
            };

            $scope.open = function ($event, pickup) {
                $event.preventDefault();
                $event.stopPropagation();

                if (pickup) {
                    $scope.openedPickup = true;
                } else {
                    $scope.openedDelivery = true;
                }
            };

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

                var pickup = {
                    pickupDate: pickupDate,
                    deliveryDate: deliveryDate,
                    comments: $scope.Pickup.Comments,
                    instructionsRequests: $scope.Pickup.Instructions,
                    visitType: $scope.Pickup.Visit
                }

                dataService.route.savePickup(pickup).then(function (data) {
                    if (!data.Failed) {
                        dialogs.notify('Success', 'Your pickup has been scheduled for ' + moment($scope.Pickup.Date).format($scope.dateFormat.toUpperCase()) + '.');
                        $scope.pickupForm.$setPristine();
                        $scope.Pickup = { Date: null, Comments: '', Instructions: '' };
                    } else {
                        dialogs.error('Error', 'Your pickup was not able to be scheduled. Please try again.');
                    }
                });
            };

            $scope.pendingPickups = function () {
                dataService.route.getPendingPickups().then(function (data) {
                    if (!data.Failed) {
                        var dlg = dialogs.create(settingsService.path + 'Components/Dialogs/Pickups.html', 'PickupsController', data.ReturnObject);
                    } else {
                        dialogs.error('Error', 'Unable to display pending pickups.');
                    }
                });
            };

            $scope.timeChange = function () {
                if ($scope.Pickup.Date.getHours() > 15) {
                    var maxDate = $scope.Pickup.Date;
                    maxDate.setHours(15);
                    maxDate.setMinutes(0);

                    $scope.Pickup.Date = maxDate;
                }
            };
        };
    };
})();