(function () {
    'use strict';

    angular.module('app').directive('ccexp', ccExp);
    ccExp.$inject = ['settingsService'];

    function ccExp(settingsService) {
        var directive = {
            controller: controller,
            link: link,
            restrict: 'E',
            templateUrl: settingsService.path + 'Components/Shared/CCExp/CCExp.html',
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

            iElement.bind('change', function () {
                scope.$apply(function () {
                    if (scope.ccMonth && scope.ccYear) {
                        ngModel.$setViewValue(moment(scope.ccMonth + "/1/" + scope.ccYear, "MM/dd/YYYY").format("MM/YY") + "");
                    }
                });
            });

            scope.$watch(ngModel, function () {
                if (ngModel.$viewValue != null)
                {
                    var d = moment(ngModel.$viewValue, "MM/DD/YYYY hh:mm:ss a");

                    scope.ccMonth = d.month() + 1;
                    scope.ccYear = d.year();
                }
            });
        }

        function controller($scope) {
            $scope.years = [];

            for (var x = 0; x < 8; x++) {
                $scope.years.push((new Date().getYear() + 1900 + x));
            }
        }
    }
})();