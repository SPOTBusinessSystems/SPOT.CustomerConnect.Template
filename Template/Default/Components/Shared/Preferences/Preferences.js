(function () {
    'use strict';

    angular.module('app').directive('preferences', preferences);
    preferences.$inject = ['settingsService', 'configService'];

    function preferences(settingsService, configService) {
        var directive = {
            controller: controller,
            link: link,
            restrict: 'E',
            templateUrl: settingsService.path + 'Components/Shared/Preferences/Preferences.html',
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
                    var model = ngModel.$viewValue;

                    for (var x = 0; x < scope.preferences.length; x++) {
                        //Loop through preferences
                        if (scope.preferences[x].selectedValue != null) {
                            var updated = false;

                            for (var y = 0; y < model.length; y++) {
                                // Change model.
                                if (model[y].Name == scope.preferences[x].name) {
                                    model[y].Value = scope.preferences[x].selectedValue;
                                    updated = true;
                                }
                            }

                            if (!updated) {
                                // Was not in original data set.
                                model.push({
                                    Description: scope.preferences[x].description,
                                    Name: scope.preferences[x].name,
                                    value: scope.preferences[x].selectedValue
                                });
                            }
                        }
                    }
                });
            });
        }

        function controller($scope) {
            function findInArray(arr, x) {
                for (var y = 0; y < arr.length; y++) {
                    if (arr[y].name == x) {
                        return y;
                    }
                }

                return -1;
            }

            $scope.preferences = [];

            if (configService.profile != null) {
                var preferences = configService.getProfile().Preferences;

                // Reformat preferences from API output
                for (var x = 0; x < preferences.length; x++) {
                    var y = findInArray($scope.preferences, preferences[x].Name);
                    var z = preferences[x];

                    if (y == -1) {
                        // Add new
                        $scope.preferences.push({
                            name: z.Name,
                            description: z.Description,
                            values: [z.Value]
                        });
                    } else {
                        // Update existing
                        $scope.preferences[y].values.push(z.Value);
                    }

                }
            }

            // Set customer defaults
            var model = $scope.ngModel;

            for (var x = 0; x < model.length; x++) {
                for (var y = 0; y < $scope.preferences.length; y++) {
                    if (model[x].Name == $scope.preferences[y].name) {
                        // Found, get value
                        $scope.preferences[y].selectedValue = model[x].Value;
                    }
                }
            }
        }
    }
})();