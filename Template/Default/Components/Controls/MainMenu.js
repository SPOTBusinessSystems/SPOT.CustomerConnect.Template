(function () {
    'use strict';

    angular.module('app').component('mainMenu', {
        bindings: {
        },
        controller: function (dataService, userService, configService, $state, localStorageService, dialogs, settingsService, $interval, $ocLazyLoad, googleAnalyticsService, $http) {
            var ctrl = this;

            this.$onInit = function () {
                // Watch services
                ctrl.user = userService;
                ctrl.settings = configService;
                ctrl.isCollapsed = true;
                ctrl.unreadMessages = userService.unreadMessageCount();

                var ss = ctrl.settings.getProfile();
                if (!ss.Locker) ss.Locker = {};
                if (!ss.Locker['Menu Synonym'])
                    ss.Locker['Menu Synonym'] = 'Locker';


                ctrl.LogOut = function () {
                    dataService.user.logout().then(function (data) {
                        localStorageService.remove(CustomerConnect.Config.Tenant + '_token');
                        window.location.reload(); // Reacquire new session.
                    });
                };

                // HELP Modal Functionality

                ctrl.HelpCache = {};

                ctrl.Help = function () {
                    var p = $ocLazyLoad.load(settingsService.path + 'Components/Dialogs/DialogController.js');
                    var hashPage = location.hash.replace('#', '');
                    if (hashPage == null) { hashPage = '/blank' };
                    googleAnalyticsService.pageview('/help');

                    p.then(function () {
                        var dlg = dialogs.create(settingsService.path + 'Components/Dialogs/Help' + hashPage + '.html', 'DialogController', {}, { size: 'md', windowClass: 'modal fade' });
                    });
                };


                ctrl.hashPageExists = function () {

                    var hashPage = location.hash.replace('#', '');
                    hashPage = hashPage.split("?")[0];

                    if (ctrl.HelpCache[hashPage] != undefined)
                        return ctrl.HelpCache[hashPage];

                    var req = $http({
                        method: 'get',
                        url: settingsService.path + 'Components/Dialogs/Help' + hashPage + '.html',
                        async: true
                    });

                    req.then(
                        function (response) {

                            if (response && ((response.data && response.data == 'The given header was not found.') || !response.data)) {
                                var res = false;
                                ctrl.HelpCache[hashPage] = res;
                                return;
                            }

                            var res = true;
                            ctrl.HelpCache[hashPage] = res;
                        }
                        ).catch(
                        function () {
                            var res = false;
                            ctrl.HelpCache[hashPage] = res;
                        }
                        );


                    var res = false;
                    ctrl.HelpCache[hashPage] = res;
                    return res;
                };

                //NAVBAR Code to test for file '<li role="presentation" ui-sref-active="active" ng-show="$ctrl.hashPageExists()"><a href="" ng-click="$ctrl.Help(); $ctrl.isCollapsed = true"><span class="glyphicon glyphicon-info-sign"></span>  Help</a></li>',

                //END HELP Modal Functionality

                ctrl.openMessages = function () {
                    var p = $ocLazyLoad.load(settingsService.path + 'Components/Dialogs/Messages/MessagesController.js');

                    p.then(function () {
                        googleAnalyticsService.pageview('/messages');
                        var dlg = dialogs.create(settingsService.path + 'Components/Dialogs/Messages/Messages.html', 'MessagesController', ctrl.data);
                        dlg.result.then(function (data) {
                            ctrl.unreadMessages = userService.unreadMessageCount();
                        });
                    });
                };

                ctrl.isPickupCalendar = function () {
                    //CustomerConnect Settings > Request Visits > Use Legacy Calendar-based View

                    var s = ctrl.settings.getProfile();
                    if (s && s["Request Visits"] && s["Request Visits"]["Use Legacy Calendar-based View"] && s["Request Visits"]["Use Legacy Calendar-based View"] == '1') {
                        return true;
                    }

                    return false;
                }

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

                ctrl.isPayment = function () {

                    if (!ctrl.user.getCustomer().IsAR)
                        return false;
                    if (ctrl.settings.getProfile()["AR Payment"]["Hide AR Payment Option"] == 1)
                        return false;

                    return true;
                }

                ctrl.isLocker = function () {

                    var s = ctrl.settings.getProfile();

                    if (s.General['Locker Dropoff Enabled']!=1)
                        return false;

                    if (!ss.Locker)
                        return false;

                    if (!s.Locker['Menu Synonym'])
                        return false;

                    return true;
                }
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
                        '<li role="presentation" ng-click="$ctrl.isCollapsed = true"><a href="" ng-show="$ctrl.settings.getProfile().General[\'Enable Contact\'] != 0" ng-controller="SendMessageController" ng-click="open();">Contact</a></li>',
                    '</ul>',
                    '<ul class="nav navbar-nav navbar-right">',
                        '<li role="presentation" ui-sref-active="active" ng-show="$ctrl.hashPageExists()"><a href="" ng-click="$ctrl.Help(); $ctrl.isCollapsed = true"><span class="glyphicon glyphicon-info-sign"></span>  Help</a></li>',
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
                        '<li role="presentation" ui-sref-active="active" ng-show="($ctrl.user.getCustomer().RouteName || $ctrl.settings.getProfile().Pickup[\'Allow Non-Route Pickup\'] == 1) && $ctrl.settings.getProfile().General[\'Route Scheduling\'] == 1 && $ctrl.settings.getProfile().Pickup[\'Menu Synonym\']" ng-if="!$ctrl.isPickupCalendar()"><a href="" ui-sref="pickup" ng-click="$ctrl.isCollapsed = true">{{$ctrl.settings.getProfile().Pickup[\'Menu Synonym\']}}</a></li>',
                        '<li role="presentation" ui-sref-active="active" ng-show="($ctrl.user.getCustomer().RouteName || $ctrl.settings.getProfile().Pickup[\'Allow Non-Route Pickup\'] == 1) && $ctrl.settings.getProfile().General[\'Route Scheduling\'] == 1 && $ctrl.settings.getProfile().Pickup[\'Menu Synonym\']" ng-if="$ctrl.isPickupCalendar()"><a href="" ui-sref="pickupcalendar" ng-click="$ctrl.isCollapsed = true">{{$ctrl.settings.getProfile().Pickup[\'Menu Synonym\']}}</a></li>',
                        '<li role="presentation" ui-sref-active="active" ng-show="$ctrl.isLocker()"><a href="" ui-sref="locker" ng-click="$ctrl.isCollapsed = true">{{$ctrl.settings.getProfile().Locker[\'Menu Synonym\']}}</a></li>',
                        '<li role="presentation" ui-sref-active="active" ng-show="$ctrl.user.getCustomer().RouteName && $ctrl.settings.getProfile().General[\'Route Scheduling\'] == 1 && $ctrl.settings.getProfile().Cancellation[\'Menu Synonym\']"><a href="" ui-sref="suspend" ng-click="$ctrl.isCollapsed = true">{{$ctrl.settings.getProfile().Cancellation[\'Menu Synonym\']}}</a></li>',
                        '<li role="presentation" ui-sref-active="active" ng-show="$ctrl.user.getCustomer().IsAR == true"><a href="" ui-sref="statements" ng-click="$ctrl.isCollapsed = true">Statements</a></li>',
                        '<li role="presentation" ui-sref-active="active" ng-show="$ctrl.isPayment()"><a href="" ui-sref="payment" ng-click="$ctrl.isCollapsed = true">Make Payment</a></li>',
                        '<li role="presentation" ui-sref-active="active"><a href="" ng-show="$ctrl.settings.getProfile().General[\'Enable Messages\'] != 0" ng-click="$ctrl.isCollapsed = true; $ctrl.openMessages();"><span class="glyphicon glyphicon-envelope"></span>  Messages  <span class="badge" ng-show="unreadMessages > 0">{{$ctrl.unreadMessages}}</span></a></li>',
                        '<li role="presentation" ng-show="$ctrl.settings.getProfile().General[\'Enable Two-Way Messaging\'] == 1"><a href="" ng-controller="SendMessageController" ng-click="$ctrl.isCollapsed = true; open();"><span class="glyphicon glyphicon-question-sign"></span>  Have a question?</a></li>',
                        '<li role="presentation" ng-click="$ctrl.isCollapsed = true"><a href="" ng-click="$ctrl.LogOut(); $ctrl.isCollapsed = true">Logout</a></li>',
                    '</ul>',
                    '<ul class="nav navbar-nav navbar-right">',
                        '<li role="presentation" ui-sref-active="active" ng-show="$ctrl.hashPageExists()"><a href="" ng-click="$ctrl.Help(); $ctrl.isCollapsed = true"><span class="glyphicon glyphicon-info-sign"></span>  Help</a></li>',
                    '</ul>',
                '</div>',
            '</div>',
        '</nav>'
        ].join('')
    });
})();