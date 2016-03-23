(function () {
    'use strict';
    var ccApp = angular.module('app', [
                'ui.router',
                'ngTouch',
                'ngAnimate',
                'ui.bootstrap',
                'dialogs.main',
                'mgo-angular-wizard',
                'blockUI',
                'LocalStorageModule',
                'tmh.dynamicLocale',
                'ui.mask',
                'vcRecaptcha'
    ]);

    ccApp.provider('settingsService', function settingsServiceProvider() {
        var path = '';

        this.setPath = function (value) {
            path = value;
        };

        this.getPath = function () {
            return path;
        }

        function Settings() {
            return { path: path };
        }

        this.$get = [function settingsServiceFactory() {
            return new Settings();
        }]
    });

    ccApp.config(function ($stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider,
        $httpProvider, dialogsProvider, localStorageServiceProvider, tmhDynamicLocaleProvider,
        settingsServiceProvider) {

        $urlMatcherFactoryProvider.caseInsensitive(true); // Allow any case.
        $urlMatcherFactoryProvider.strictMode(false); // Allows trailing slash.
        
        if (CustomerConnect.Config.Layout == null)
        {
            CustomerConnect.Config.Layout == 'Default';
        }

        if (CustomerConnect.Config.Tenant == null) {
            settingsServiceProvider.setPath('Template/' + CustomerConnect.Config.Layout + '/');
        } else {
            settingsServiceProvider.setPath(CustomerConnect.Config.Tenant + '/Template/' + CustomerConnect.Config.Layout + '/');
        }
        
        // Views
        $stateProvider.state('login', {
            url: '/login',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Login/LoginView.html'
        })
        .state('signup', {
            url: '/signup/{key}',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Signup/SignupView.html'
        })
        .state('payment', {
            url: '/payment',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Payments/PaymentsView.html'
        })
        .state('account', {
            url: '/account',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Account/AccountView.html'
        })
        .state('giftcards', {
            url: '/giftcards',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/GiftCards/GiftCardsView.html'
        })
        .state('orders', {
            url: '/orders',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Orders/OrdersView.html'
        })
        .state('pickup', {
            url: '/pickup',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Pickup/PickupView.html'
        })
        .state('suspend', {
            url: '/suspend',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Suspend/Suspend.html'
        })
        .state('kiosk', {
            url: '/kiosk',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Kiosk/KioskView.html'
        })
        .state('statements', {
            url: '/statements',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Statements/StatementsView.html'
        })
        .state('reminder', {
            url: '/reminder/{key}',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Reminder/ReminderView.html'
        })
        .state('pickupemail', {
            url: '/pickupemail?Status&PickupDate&TransactionID',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/PickupEmail/PickupEmail.html'
        });

        $urlRouterProvider.otherwise('/login');

        //Local storage
        localStorageServiceProvider
            .setPrefix('app').setStorageType('localStorage');

        tmhDynamicLocaleProvider.localeLocationPattern(settingsServiceProvider.getPath() + 'Scripts/angular/i18n/angular-locale_{{locale}}.js');
    });

    // Restriction
    ccApp.run(function ($rootScope, $location, configService, userService, apiConfig, dataService) {
        apiConfig.setURL(CustomerConnect.Config.URL);
        apiConfig.setAccountKey(CustomerConnect.Config.AccountKey);
        apiConfig.setSessionId(CustomerConnect.Config.SessionId);
        apiConfig.setPublishableId(CustomerConnect.Config.PublishableId);

        // enumerate routes that don't need authentication
        var routesThatDontRequireAuth = ['/login', '/signup/{key}', '/reminder/{key}', '/pickupemail?Status&PickupDate&TransactionID'];

        // check if current location matches route
        var routeClean = function (route) {
            return $.inArray(route, routesThatDontRequireAuth);
        };

        $rootScope.$on('$stateChangeStart', function (ev, to, toParams, from, fromParams) {
            // if route requires auth and user is not logged in
            if (routeClean(to.url) == -1 && userService.getCustomer() == null) {
                // redirect back to login
                $location.path('/login');
                ev.preventDefault();
                return null;
            }
        });

        $rootScope.$on('$routeChangeSuccess', function () {
            // fix recaptcha bug
            $('.pls-container').remove();
        });
    });

    ccApp.directive('currencyformatter', function ($filter) {
        var precision = 2;
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ctrl) {
                ctrl.$formatters.push(function (data) {
                    var formatted = $filter('currency')(data);
                    //convert data from model format to view format
                    return formatted; //converted
                });
                ctrl.$parsers.push(function (data) {
                    var plainNumber = data.replace(/[^\d|\-+|\+]/g, '');
                    var length = plainNumber.length;
                    var intValue = plainNumber.substring(0, length - precision);
                    var decimalValue = plainNumber.substring(length - precision, length)

                    if (decimalValue.length < 2) {
                        decimalValue = "0" + decimalValue;
                    }

                    var plainNumberWithDecimal = intValue + '.' + decimalValue;
                    //convert data from view format to model format
                    var formatted = $filter('currency')(plainNumberWithDecimal);
                    element.val(formatted);

                    return Number(plainNumberWithDecimal);
                });
            }
        };
    });

    ccApp.filter('capitalize', function () {
        return function (input) {
            if (input.indexOf(' ') !== -1) {
                var inputPieces,
                    i;

                input = input.toLowerCase();
                inputPieces = input.split(' ');

                for (i = 0; i < inputPieces.length; i++) {
                    inputPieces[i] = capitalizeString(inputPieces[i]);
                }

                return inputPieces.toString().replace(/,/g, ' ');
            }
            else {
                input = input.toLowerCase();
                return capitalizeString(input);
            }

            function capitalizeString(inputString) {
                return inputString.substring(0, 1).toUpperCase() + inputString.substring(1);
            }
        };
    });
})();