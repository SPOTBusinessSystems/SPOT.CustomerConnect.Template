(function () {
    'use strict';

    var app = angular.module('app');


    app.directive('googleplace', function () {
        return {
            require: 'ngModel',
            scope: {
                ngModel: '=',
                details: '=?',
                latitude: '=?',
                longitude: '=?',
            },
            link: function (scope, element, attrs, model) {
                var options = {
                    types: ['geocode']
                };
                scope.gPlace = new google.maps.places.Autocomplete(element[0], options);

                google.maps.event.addListener(scope.gPlace, 'place_changed', function () {
                    scope.$apply(function () {
                        scope.details = scope.gPlace.getPlace();
                        model.$setViewValue(element.val());
                    });
                });
            }
        };
    });


    app.controller('LockerController', LockerController);

    LockerController.$inject = ['$scope', 'dialogs', 'blockUI', 'settingsService', 'userService', 'dataService', '$ocLazyLoad', '$state', 'configService', 'WizardHandler'];

    function LockerController($scope, dialogs, blockUI, settingsService, userService, dataService, $ocLazyLoad, $state, configService, WizardHandler) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'LockerController';

        activate();

        function activate() {

            $scope.Content = { RecentLockerBanks: [], LockerBanks: [], Lockers: [] };

            $scope.Data = { SelectedRecentLockerBank: null, SelectedLockerBank: null, SelectedLocker: null, Comments: null, Lat: undefined, Lng: undefined, Place: null, PlaceDetails: null };

            $scope.Customer = userService.getCustomer();
            $scope.Settings = configService.getProfile();

            $scope.autocomplete = null;


            function loadRecentBanks() {
                var p = dataService.route.getLockerBanksRecent(40, -111);
                p.then(function (data) {

                    if (data.Failed) {
                        dialogs.error(data.Message, data.MessageDetails);
                        return;
                    }

                    $scope.Content.RecentLockerBanks = data.ReturnObject;

                    if ($scope.Content.RecentLockerBanks.length == 1)
                        $scope.Data.SelectedRecentLockerBank = $scope.Content.RecentLockerBanks[0];
                });
            }

            $scope.Init = function () {

                loadRecentBanks();
            }

            $scope.Init();

            $scope.finishedWizard = function () {
                //console.log('finishedWizard');
                //$state.reload();
                $state.go('account');
            }

            var hasLocker = function (a, item) {

                for (var i = 0; i < a.length; i++) {
                    if (a[i].ID == item.ID)
                        return true;
                }

                return false;
            }

            $scope.selectBanks = function () {

                if (!$scope.Data.PlaceDetails || !$scope.Data.PlaceDetails.geometry.location.lat() || !$scope.Data.PlaceDetails.geometry.location.lng()) {
                    dialogs.error('Invalid address', 'Unable to determine address location');
                    return;
                }

                $scope.Data.Lat = $scope.Data.PlaceDetails.geometry.location.lat();
                $scope.Data.Lng = $scope.Data.PlaceDetails.geometry.location.lng();


                var p = dataService.route.getLockerBanks($scope.Data.Lat, $scope.Data.Lng);

                p.then(function (data) {

                    console.log(data);


                    if (data.Failed) {
                        dialogs.error('Load failed.', data.Message);
                        return;
                    }

                    $scope.Content.LockerBanks = data.ReturnObject;


                    if ($scope.Content.LockerBanks.length == 0) {
                        dialogs.error('No Lockers Found', 'Unable to locate locker near address specified');
                        return;
                    }

                    if ($scope.Content.LockerBanks.length == 1)
                        $scope.Data.SelectedLockerBank = $scope.Content.LockerBanks[0];

                    WizardHandler.wizard('LockerWizard').next();

                }, function (error) {

                    dialogs.error('Lockers Load failed.', 'Unable to load Lockers info');
                    console.log(error);
                });

            }

            $scope.selectRecentLockers = function () {
                $scope.Data.SelectedLockerBank = $scope.Data.SelectedRecentLockerBank;
                $scope.selectLockers();
            }

            $scope.selectLockers = function () {

                

                //console.log('selectLockers');

                var p = dataService.route.getLockerBank($scope.Data.SelectedLockerBank.ID);

                p.then(function (data) {

                    //console.log('result');
                    //console.log(data);

                    if (data.Failed) {
                        dialogs.error('Load failed.', data.Message);
                        return;
                    }

                    $scope.Data.SelectedLocker = null;

                    $scope.Content.Lockers = data.ReturnObject.Lockers;

                    if ($scope.Content.Lockers.length == 0) {
                        dialogs.error('No Lockers Found', 'Sorry, no lockers available');
                        return;
                    }

                    if ($scope.Content.Lockers.length == 1)
                        $scope.Data.SelectedLocker = $scope.Content.Lockers[0];

                    WizardHandler.wizard('LockerWizard').goTo("StepLocker");

                }, function (error) {

                    dialogs.error('Lockers Load failed.', 'Unable to load Lockers info');
                    console.log(error);
                });
            }


            $scope.submit = function () {

                var p = dataService.route.postLockerEvent($scope.Data.SelectedLocker.ID, $scope.Data.Comments);

                p.then(function (data) {

                    //console.log('result');
                    //console.log(data);

                    if (data.Failed) {

                        var message = data.Message;
                        var messageDetails = data.MessageDetails;

                        if (data.Message == 'An error has occurred.' && data.MessageDetails.includes('Our records indicate this locker is already reserved for your order')) {
                            messageDetails = 'Thank you for your request! Our records indicate this locker is already reserved for your order.';
                        }

                        if (data.Message == 'An error has occurred.' && data.MessageDetails.includes('our records indicate this locker contains an order for another customer. Please select another locker')) {
                            messageDetails = 'We\'re sorry, our records indicate this locker contains an order for another customer. Please select another locker.';
                        }

                        

                        //dialogs.error('Locker check-in failed.', message);
                        dialogs.error(message, messageDetails);
                        return;
                    }

                    WizardHandler.wizard('LockerWizard').next();

                }, function (error) {

                    dialogs.error('Locker Request failed', 'Unable to submit request. Locker check-in process is NOT COMPLETED.');
                    console.log(error);
                });
            }

            $scope.backtoStart = function () {
                WizardHandler.wizard('LockerWizard').goTo("Step1");
            }

        }
    };
})();