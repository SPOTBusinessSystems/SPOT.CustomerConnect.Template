(function () {
    'use strict';

    angular.module('app').directive('states', states);
    states.$inject = ['settingsService', 'configService'];

    function states(settingsService, configService) {
        var directive = {
            controller: controller,
            link: link,
            restrict: 'E',
            templateUrl: settingsService.path + 'Components/Shared/States/States.html',
            require: 'ngModel',
            scope: {
                ngModel: '='
            }
        };
        return directive;

        function link(scope, iElement, iAttrs, ngModel) {
            if (!ngModel) {
                return;
            }

            // Initial value
            scope.$watch(ngModel, function () {
                if (ngModel.$viewValue != null) {
                    scope.selectedState = { Key: ngModel.$viewValue }
                }
            });

            // Set updated for main form.
            iElement.bind('change', function () {
                scope.$apply(function () {
                    ngModel.$setViewValue(scope.selectedState.Key);
                });
            });
        }

        function controller($scope) {
            $scope.selectedState = {};
            $scope.states = configService.getProfile().States;
        }
    }
})();