(function () {
    'use strict';

    angular.module('app').component('creditCard', {
        restrict: 'E',
        bindings: {
            cardInfo: '='
        },
        controller: function (configService, $scope) {
            var ctrl = this;
            ctrl.configService = configService;
            ctrl.years = [];
            ctrl.ccMonth = '';
            ctrl.ccYear = '';

            this.$onInit = function () {
                console.log('cc');
                console.log(ctrl.cardInfo);

                for (var x = 0; x < 8; x++) {
                    ctrl.years.push((new Date().getYear() + 1900 + x));
                }
                
                var d = moment(ctrl.cardInfo.CardExpiration, "MM/DD/YYYY hh:mm:ss a");
                ctrl.ccMonth = d.month() + 1;
                ctrl.ccYear = d.year();

                ctrl.cardInfo.CardExpiration = moment(ctrl.ccMonth + "/1/" + ctrl.ccYear, "MM/dd/YYYY").format("MM/YY");

                $scope.$watch('$ctrl.ccMonth', function () {
                    ctrl.UpdateExpiration();
                });

                $scope.$watch('$ctrl.ccYear', function () {
                    ctrl.UpdateExpiration();
                });
            };

            this.UpdateExpiration = function () {
                if (ctrl.ccMonth && ctrl.ccYear) {
                    ctrl.cardInfo.CardExpiration = moment(ctrl.ccMonth + "/1/" + ctrl.ccYear, "MM/dd/YYYY").format("MM/YY");
                }

                console.log('watch');
                console.log(ctrl);
            };

            this.$onChanges = function (x) {
                console.log('onchanges');
                console.log(ctrl);
            };
        },
        template: [
            '<div layout="row">',
                '<md-input-container class="md-icon-float md-block">',
                    '<label>Card Number</label>',
                    '<md-icon md-font-library="material-icons">credit_card</md-icon>',
                    '<input name="cardNumber" id="creditcardnumber" ng-model="$ctrl.cardInfo.CardInfo" placeholder="Card Number" />',
                '</md-input-container>',
                '<md-input-container>',
                    '<label>Month</label>',
                    '<md-select ng-model="$ctrl.ccMonth">',
                        '<md-option ng-value="n" ng-repeat="n in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]">{{n}}</md-option>',
                    '</md-select>',
                '</md-input-container>',
                '<md-input-container>',
                    '<label>Year</label>',
                    '<md-select ng-model="$ctrl.ccYear">',
                        '<md-option ng-value="y" ng-repeat="y in $ctrl.years">{{y}}</md-option>',
                    '</md-select>',
                '</md-input-container>',
            '</div>'
        ].join('')
    });
})();