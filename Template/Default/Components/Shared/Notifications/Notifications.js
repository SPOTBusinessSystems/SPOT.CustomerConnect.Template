(function () {
    'use strict';

    angular.module('app').directive('notifications', notifications);
    notifications.$inject = ['settingsService', 'configService'];

    function notifications(settingsService, configService) {
        var directive = {
            controller: controller,
            link: link,
            restrict: 'E',
            templateUrl: settingsService.path + 'Components/Shared/Notifications/Notifications.html',
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

                    for (var x = 0; x < scope.notifications.length; x++) {
                        if (scope.notifications[x].selectedMethod != null) {
                            var updated = false;

                            for (var y = 0; y < model.length; y++) {
                                // Change model.
                                if (model[y].NotificationTypeName == scope.notifications[x].name) {
                                    model[y].NotificationMethodName = scope.notifications[x].selectedMethod.name;
                                    model[y].NotificationMethodDescription = scope.notifications[x].selectedMethod.description;
                                    model[y].NotificationValue = true;
                                    updated = true;
                                }
                            }

                            if (!updated) {
                                // Was not in the original data set.
                                model.push({
                                    NotificationMethodDescription: scope.notifications[x].selectedMethod.description,
                                    NotificationMethodName: scope.notifications[x].selectedMethod.name,
                                    NotificationTypeDescription: scope.notifications[x].description,
                                    NotificationTypeName: scope.notifications[x].name,
                                    NotificationValue: true
                                })
                            }
                        }
                    }

                    ngModel.$setViewValue(model);
                });
            });
        }

        function controller($scope) {
            function findInArray(arr, x) {
                for (var y = 0; y < arr.length; y++) {
                    if (arr[y].typeId == x) {
                        return y;
                    }
                }

                return -1;
            }

            $scope.notifications = [];

            if (configService.profile != null)
            {
                var notifications = configService.getProfile().Notifications;

                for (var x = 0; x < notifications.length; x++) {
                    var y = findInArray($scope.notifications, notifications[x].TypeID);
                    var z = notifications[x];

                    if (z.MethodDescription == '') {
                        z.MethodDescription = z.MethodName;
                    }

                    if (y == -1) {
                        $scope.notifications.push({
                            typeId: z.TypeID,
                            name: z.Name,
                            description: z.Description,
                            abbr: z.Abbreviation,
                            methods: [{
                                methodId: z.MethodID,
                                name: z.MethodName,
                                description: z.MethodDescription,
                                abbr: z.MethodAbbreviation,
                                default: z.DefaultValue
                            }]
                        });
                    } else {
                        $scope.notifications[y].methods.push({
                            methodId: z.MethodID,
                            name: z.MethodName,
                            description: z.MethodDescription,
                            abbr: z.MethodAbbreviation,
                            default: z.DefaultValue
                        });
                    }
                }

                // Set customer defaults
                var model = $scope.ngModel;

                for (var x = 0; x < model.length; x++) {
                    for (var y = 0; y < $scope.notifications.length; y++) {
                        if (model[x].NotificationTypeName == $scope.notifications[y].name) {
                            // Found, get method.
                            for (var z = 0; z < $scope.notifications[y].methods.length; z++) {
                                if (model[x].NotificationMethodName == $scope.notifications[y].methods[z].name) {
                                    // Set as selected.
                                    $scope.notifications[y].selectedMethod = $scope.notifications[y].methods[z];
                                }
                            }
                        }
                    }
                }

                console.log(model);
            }
        }
    }
})();