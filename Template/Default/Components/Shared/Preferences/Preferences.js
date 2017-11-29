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

            var updateModel = function (model) {
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
            };

            iElement.bind('change', function () {
                scope.$apply(function () {
                    var model = ngModel.$viewValue;
                    updateModel(model);
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

            var loadPreferencesList = function (preferences) {

                var res = [];

                // Reformat preferences from API output
                for (var x = 0; x < preferences.length; x++) {
                    var z = preferences[x];
                    var name = z.Name;
                    var description = z.Description;
                    if (description == '')
                        description = name;

                    var y = findInArray(res, name);

                    if (y == -1) {
                        // Add new
                        res.push({
                            name: name,
                            description: description,
                            values: [z.Value]
                        });
                    } else {
                        // Update existing
                        res[y].values.push(z.Value);
                    }
                }

                return res;
            };

            var setSelected = function (preferences, model) {
                for (var x = 0; x < model.length; x++) {
                    for (var y = 0; y < preferences.length; y++) {
                        if (model[x].Name == preferences[y].name) {
                            // Found, get value
                            preferences[y].selectedValue = model[x].Value;
                        }
                    }
                }
            };

            $scope.preferences = [];

            if (configService.profile != null) {
                var preferences = configService.getProfile().Preferences;

                $scope.preferences = loadPreferencesList(preferences);
            }

            // Set customer defaults
            var model = $scope.ngModel;
            setSelected($scope.preferences, model);
        }
    }
})();