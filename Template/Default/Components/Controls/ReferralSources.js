(function () {
    'use strict';

    angular.module('app').component('referralSources', {
        restrict: 'E',
        bindings: {
            referralSource: '=',
            referralDetail: '='
        },
        require: ['^form','ngModel'],
        controller: function (configService) {
            var ctrl = this;
            ctrl.configService = configService;
            ctrl.settings = configService.getProfile();

            // Add other option.
            ctrl.settings.ReferralSources.push({ Name: 'Other', Value: 'Other' });

            this.$onInit = function () {

            };

            this.$onChanges = function () {

            };
        },
        template: [
            '<select ng-options="referral.Value as referral.Name for referral in $ctrl.settings.ReferralSources track by referral.Value" ng-model="$ctrl.referralSource" class="form-control">',
                '<option value=""></option>',
            '</select>',
            '<input ng-model="$ctrl.referralDetail" class="form-control" placeholder="Please specify (Up to 50 characters)" ng-show="$ctrl.referralSource == \'Other\'" maxlength="50" />'
        ].join('')
    });
})();