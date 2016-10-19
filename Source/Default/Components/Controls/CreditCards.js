(function () {
    'use strict';

    angular.module('app').component('creditCards', {
        restrict: 'E',
        bindings: {
            cards: '=',
            onUpdate: '&'
        },
        require: ['^form'],
        controller: function (configService) {
            var ctrl = this;
            ctrl.configService = configService;

            this.$onInit = function () {

            };

            this.$onChanges = function () {

            };

            ctrl.AddCreditCard = function () {
                if (ctrl.cards.length < 6) {
                    ctrl.cards.push({CardId: 'New_' + Math.random().toString(), CardDisabled: false, CardExpiration: '', FormattedCardExpiration: '', CardInfo: '', CardUsage: 'Automatic', SetPrimary: false, MarkDeleted: false});
                }

                ctrl.onUpdate();
            };

            this.RemoveCC = function (card) {
                ctrl.cards[ctrl.cards.indexOf(card)].MarkDeleted = true;
                ctrl.onUpdate();
            };
        },
        template: [
            '<div class="form-group" ng-repeat="card in $ctrl.cards track by card.CardId">',
                '<div ng-hide="card.MarkDeleted" layout="row">',
                    '<credit-card card-info="card"></credit-card>',
                    '<md-input-container>',
                        '<md-icon md-font-library="material-icons" ng-click="$ctrl.RemoveCC(card);">delete</md-icon>',
                    '</md-input-container>',
                '</div>',
            '</div>',
            '<div class="form-group">',
                '<div class="input-group btn btn-info" ng-if="$ctrl.cards.length < 6" ng-click="$ctrl.AddCreditCard();">',
                    '<label class="glyphicon glyphicon-plus"></label><label>&nbsp;&nbsp;Add Credit Card</label>',
                '</div>',
            '</div>',
        ].join('')
    });
})();