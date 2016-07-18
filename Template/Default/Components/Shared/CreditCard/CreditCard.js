(function () {
    'use strict';

    angular.module('app').component('creditCard', {
        restrict: 'E',
        bindings: {
            cardInfo: '='
        },
        controller: function (configService) {
            var ctrl = this;
            ctrl.configService = configService;

            this.$onInit = function () {
                console.log('init');
                console.log(ctrl);
            };
        },
        template: [
            '<div class="form-group">',
                '<div class="input-group">',
                    '<span class="input-group-addon"><i class="glyphicon glyphicon-credit-card"></i></span>',
                    '<input id="creditcardnumber" ng-model="$ctrl.cardInfo.CardInfo" class="form-control" placeholder="Card Number" />',
                '</div>',
                '<ccexp ng-model="$ctrl.cardInfo.CardExpiration" />',
            '</div>'
        ].join('')
    });
})();