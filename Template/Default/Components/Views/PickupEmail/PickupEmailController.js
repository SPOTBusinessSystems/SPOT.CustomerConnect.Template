(function () {
    'use strict';

    angular
    .module('app')
    .controller('PickupEmailController', PickupEmailController);

    PickupEmailController.$inject = ['$scope', '$stateParams', 'localStorageService', 'apiConfig', 'dataService', '$http'];

    function PickupEmailController($scope, $stateParams, localStorageService, apiConfig, dataService, $http) {
        if (!$stateParams.Status) {
            $stateParams.Status = "Fail";
        }

        $scope.tokens = $stateParams;

        $scope.Init = function () {
            $scope.view = { template: null, tokens: null };
            var file = "PickupEmail.htm";

            if ($stateParams.Status == "Fail") {
                file = "PickupEmailError.htm";
            }

            //$http.get(apiConfig.getFileResourceUrl(file)).then(function (template) {
                //$scope.view = { template: template.data, tokens: $scope.tokens };
            //});

            dataService.util.getFileResource(file).then(function (template) {
              $scope.view = { template: template, tokens: $scope.tokens };
            });
        }

        $scope.Init();
    }
})();