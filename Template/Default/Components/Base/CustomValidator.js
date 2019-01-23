(function () {
    'use strict';

    angular.module('app').directive('customValidator', [function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: { validateFunction: '&' },
            link: function (scope, elm, attr, ngModelCtrl) {
                ngModelCtrl.$asyncValidators[attr.customValidator] = function (modelValue, viewValue) {
                    return new Promise(function (resolve, reject) {
                        var result = scope.validateFunction({ 'value': viewValue });
                        if (result || result === false) {
                            if (result.then) {
                                result.then(function (data) {           //For promise type result object
                                    if (data)
                                        resolve();
                                    else
                                        reject();
                                }, function (error) {
                                    reject();
                                });
                            }
                            else {
                                if (result)
                                    resolve();
                                else
                                    reject();
                                return;
                            }
                        }
                        reject();
                    });
                }

            }
        };
    }]);

})();