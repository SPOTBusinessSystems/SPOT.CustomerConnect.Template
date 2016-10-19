(function () {
    'use strict';

    angular.module('app').component('mainMenu', {
        bindings: {
        },
        controller: function (dataService, userService, configService, $state, localStorageService, dialogs, settingsService, $interval) {
            var ctrl = this;

            this.$onInit = function () {
                // Watch services
                ctrl.user = userService;
                ctrl.settings = configService;

                ctrl.isCollapsed = true;
                ctrl.unreadMessages = userService.unreadMessageCount();

                ctrl.LogOut = function () {
                    dataService.user.logout().then(function (data) {
                        localStorageService.remove(CustomerConnect.Config.Tenant + '_token');
                        window.location.reload(); // Reacquire new session.
                    });
                };

                ctrl.openMessages = function () {
                    var dlg = dialogs.create(settingsService.path + 'Components/Dialogs/Messages/Messages.html', 'MessagesController', ctrl.data);
                    dlg.result.then(function (data) {
                        ctrl.unreadMessages = userService.unreadMessageCount();
                    });
                };

                // Keep session alive. Periodically retrieve messages.
                $interval(function () {
                    if (userService.getCustomer() != null) {
                        dataService.user.getMessages().then(function (data) {
                            if (!data.Failed) {
                                var oldMessages = userService.getMessages();

                                if (oldMessages.length < data.ReturnObject.length) {
                                    // New message
                                    ctrl.alerts.push({ type: 'success', msg: 'You have received a new message' });
                                }

                                ctrl.Messages = data.ReturnObject.length;
                                userService.setMessages(data.ReturnObject);
                                ctrl.unreadMessages = userService.unreadMessageCount();
                            }
                        });
                    } else {
                        dataService.store.getStoreList().then(function (data) {

                        });
                    }
                }, 300 * 1000);

                ctrl.alerts = [];

                ctrl.closeAlert = function (index) {
                    ctrl.alerts.splice(index, 1);
                };
            };
        },
        template: [
        '<nav class="navbar navbar-default" ng-if="!$ctrl.user.getCustomer()">',
            '<div class=" container-fluid">',
                '<div class="navbar-header">',
                    '<button type="button" class="navbar-toggle collapsed" ng-click="$ctrl.isCollapsed = !$ctrl.isCollapsed">',
                        '<span class="sr-only">Toggle navigation</span>',
                        '<span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span>',
                    '</button>',
                    '<img class="navbar-brand brandImgIcon" ng-src="{{ $ctrl.settings.getProfile().General[\'Logo Icon\'] }}" />',
                    '<a class="navbar-brand brandText" href="" ui-sref="login">{{ $ctrl.settings.getProfile().General[\'Brand Name\'] }}</a>',
                '</div>',
                '<div class="collapse navbar-collapse" uib-collapse="$ctrl.isCollapsed">',
                    '<ul class="nav navbar-nav">',
                        '<li role="presentation" ui-sref-active="active"><a href="" ui-sref="login" ng-click="$ctrl.isCollapsed = true">Login</a></li>',
                        '<li role="presentation" ui-sref-active="active"><a href="" ui-sref="signup" ng-click="$ctrl.isCollapsed = true">{{ $ctrl.settings.getProfile().Signup[\'Menu Synonym\'] }}</a></li>',
                        '<li role="presentation" ng-click="$ctrl.isCollapsed = true"><a href="" ng-controller="SendMessageController" ng-click="open();">Contact</a></li>',
                    '</ul>',
                '</div>',
            '</div>',
        '</nav>',
        '<nav class="navbar navbar-default" ng-if="$ctrl.user.getCustomer()">',
            '<div class="container-fluid">',
                '<div class="navbar-header">',
                    '<button type="button" class="navbar-toggle collapsed" ng-click="$ctrl.isCollapsed = !$ctrl.isCollapsed">',
                        '<span class="sr-only">Toggle navigation</span>',
                        '<span class="icon-bar"></span>',
                        '<span class="icon-bar"></span>',
                        '<span class="icon-bar"></span>',
                    '</button>',
                    '<img class="navbar-brand brandImgIcon" ng-src="{{ $ctrl.settings.getProfile().General[\'Logo Icon\'] }}" />',
                    '<a class="navbar-brand brandText" href="" ui-sref="account">{{ $ctrl.settings.getProfile().General[\'Brand Name\']}}</a>',
                '</div>',
                '<div class="collapse navbar-collapse" uib-collapse="$ctrl.isCollapsed">',
                    '<ul class="nav navbar-nav">',
                        '<li role="presentation" ui-sref-active="active"><a href="" ui-sref="account" ng-click="$ctrl.isCollapsed = true">Account</a></li>',
                        '<li role="presentation" ui-sref-active="active" ng-show="$ctrl.settings.getProfile().General[\'Gift Cards Menu Enabled\'] == 1"><a href="" ui-sref="giftcards" ng-click="$ctrl.isCollapsed = true">Gift Cards</a></li>',
                        '<li role="presentation" ui-sref-active="active" ng-show="$ctrl.settings.getProfile().General[\'Kiosk Menu Enabled\'] == 1"><a href="" ui-sref="kiosk" ng-click="$ctrl.isCollapsed = true">Kiosk</a></li>',
                        '<li role="presentation" ui-sref-active="active" ng-show="$ctrl.settings.getProfile().General[\'Orders Menu Enabled\'] == 1"><a href="" ui-sref="orders" ng-click="$ctrl.isCollapsed = true">Orders</a></li>',
                        '<li role="presentation" ui-sref-active="active" ng-show="($ctrl.user.getCustomer().RouteName || $ctrl.settings.getProfile().Pickup[\'Allow Non-Route Pickup\'] == 1) && $ctrl.settings.getProfile().General[\'Route Scheduling\'] == 1 && $ctrl.settings.getProfile().Pickup[\'Menu Synonym\']"><a href="" ui-sref="pickup" ng-click="$ctrl.isCollapsed = true">{{$ctrl.settings.getProfile().Pickup[\'Menu Synonym\']}}</a></li>',
                        '<li role="presentation" ui-sref-active="active" ng-show="$ctrl.user.getCustomer().RouteName && $ctrl.settings.getProfile().General[\'Route Scheduling\'] == 1 && $ctrl.settings.getProfile().Cancellation[\'Menu Synonym\']"><a href="" ui-sref="suspend" ng-click="$ctrl.isCollapsed = true">{{$ctrl.settings.getProfile().Cancellation[\'Menu Synonym\']}}</a></li>',
                        '<li role="presentation" ui-sref-active="active" ng-show="$ctrl.user.getCustomer().IsAR == true"><a href="" ui-sref="statements" ng-click="$ctrl.isCollapsed = true">Statements</a></li>',
                        '<li role="presentation" ui-sref-active="active" ng-show="$ctrl.user.getCustomer().IsAR == true"><a href="" ui-sref="payment" ng-click="$ctrl.isCollapsed = true">Make Payment</a></li>',
                        '<li role="presentation" ui-sref-active="active"><a href="" ng-click="$ctrl.isCollapsed = true; $ctrl.openMessages();"><span class="glyphicon glyphicon-envelope"></span>  Messages  <span class="badge" ng-show="unreadMessages > 0">{{$ctrl.unreadMessages}}</span></a></li>',
                        '<li role="presentation" ng-show="$ctrl.settings.getProfile().General[\'Enable Two-Way Messaging\'] == 1"><a href="" ng-controller="SendMessageController" ng-click="$ctrl.isCollapsed = true; open();"><span class="glyphicon glyphicon-question-sign"></span>  Have a question?</a></li>',
                        '<li role="presentation" ng-click="$ctrl.isCollapsed = true"><a href="" ng-click="$ctrl.LogOut(); $ctrl.isCollapsed = true">Logout</a></li>',
                    '</ul>',
                '</div>',
            '</div>',
        '</nav>'
        ].join('')
    });
})();