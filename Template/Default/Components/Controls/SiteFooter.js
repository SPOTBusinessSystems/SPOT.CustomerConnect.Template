(function () {
    'use strict';

    angular.module('app').component('siteFooter', {
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
                        if (p.General['Show Footer'] == "1") {
                            dataService.util.getFileResource("footer.htm").then(function (template) {
                                if (template != "File does not exist.") {
                                    ctrl.footer = { template: template, tokens: ctrl.tokens };
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
            '<dynamiccontent content="$ctrl.footer" ng-if="$ctrl.footer"></dynamiccontent>'
        ].join('')
    });
})();