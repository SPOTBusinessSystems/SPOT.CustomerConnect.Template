(function () {
    'use strict';

    angular.module('app').component('siteFooter', {
        bindings: {
        },
        controller: function (dataService, userService, configService, $state, dialogs, settingsService, $interval) {
            var ctrl = this;

            this.$onInit = function () {
                // Watch services
                ctrl.settings = configService;
                ctrl.tokens = {};

                //console.log(ctrl.settings.getProfile());


                setTimeout(function () {
                    if (ctrl.settings.getProfile()) {
                        if (ctrl.settings.getProfile().General['Show Footer'] == "1") {
                            dataService.util.getFileResource("footer.htm").then(function (template) {
                                if (template != "File does not exist.") {
                                    ctrl.footer = { template: template, tokens: ctrl.tokens };
                                }
                            });
                        }
                    }
                }, 0);
            };
        },
        template: [
            '<dynamiccontent content="$ctrl.footer" ng-if="$ctrl.footer"></dynamiccontent>'
        ].join('')
    });
})();