(function () {
    'use strict';

    angular.module('app').directive('specialInstructions', specialInstructions);
    specialInstructions.$inject = ['settingsService', 'configService'];

    function specialInstructions(settingsService, configService) {
        var directive = {
            controller: controller,
            link: link,
            restrict: 'E',
            templateUrl: settingsService.path + 'Components/Shared/SpecialInstructions/SpecialInstructions.html',
            scope: true
        };
        return directive;

        function link(scope, iElement, iAttrs) {

        }

        function controller($scope) {

            $scope.IsPickupInstructions = function()
            {
                var c = $scope.Customer;
                return c.RouteName && (c.RouteName != '');
            }
        }
    }
})();