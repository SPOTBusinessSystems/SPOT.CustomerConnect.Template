(function () {
    'use strict';

    angular.module('app').directive('notifications', notificationsDirective);
    notificationsDirective.$inject = ['settingsService', 'configService', '$filter'];

    function notificationsDirective(settingsService, configService, $filter) {
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

            scope.updateModel = function () {

                var model = ngModel.$viewValue.Notifications;
                var nn = scope.notifications;

                for (var x = 0; x < nn.length; x++) {
                    if (nn[x].selectedMethod != null) {
                        var updated = false;

                        for (var y = 0; y < model.length; y++) {
                            // Change model.
                            if (model[y].NotificationTypeName == nn[x].name) {
                                model[y].NotificationMethodName = nn[x].selectedMethod.name;
                                model[y].NotificationMethodDescription = nn[x].selectedMethod.description;
                                model[y].NotificationValue = true;
                                updated = true;
                            }
                        }

                        if (!updated) {
                            // Was not in the original data set.
                            model.push({
                                NotificationMethodDescription: nn[x].selectedMethod.description,
                                NotificationMethodName: nn[x].selectedMethod.name,
                                NotificationTypeDescription: nn[x].description,
                                NotificationTypeName: nn[x].name,
                                NotificationValue: true
                            })
                        }
                    }
                }

                ngModel.$setViewValue(ngModel.$viewValue);
            }
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

            if (configService.profile != null) {
                var notifications = configService.getProfile().Notifications;

                for (var x = 0; x < notifications.length; x++) {
                    var y = findInArray($scope.notifications, notifications[x].TypeID);
                    var z = notifications[x];

                    if (!z.DisplayOnWeb)
                        continue;

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

                // Sort
                $scope.notifications = $filter('orderBy')($scope.notifications, ['Description', 'MethodName'], false);

                // Set customer defaults
                var model = $scope.ngModel.Notifications;

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
            }


            $scope.getPhone = function (name) {
                var pL = $scope.ngModel.Phones;

                for (var i = 0; i < pL.length; i++) {
                    if (pL[i].PhoneType == name)
                        return pL[i].Number;
                }

                return "";
            }


            $scope.getNotificationValue = function (name) {
                switch (name) {
                    case "Email1": return $scope.ngModel.EmailAddress;
                    case "Email2": return $scope.ngModel.EmailAddress2;
                    case "Email3": return $scope.ngModel.EmailAddress3;
                    case "Email4": return $scope.ngModel.EmailAddress4;


                    case "PhoneCell": return $scope.getPhone("Cell/Mobile");
                    case "PhoneHome": return $scope.getPhone("Home");
                    case "PhoneOther": return $scope.getPhone("Other");

                    case "PhonePrimary": return $scope.getPhone("Principal");
                    case "PhoneSMS": return $scope.getPhone("Cell/Mobile");
                    case "PhoneWork": return $scope.getPhone("Work");


                    default:
                    case "Disabled": return "";
                }

                return name + name;
            }

            $scope.getSelectedText = function (item) {
                if (item !== undefined) {
                    var x = $scope.getNotificationValue(item.name);
                    if (x)
                        x = " - " + x;

                    return item.name + " <span class='notificationValue'>" + x + "</span>";
                } else {
                    return "Please select an item";
                }
            };

            $scope.getOptionText = function (name) {
                if (name !== undefined) {
                    var x = $scope.getNotificationValue(name);
                    if (x)
                        x = " - " + x;

                    return name + x;
                } else {
                    return "";
                }
            };
        }
    }
})();