(function () {
    'use strict';

    angular.module('app').component('phoneNumber', {
        restrict: 'E',
        bindings: {
            value: '=',
            masks: '=',
            options: '='
        },
        controller: function (configService, $scope) {
            var ctrl = this;
            ctrl.configService = configService;

            ctrl.phoneTypes = [
                { "name": "Home", "value": "Home" },
                { "name": "Mobile", "value": "Cell/Mobile" },
                { "name": "Work", "value": "Work" },
                { "name": "Other", "value": "Other" },
                { "name": "Principal", "value": "Principal" }
            ];

            this.$onInit = function () {

                ctrl.phoneNumberTitle = "Phone Number";

                if (ctrl.options.phoneNumberTitle)
                    ctrl.phoneNumberTitle = ctrl.options.phoneNumberTitle;

                ctrl.maskLength = [];

                for (var i = 0; i < ctrl.masks.length; i++)
                    ctrl.maskLength[i] = getMaskLength(ctrl.masks[i]);

                ctrl.masksFilterted = filterMasks();

                if (!ctrl.value.PhoneMask && ctrl.masks && ctrl.masks.lenght > 0)
                    ctrl.value.PhoneMask = ctrl.masks[0];


                $scope.$watch('$ctrl.value.Number', function () {
                    ctrl.applyMask();
                });

                $scope.$watch('$ctrl.value.PhoneMask', function () {
                    ctrl.applyMask();
                });

            };

            function filterMasks() {
                var res = [];

                var len = getOnlyNumbers(ctrl.value.Number).length;

                for (var i = 0; i < ctrl.masks.length; i++)
                    if (ctrl.maskLength[i] == len)
                        res.push(ctrl.masks[i]);

                return res;
            }

            function getOnlyNumbers(str) {

                if (!str)
                    return '';

                return str.replace(/\D/g, "");
            };

            function getMaskLength(str) {

                if (!str)
                    return 0;

                var x = str.replace(/[^#]/g, "");

                return x.length;
            };

            function formatPhone(n) {

                var digits = getOnlyNumbers(n);

                if (!digits)
                    return n;

                var mask = ctrl.value.PhoneMask;

                if (getMaskLength(mask) == digits.length) {
                    var i = 0;

                    var f = function () {
                        var res = digits[i];
                        i++;
                        return res;
                    }

                    return mask.replace(/#/g, f);
                }

                //mask length mismatch. Try to find better mask.
                for (var i = 0; i < ctrl.masks.length; i++) {
                    var m = ctrl.masks[i];
                    if (m == mask)
                        continue;

                    if (getMaskLength(m) == digits.length) {
                        ctrl.value.PhoneMask = m;

                        var i = 0;

                        var f = function () {
                            var res = digits[i];
                            i++;
                            return res;
                        }

                        return m.replace(/#/g, f);
                    }
                }


                return n;
            }

            this.applyMask = function () {

                var n = ctrl.value.Number;

                var x = formatPhone(n);

                if (x != n) {
                    ctrl.value.Number = x;
                    ctrl.masksFilterted = filterMasks();
                }
            }



        },
        template: [
            '<div layout="row">',
                '<div style="display:inline-block">',
                '<md-input-container class="md-icon-float md-block">',
                    '<label>{{ $ctrl.phoneNumberTitle }}</label>',
                    '<md-icon md-font-library="material-icons" title="Phone number">phone</md-icon>',
                    '<input ng-model="$ctrl.value.Number" placeholder="{{ $ctrl.value.PhoneMask }}" tooltip="{{ $ctrl.value.PhoneMask }}" tooltip-trigger="focus" required type="tel" />',
                '</md-input-container>',
                '<br>',
                '<md-input-container style="margin-left:34px;margin-top:0;" ng-show="$ctrl.masksFilterted.length>1">',
                    '<label>Mask</label>',
                    '<md-select ng-model="$ctrl.value.PhoneMask">',
                        '<md-option ng-value="m" ng-repeat="m in $ctrl.masksFilterted">{{m}}</md-option>',
                    '</md-select>',
                '</md-input-container>',
                '</div>',
                '<md-input-container ng-if="$ctrl.options.hasPhoneType">',
                    '<label>Phone Type</label>',
                    '<md-select ng-model="$ctrl.value.PhoneType">',
                        '<md-option ng-value="opt.value" ng-repeat="opt in $ctrl.phoneTypes">{{ opt.name }}</md-option>',
                    '</md-select>',
                '</md-input-container>',

            '</div>'
        ].join('')
    });
})();