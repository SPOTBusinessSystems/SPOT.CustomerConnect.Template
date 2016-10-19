(function () {
    'use strict';

    angular
    .module('app')
    .controller('ConfirmationController', ConfirmationController);

    ConfirmationController.$inject = ['$scope', '$stateParams', 'localStorageService', 'apiConfig', 'dataService', '$http'];

    function ConfirmationController($scope, $stateParams, localStorageService, apiConfig, dataService, $http) {
        if (!$stateParams.Status) {
            $stateParams.Status = "Fail";
        }

        console.log($stateParams);

        $scope.tokens = $stateParams;

        $scope.Init = function () {
            $scope.view = { template: null, tokens: null };

            if (!$stateParams.Type) {
                $scope.view = { template: "Unknown type.", tokens: null };
                return;
            }

            console.log($stateParams);

            if ($stateParams.Type == "Unsubscribe") {
                if ($stateParams.Status == "Fail") {
                    var file = "UnsubscribeError.htm";
                } else {
                    var file = "Unsubscribe.htm";
                }
            } else if ($stateParams.Type == "PickupPostback") {
                if ($stateParams.Status == "Fail") {
                    var file = "PickupEmailError.htm";
                } else {
                    var file = "PickupEmail.htm";
                }
            } else if ($stateParams.Type == "EmailReview") {
                if ($stateParams.Status == "Fail") {
                    var file = "EmailReviewError.htm";
                } else {
                    var file = "EmailReview.htm";
                }
            } else {
                $scope.view = { template: "Unknown type.", tokens: null };
                return;
            }

            dataService.util.getFileResource(file).then(function (template) {
              $scope.view = { template: template, tokens: $scope.tokens };
            });
        }

        $scope.Init();
    }
})();