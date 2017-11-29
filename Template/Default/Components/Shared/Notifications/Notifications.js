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





        function findInArray(arr, x, field) {
            for (var y = 0; y < arr.length; y++) {
                if (arr[y][field] == x) {
                    return y;
                }
            }

            return -1;
        }

        function setMethods(n, methods) {
            n.methods = [];

            for (var i = 0; i < n.AllowedMethods.length; i++) {
                var j = findInArray(methods, n.AllowedMethods[i], 'Name');
                if (j != -1)
                    n.methods.push(methods[j]);
            }
        }

        function loadOptions(options) {
            var res = [];
            if (options == null || options.NotificationTypes == null || options.NotificationTypes.length == 0)
                return res;


            for (var i = 0; i < options.NotificationTypes.length; i++) {
                var z = options.NotificationTypes[i];

                if (!z.DisplayOnWeb)
                    continue;

                if (z.AllowedMethods.length == 0)
                    continue;

                if (z.Description == '') {
                    z.Description = z.Name;
                }

                var j = findInArray(res, z.ID, 'ID');
                if (j == -1) {
                    z.selectedMethod = [];
                    res.push(z);
                }

                setMethods(z, options.NotificationMethods);
            }

            // Sort
            res = $filter('orderBy')(res, ['Description', 'Name'], false);

            return res;
        }

        function loadDefaults(notifications, methods) {
            for (var i = 0; i < notifications.length; i++) {
                //load default here
                var z = notifications[i];
                for (var j = 0; j < z.DefaultMethods; j++) {
                    var k = findInArray(methods, z.DefaultMethods[j], 'Name');
                    if (k != -1)
                        z.selectedMethod.push(methods[k]);
                }
            }
        }

        function loadSelected(value, notifications, methods, outer) {

            if (!value || value.length == 0) {
                loadDefaults(notifications, methods);
                return;
            }

            for (var i = 0; i < value.length; i++) {
                var typeName = value[i].NotificationTypeName;
                var methodName = value[i].NotificationMethodName;

                var j = findInArray(notifications, typeName, 'Name');
                var k = findInArray(methods, methodName, 'Name');

                if (j != -1) {
                    var z = notifications[j];

                    if (k != -1)
                        z.selectedMethod.push(methods[k]);
                }
                else {
                    if (k != -1)
                        outer.push(value[i]);
                }
            }
        }

        function saveSelected(n, outer) {
            var res = angular.copy(outer);

            for (var i = 0; i < n.length; i++) {
                var z = n[i];

                var d = findInArray(z.selectedMethod, 'Disabled', 'Name');
                if (d != -1) {
                    res.push({
                        NotificationTypeDescription: z.Description,
                        NotificationTypeName: z.Name,
                        NotificationMethodDescription:  z.selectedMethod[d].Description,
                        NotificationMethodName: z.selectedMethod[d].Name,
                        
                        NotificationValue: true
                    });
                    continue;
                }

                for (var j = 0; j < z.selectedMethod.length; j++) {
                    res.push({
                        NotificationTypeDescription: z.Description,
                        NotificationTypeName: z.Name,
                        NotificationMethodDescription: z.selectedMethod[j].Description,
                        NotificationMethodName: z.selectedMethod[j].Name,

                        NotificationValue: true
                    });
                }
            }

            return res;
        }

        function controller($scope) {

            var options = null;
            if (configService.profile != null)
                options = configService.getProfile().NotificationsV2;

            $scope.notifications = loadOptions(options);

            $scope.notificationsOuter = []

            if (options != null) {
                var model = $scope.ngModel.Notifications;
                loadSelected(model, $scope.notifications, options.NotificationMethods, $scope.notificationsOuter);
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

                return name;
            }

            $scope.getSelectedText = function (item) {

                if (item !== undefined && item.length) {
                    var s = '';

                    for (var i = 0; i < item.length; i++) {
                        if (i > 0)
                            s += ', ';

                        var name = item[i].Name;

                        if (name == "Disabled")
                            return "Disabled";

                        var x = $scope.getNotificationValue(name);
                        if (x)
                            x = " - " + x;

                        s += name + " <span class='notificationValue'>" + x + "</span>";
                    }
                    return s;
                } else {
                    return "Please select notification method";
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


        function link(scope, iElement, iAttrs, ngModel) {

            if (!ngModel) {
                return;
            }

            scope.updateModel = function () {
                var nn = scope.notifications;
                ngModel.$viewValue.Notifications = saveSelected(nn, scope.notificationsOuter);
                ngModel.$setViewValue(ngModel.$viewValue);
            }
        }
    }
})();