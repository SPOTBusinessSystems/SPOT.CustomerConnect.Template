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
        };

        function Settings() {
            return { path: path };
        }

        this.$get = [function settingsServiceFactory() {
            return new Settings();
        }];
    });

    ccApp.config(function ($stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider,
        $httpProvider, dialogsProvider, localStorageServiceProvider, tmhDynamicLocaleProvider,
        settingsServiceProvider) {

        $urlMatcherFactoryProvider.caseInsensitive(true); // Allow any case.
        $urlMatcherFactoryProvider.strictMode(false); // Allows trailing slash.
        
        if (CustomerConnect.Config.Layout === null)
        {
            CustomerConnect.Config.Layout === 'Default';
        }

        if (CustomerConnect.Config.Tenant === null) {
            settingsServiceProvider.setPath('/Template/' + CustomerConnect.Config.Layout + '/');
        } else {
            settingsServiceProvider.setPath('/' + CustomerConnect.Config.Tenant + '/Template/' + CustomerConnect.Config.Layout + '/');
        }
        
        // Views
        $stateProvider.state('login', {
            url: '/login',
            parent: 'globaldependencies',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Login/LoginView.html'
        })
        .state('signup', {
            url: '/signup?refid&refkey',
            parent: 'globaldependencies',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Signup/SignupView.html',
            params: {
                key: {
                    value: null,
                    squash: true
                }
            }
        })
        .state('payment', {
            url: '/payment',
            parent: 'globaldependencies',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Payments/PaymentsView.html'
        })
        .state('account', {
            url: '/account',
            parent: 'globaldependencies',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Account/AccountView.html'
        })
        .state('giftcards', {
            url: '/giftcards',
            parent: 'globaldependencies',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/GiftCards/GiftCardsView.html'
        })
        .state('orders', {
            url: '/orders',
            parent: 'globaldependencies',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Orders/OrdersView.html'
        })
        .state('pickup', {
            url: '/pickup',
            parent: 'globaldependencies',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Pickup/PickupView.html'
        })
        .state('suspend', {
            url: '/suspend',
            parent: 'globaldependencies',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Suspend/Suspend.html'
        })
        .state('kiosk', {
            url: '/kiosk',
            parent: 'globaldependencies',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Kiosk/KioskView.html'
        })
        .state('statements', {
            url: '/statements',
            parent: 'globaldependencies',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Statements/StatementsView.html'
        })
        .state('reminder', {
            url: '/reminder/:key',
            parent: 'globaldependencies',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Reminder/ReminderView.html',
            params: {
                key: {
                    value: null,
                    squash: true
                }
            }
        })
        .state('confirmation', {
            url: '/confirmation?Status&Type&PickupDate&TransactionID&Comment',
            parent: 'globaldependencies',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Confirmation/ConfirmationView.html'
        })
        .state('notifications', {
            url: '/notifications?Id',
            parent: 'globaldependencies',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Notifications/NotificationsView.html'
        })
        .state('globaldependencies', {
            abstract: true,
            url: '?theme&themeurl&cssurl', // for previewing themes.
            template: [
                '<site-header></site-header>',
                '<main-menu></main-menu>',
                '<div class="container">',
                '<ui-view></ui-view>',
                '</div>',
                '<site-footer></site-footer>'
            ].join(''),
            resolve: {
                loadSettings: function ($q, apiConfig, configService, dataService, localStorageService, tmhDynamicLocale, settingsService, $stateParams) {
                    console.log('load set');
                    var deferred = $q.defer();

                    if (!configService.isInitialized()) {
                        console.log('loading settings');

                        apiConfig.setURL(CustomerConnect.Config.URL);
                        apiConfig.setAccountKey(CustomerConnect.Config.AccountKey);
                        apiConfig.setSessionId(CustomerConnect.Config.SessionId);
                        apiConfig.setPublishableId(CustomerConnect.Config.PublishableId);

                        if (localStorageService.get(CustomerConnect.Config.Tenant + '_ccCache') !== null) {
                            configService.setProfile(JSON.parse(CustomerConnect.Util.base64._decode(localStorageService.get(CustomerConnect.Config.Tenant + '_ccCache'))));
                            configService.authProviders.setup();

                            //Temp for testing
                            //localStorageService.remove("ccCache");
                        } else {
                            dataService.settings.getSettings().then(function (data) {
                                var Settings = null;

                                if (!data.Failed) {
                                    Settings = data.ReturnObject.CustomerConnectSettings;
                                } else {
                                    Settings = { Notifications: null, Preferences: null, Stores: null, States: null };
                                }

                                var loadNotifications = dataService.settings.getNotifications().then(function (data) {
                                    Settings.Notifications = data.ReturnObject;
                                });

                                loadNotifications.then(function () {
                                    var loadPreferences = dataService.settings.getPreferences().then(function (data) {
                                        Settings.Preferences = data.ReturnObject;
                                    });

                                    loadPreferences.then(function () {
                                        var loadStores = dataService.store.getStoreList().then(function (data) {
                                            Settings.Stores = data.ReturnObject;
                                        });

                                        loadStores.then(function () {
                                            var loadStates = dataService.settings.getStates().then(function (data) {
                                                console.log(data);
                                                Settings.States = data.ReturnObject;
                                            });

                                            loadStates.then(function () {
                                                configService.setProfile(Settings);

                                                console.log('auth setup');
                                                configService.authProviders.setup().then(function () {
                                                    console.log(Settings);

                                                    var Themes = [
                                                        { Name: 'Default', File: 'bootstrap.min.css' },
                                                        { Name: 'Cerulean', File: 'bootstrap-cerulean.min.css' },
                                                        { Name: 'Cosmo', File: 'bootstrap-cosmo.min.css' },
                                                        { Name: 'Cyborg', File: 'bootstrap-cyborg.min.css' },
                                                        { Name: 'Darkly', File: 'bootstrap-darkly.min.css' },
                                                        { Name: 'Flatly', File: 'bootstrap-flatly.min.css' },
                                                        { Name: 'Journal', File: 'bootstrap-journal.min.css' },
                                                        { Name: 'Lumen', File: 'bootstrap-lumen.min.css' },
                                                        { Name: 'Paper', File: 'bootstrap-paper.min.css' },
                                                        { Name: 'Readable', File: 'bootstrap-readable.min.css' },
                                                        { Name: 'Sandstone', File: 'bootstrap-sandstone.min.css' },
                                                        { Name: 'Simplex', File: 'bootstrap-simplex.min.css' },
                                                        { Name: 'Slate', File: 'bootstrap-slate.min.css' },
                                                        { Name: 'Spacelab', File: 'bootstrap-spacelab.min.css' },
                                                        { Name: 'Superhero', File: 'bootstrap-superhero.min.css' },
                                                        { Name: 'United', File: 'bootstrap-united.min.css' },
                                                        { Name: 'Yeti', File: 'bootstrap-yeti.min.css' }
                                                    ];

                                                    if (Settings) {
                                                        if (Settings.General !== null) {
                                                            // Put into setting dynamic language
                                                            tmhDynamicLocale.set(Settings.General['Data Formats']['Language Tag']);
                                                            moment.locale(Settings.General['Data Formats']['Language Tag']);

                                                            if (Settings.General.Theme !== 'Custom') {
                                                                for (var x = 0; x < Themes.length; x++) {
                                                                    if (Themes[x].Name === Settings.General.Theme) {
                                                                        configService.setCSSPath(settingsService.path + 'Content/bootstrap/' + Themes[x].File);
                                                                        $("#themeCss").attr("href", configService.getCSSPath());
                                                                    }
                                                                }
                                                            } else {
                                                                $("#themeCss").attr("href", Settings.General['Theme Custom URL']);
                                                            }

                                                            if (Settings.General['Additional CSS URL']) {
                                                                $("#additionalCss").attr("href", Settings.General['Additional CSS URL']);
                                                            }
                                                        }
                                                    }

                                                    // Preview themes using &theme= or &themeurl=
                                                    if ($stateParams.theme) {
                                                        for (var y = 0; y < Themes.length; y++) {
                                                            if (Themes[y].Name.toLowerCase() === $stateParams.theme.toLowerCase()) {
                                                                configService.setCSSPath(settingsService.path + 'Content/bootstrap/' + Themes[y].File);
                                                                $("#themeCss").attr("href", configService.getCSSPath());
                                                            }
                                                        }
                                                    }

                                                    if ($stateParams.themeurl) {
                                                        $("#themeCss").attr("href", $stateParams.themeurl);
                                                    }

                                                    if ($stateParams.cssurl) {
                                                        $("#additionalCss").attr("href", $stateParams.cssurl);
                                                    }

                                                    // Config is initialized.
                                                    configService.init(true);

                                                    deferred.resolve();
                                                });
                                            });
                                        });
                                    });
                                });

                            });
                        }

                        return deferred.promise;
                    }
                }
            }
        });

        $urlRouterProvider.otherwise('/login');

        //Local storage
        localStorageServiceProvider
            .setPrefix('app').setStorageType('localStorage');

        tmhDynamicLocaleProvider.localeLocationPattern(settingsServiceProvider.getPath() + 'Scripts/angular/i18n/angular-locale_{{locale}}.js');
    });

    // Restriction
    ccApp.run(function ($rootScope, userService, $state) {
        // enumerate routes that don't need authentication
        var routesThatDontRequireAuth = ['/login', '/signup?refid&refkey', '/reminder/:key', '/confirmation?Status&Type&PickupDate&TransactionID&Comment', '/notifications?Id'];

        // check if current location matches route
        var routeClean = function (route) {
            return $.inArray(route, routesThatDontRequireAuth);
        };

        $rootScope.$on('$stateChangeStart', function (ev, to, toParams, from, fromParams) {
                console.log('route');
                console.log(ev);
                console.log(to);

            // if route requires auth and user is not logged in
            if (routeClean(to.url) === -1 && !userService.getCustomer()) {
                // redirect back to login
                ev.preventDefault();
                $state.go('login');
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
                    var decimalValue = plainNumber.substring(length - precision, length);

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