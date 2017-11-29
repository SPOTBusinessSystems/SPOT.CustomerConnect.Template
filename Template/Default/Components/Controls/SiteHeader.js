(function () {
    'use strict';

    angular.module('app').component('siteHeader', {
        bindings: {
        },
        controller: function (dataService, userService, configService, $state, dialogs, settingsService, $interval, blindService) {
            var ctrl = this;

            this.$onInit = function () {
                // Watch services
                ctrl.settings = configService;
                ctrl.tokens = {};

                setTimeout(function () {
                    var p = ctrl.settings.getProfile();
                    if (p) {
                        if (p.General['Show Header'] == "1") {
                            dataService.util.getFileResource("header.htm").then(function (template) {
                                if (template != "File does not exist.") {
                                    ctrl.header = { template: template, tokens: ctrl.tokens };
                                }
                                blindService.show();
                            });
                            return;
                        }
                    }
                    blindService.show();
                }, 0);
            };
        },
        template: [
            '<dynamiccontent content="$ctrl.header" ng-if="$ctrl.header"></dynamiccontent>'
        ].join('')
    });
})();