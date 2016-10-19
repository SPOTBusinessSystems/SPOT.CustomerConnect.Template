(function () {
    'use strict';

    angular.module('app').component('siteHeader', {
        bindings: {
        },
        controller: function (dataService, userService, configService, $state, localStorageService, dialogs, settingsService, $interval) {
            var ctrl = this;

            this.$onInit = function () {
                // Watch services
                ctrl.settings = configService;
                ctrl.tokens = {};

                console.log(ctrl.settings);

                if (ctrl.settings.getProfile()) {
                    if (ctrl.settings.getProfile().General['Show Header'] == "1") {
                        dataService.util.getFileResource("header.htm").then(function (template) {
                            if (template != "File does not exist.") {
                                ctrl.header = { template: template, tokens: ctrl.tokens };
                            }
                        });
                    }
                }
            };
        },
        template: [
            '<dynamiccontent content="$ctrl.header" ng-if="$ctrl.header"></dynamiccontent>'
        ].join('')
    });
})();