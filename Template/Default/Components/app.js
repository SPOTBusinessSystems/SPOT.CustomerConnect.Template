/// <reference path="./service.js" />
/// <reference path="service-intellisense.js" />

(function () {
    // Incase console is not valid. Stub in used console commands to avoid errors.
    if (typeof console === "undefined") {
        console = {
            assert: function () { },
            clear: function () { },
            count: function () { },
            dir: function () { },
            error: function () { },
            group: function () { },
            groupCollapsed: function () { },
            groupEnd: function () { },
            info: function () { },
            log: function () { },
            profile: function () { },
            profileEnd: function () { },
            time: function () { },
            timeEnd: function () { },
            timeStamp: function () { },
            trace: function () { },
            warn: function () { }
        };
    }

    'use strict';
    var ccApp = angular.module('app', [
                'ui.router',
                'ngAnimate',
                'ui.bootstrap',
                'dialogs.main',
                'mgo-angular-wizard',
                'blockUI',
                'LocalStorageModule',
                'tmh.dynamicLocale',
                'ui.mask',
                'vcRecaptcha',
                'ngMaterial',
                'ngMessages',
                'ngAria',
                'oc.lazyLoad'
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


    ccApp.factory('googleAnalyticsService', ['$window', '$ocLazyLoad', function ($window, $ocLazyLoad) {
        var isLoaded = false;
        return {
            load: function (Settings, onCompleted) {

                if (Settings && Settings.General && Settings.General["Google Analytics"]
                    && (Settings.General["Google Analytics"]["Google Analytics Enabled"] == 1)
                    && Settings.General["Google Analytics"]["Account Key"]) {

                    var key = Settings.General["Google Analytics"]["Account Key"];
                    var i = window;
                    var r = 'ga';

                    (function (i, s, o, g, r, a, m) {
                        i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
                            (i[r].q = i[r].q || []).push(arguments)
                        }, i[r].l = 1 * new Date();
                    })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

                    $ocLazyLoad.load('googleAnalytics').then(function () {

                        if (Settings.General["Google Analytics"]["Cross Domain Linker"] == '1') {
                            $window.ga('create', key, 'auto', { 'allowLinker': true });
                            ga('require', 'linker');
                            var domains = Settings.General["Google Analytics"]["Cross Link Domains"].split(";");
                            ga('linker:autoLink', domains);
                        }
                        else
                            $window.ga('create', key, 'auto');


                        console.log('Google Analytics loaded');
                        isLoaded = true;
                        if (onCompleted)
                            onCompleted();
                    });
                }
                else
                    if (onCompleted)
                        onCompleted();
            },

            pageview: function (url) {
                if (!isLoaded || !$window.ga)
                    return;

                var p = url.toLowerCase();
                $window.ga('send', 'pageview', p);

                console.log('Google Analytics pageview ' + p);
            }

        }
    }]);


    ccApp.config(function ($stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider,
        $httpProvider, dialogsProvider, localStorageServiceProvider, tmhDynamicLocaleProvider,
        settingsServiceProvider
        , $controllerProvider, $compileProvider, $filterProvider, $provide, $ocLazyLoadProvider
        ) {

        $urlMatcherFactoryProvider.caseInsensitive(true); // Allow any case.
        $urlMatcherFactoryProvider.strictMode(false); // Allows trailing slash.

        if (CustomerConnect.Config.Layout === null) {
            CustomerConnect.Config.Layout === 'Default';
        }

        if (CustomerConnect.Config.Tenant === null) {
            settingsServiceProvider.setPath('/Template/' + CustomerConnect.Config.Layout + '/');
        } else {
            settingsServiceProvider.setPath('/' + CustomerConnect.Config.Tenant + '/Template/' + CustomerConnect.Config.Layout + '/');
        }

        $urlRouterProvider.otherwise('/login');

        //Local storage
        localStorageServiceProvider.setPrefix('app').setStorageType('localStorage');

        tmhDynamicLocaleProvider.localeLocationPattern(settingsServiceProvider.getPath() + 'Scripts/angular/i18n/angular-locale_{{locale}}.js');


        function loadFiles(stateName) {
            return ['$ocLazyLoad', function ($ocLazyLoad) {
                return $ocLazyLoad.load(stateName);
            }];
        }

        function controllerPath(name) {
            return settingsServiceProvider.getPath() + 'Components/Views/' + name + '/' + name + 'Controller.js'
        }

        function viewPath(name) {
            return settingsServiceProvider.getPath() + 'Components/Views/' + name + '/' + name + 'View.html'
        }

        function componentPath(name) {
            return settingsServiceProvider.getPath() + 'Components/' + name;
        }

        function cssPath(name) {
            return settingsServiceProvider.getPath() + 'Content/css/' + name;
        }

        function scriptPath(name) {
            return settingsServiceProvider.getPath() + 'Scripts/' + name;
        }


        var loadRecaptcha = function ($ocLazyLoad, $window) {
            return new Promise(function (resolve, reject) {
                resolve();//don't block load process
                var f = function () {
                    if ($window.vcRecaptchaApiLoaded) { //is vcRecaptcha loaded?
                        $ocLazyLoad.load('recaptcha');
                    }
                    else {
                        setTimeout(f, 1000);
                    }
                }
                f();
            });
        };


        //Config For ocLazyLoading
        $ocLazyLoadProvider.config({
            //'debug': true, // For debugging 'true/false'
            'events': true, // For Event 'true/false'
            'modules': [
                {
                    name: 'authGoogle',
                    files: [
                            '//apis.google.com/js/client:platform.js?onload=appGoogleAuthLoaded',
                            componentPath('Base/AuthProviders/GoogleAuth.js')
                    ]
                },
                {
                    name: 'authFacebook',
                    files: [
                            '//connect.facebook.net/en_US/sdk.js',
                            componentPath('Base/AuthProviders/FacebookAuth.js')
                    ]
                },
                {
                    name: 'login',
                    files: [
                            controllerPath('Login'),
                            cssPath('styles-material-bundle.min.css'),
                            scriptPath('angular-material-bundle.min.js?v=1.0.0')
                    ]
                },
                {
                    name: 'account',
                    files: [cssPath('styles-material-bundle.min.css'),
                            scriptPath('angular-material-bundle.min.js?v=1.0.0'),

                            componentPath('Base/CreditCard.js'),
                            componentPath('Controls/CreditCards.js'),
                            componentPath('Controls/ChangePassword.js'),
                            componentPath('Shared/PasswordIndicator/PasswordIndicatorDirective.js'),
                            componentPath('Shared/Preferences/Preferences.js'),
                            componentPath('Shared/Notifications/Notifications.js'),
                            componentPath('Shared/States/States.js'),
                            componentPath('Shared/SpecialInstructions/SpecialInstructions.js'),

                            componentPath('Base/AuthProviders/GoogleAuth.js'),
                            componentPath('Base/AuthProviders/FacebookAuth.js'),
                            controllerPath('Account')
                    ]
                },
                {
                    name: 'signup',
                    files: [
                            scriptPath('angular-material-bundle.min.js?v=1.0.0'),
                            cssPath('styles-material-bundle.min.css'),

                            componentPath('Base/CreditCard.js'),
                            componentPath('Controls/ReferralSources.js'),
                            componentPath('Shared/PasswordIndicator/PasswordIndicatorDirective.js'),
                            componentPath('Shared/States/States.js'),
                            controllerPath('Signup')
                    ]
                },
                {
                    name: 'adwords',
                    files: ['//www.googleadservices.com/pagead/conversion_async.js'
                    ]
                },
                {
                    name: 'recaptcha',
                    files: ['//www.google.com/recaptcha/api.js?onload=vcRecaptchaApiLoaded&render=explicit'
                    ]
                },
                {
                    name: 'payment',
                    files: [componentPath('Shared/CCExp/CCExp.js'), controllerPath('Payments')
                    ]
                },
                {
                    name: 'giftcards',
                    files: [controllerPath('GiftCards')
                    ]
                },

                {
                    name: 'orders',
                    files: [controllerPath('Orders')
                    ]
                },
                 {
                     name: 'pickup',
                     files: [controllerPath('Pickup')
                     ]
                 },
                 {
                     name: 'suspend',
                     files: [controllerPath('Suspend')
                     ]
                 },
                 {
                     name: 'kiosk',
                     files: [controllerPath('Kiosk')
                     ]
                 },

                 {
                     name: 'statements',
                     files: [controllerPath('Statements')
                     ]
                 },
                 {
                     name: 'reminder',
                     files: [componentPath('Shared/PasswordIndicator/PasswordIndicatorDirective.js'), controllerPath('Reminder')
                     ]
                 },
                 {
                     name: 'confirmation',
                     files: [controllerPath('Confirmation')
                     ]
                 },
                 {
                     name: 'notifications',
                     files: [cssPath('styles-material-bundle.min.css'),
                            scriptPath('angular-material-bundle.min.js?v=1.0.0'),

                            componentPath('Shared/Notifications/Notifications.js'),
                            controllerPath('Notifications')
                     ]
                 },
                 {
                     name: 'googleAnalytics',
                     files: ['https://www.google-analytics.com/analytics.js'
                     ]
                 }
            ]
        });


        // Views
        $stateProvider.state('login', {
            url: '/login',
            parent: 'globaldependencies',
            templateUrl: viewPath('Login'),
            params: { forgotPasswordEmail: null, returnState: null },
            resolve: { load: loadFiles('login') }
        })
        // Views
        $stateProvider
        .state('signup', {
            url: '/signup?refid&refkey',
            parent: 'globaldependencies',
            templateUrl: viewPath('Signup'),
            params: {
                key: {
                    value: null,
                    squash: true
                }
            },
            resolve: {
                load: loadFiles('signup'),
                adwords: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return new Promise(function (resolve, reject) {

                        $ocLazyLoad.load('adwords').then(function () { resolve(); })
                            .catch(function () {
                                resolve(); //adwords load failed. Private mode? Just skip it.
                            });
                    });
                }],

                recaptcha: ['$ocLazyLoad', '$window', loadRecaptcha]
            }
        })
        .state('payment', {
            url: '/payment',
            parent: 'globaldependencies',
            templateUrl: viewPath('Payments'),
            resolve: { load: loadFiles('payment') }
        })
        .state('account', {
            url: '/account',
            parent: 'globaldependencies',
            templateUrl: viewPath('Account'),
            params: { requirePasswordChange: null },
            resolve: { load: loadFiles('account') }
        })
        .state('giftcards', {
            url: '/giftcards',
            parent: 'globaldependencies',
            templateUrl: viewPath('GiftCards'),
            resolve: { load: loadFiles('giftcards') }
        })

        .state('orders', {
            url: '/orders',
            parent: 'globaldependencies',
            templateUrl: viewPath('Orders'),
            resolve: { load: loadFiles('orders') }
        })
        .state('pickup', {
            url: '/pickup',
            parent: 'globaldependencies',
            templateUrl: viewPath('Pickup'),
            resolve: { load: loadFiles('pickup') }
        })
        .state('suspend', {
            url: '/suspend',
            parent: 'globaldependencies',
            templateUrl: settingsServiceProvider.getPath() + 'Components/Views/Suspend/Suspend.html',
            resolve: { load: loadFiles('suspend') }
        })
        .state('kiosk', {
            url: '/kiosk',
            parent: 'globaldependencies',
            templateUrl: viewPath('Kiosk'),
            resolve: { load: loadFiles('kiosk') }
        })
        .state('statements', {
            url: '/statements',
            parent: 'globaldependencies',
            templateUrl: viewPath('Statements'),
            resolve: { load: loadFiles('statements') }
        })
        .state('reminder', {
            url: '/reminder/:key',
            parent: 'globaldependencies',
            templateUrl: viewPath('Reminder'),
            params: {
                key: {
                    value: null,
                    squash: true
                }
            },
            resolve: { load: loadFiles('reminder') }
        })
        .state('confirmation', {
            url: '/confirmation?Status&Type&PickupDate&TransactionID&Comment',
            parent: 'globaldependencies',
            templateUrl: viewPath('Confirmation'),
            resolve: { load: loadFiles('confirmation') }
        })
        .state('notifications', {
            url: '/notifications?Id',
            parent: 'globaldependencies',
            templateUrl: viewPath('Notifications'),
            resolve: { load: loadFiles('notifications') }
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
                loadSettings: function (apiConfig, configService, dataService, localStorageService, tmhDynamicLocale, settingsService, $stateParams, googleAnalyticsService, $ocLazyLoad) {

                    var loadTheme = function (configService, $stateParams, tmhDynamicLocale, settingsService) {
                        var Themes = [
                            { Name: 'Default', File: 'bootstrap-default.min.css' },
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

                        SetCssUrl = function (cssId, url) {
                            if (!document.getElementById(cssId)) {
                                var head = document.getElementsByTagName('head')[0];
                                var link = document.createElement('link');
                                link.id = cssId;
                                link.rel = 'stylesheet';
                                link.type = 'text/css';
                                link.href = url;
                                link.media = 'all';
                                head.appendChild(link);
                            }
                            else
                                $("#" + cssId).attr("href", url);
                        };

                        SetThemeCss = function (url) {
                            SetCssUrl('themeCss', url);
                        };

                        SetAdditionalCss = function (url) {
                            SetCssUrl('additionalCss', url);
                        };

                        var Settings = configService.getProfile();

                        if (Settings) {
                            if (Settings.General !== null) {
                                // Put into setting dynamic language
                                tmhDynamicLocale.set(Settings.General['Data Formats']['Language Tag']);
                                moment.locale(Settings.General['Data Formats']['Language Tag']);

                                if (Settings.General.Theme !== 'Custom') {
                                    for (var x = 0; x < Themes.length; x++) {
                                        if (Themes[x].Name === Settings.General.Theme) {
                                            configService.setCSSPath(settingsService.path + 'Content/bootstrap/' + Themes[x].File);
                                            SetThemeCss(configService.getCSSPath());
                                        }
                                    }
                                } else {
                                    SetThemeCss(Settings.General['Theme Custom URL']);
                                }

                                if (Settings.General['Additional CSS URL']) {
                                    SetAdditionalCss(Settings.General['Additional CSS URL']);
                                }
                            }
                        }

                        
                        // Preview themes using &theme= or &themeurl=
                        if ($stateParams.theme) {
                            for (var y = 0; y < Themes.length; y++) {
                                if (Themes[y].Name.toLowerCase() === $stateParams.theme.toLowerCase()) {
                                    configService.setCSSPath(settingsService.path + 'Content/bootstrap/' + Themes[y].File);
                                    SetThemeCss(configService.getCSSPath());
                                }
                            }
                        }

                        if ($stateParams.themeurl) {
                            SetThemeCss($stateParams.themeurl);
                        }

                        if ($stateParams.cssurl) {
                            SetAdditionalCss($stateParams.cssurl);
                        }
                    };

                    return new Promise(function (resolve, reject) {
                        loadTheme(configService, $stateParams, tmhDynamicLocale, settingsService);
                        resolve();
                    });
                    
                }
            }
        });

    });//ccApp.config

    // Restriction
    ccApp.run(function ($rootScope, userService, $state, googleAnalyticsService, apiConfig, configService, dataService, localStorageService, tmhDynamicLocale, settingsService, $stateParams, $ocLazyLoad) {

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

            var initConfigService = function (apiConfig, CustomerConnect, localStorageService, configService, onResolve, dataService, tmhDynamicLocale, moment, $stateParams, configService, googleAnalyticsService, settingsService, $ocLazyLoad) {
                apiConfig.ApplyConfig(CustomerConnect.Config);

                dataService.settings.getSpecificSettings(true, true, true, true, true, true, true, true).then(function (data) {

                    var Settings = null;
                    if (!data.Failed)
                        Settings = data.ReturnObject.CustomerConnectSettings;
                    else
                        Settings = { Notifications: null, Preferences: null, Stores: null, States: null, General: null };

                    configService.setProfile(Settings);


                    var a = [];
                    var ap = Settings.General['Authentication Providers'];

                    if (ap != null) {
                        var g = ap.Google;
                        if (g != null && g.Enabled === "1")
                            a.push(
                                new Promise(function (resolve, reject) { $ocLazyLoad.load('authGoogle').then(resolve, resolve); })
                                );

                        var g = ap.Facebook;
                        if (g != null && g.Enabled === "1")
                            a.push(
                                new Promise(function (resolve, reject) { $ocLazyLoad.load('authFacebook').then(resolve, resolve); })
                                );
                    }
                    var authLoad = Promise.all(a);

                    var pAuth = new Promise(function (resolve, reject) {
                        configService.authProviders.setup().then(function () {
                            configService.init(true);
                            resolve();
                        });
                    });

                    Promise.all([
                                authLoad.then(pAuth),
                                googleAnalyticsService.load(Settings)
                    ]).then(onResolve);
                });
            }



            var loadSettings = function (apiConfig, configService, dataService, localStorageService, tmhDynamicLocale, settingsService, $stateParams, googleAnalyticsService, $ocLazyLoad) {
                return new Promise(function (resolve, reject) {

                    var onResolve = function () {
                        console.groupEnd();
                        resolve();
                    }

                    console.groupCollapsed('loadingSettings');

                    if (!configService.isInitialized()) {
                        console.log('loading settings');

                        initConfigService(apiConfig, CustomerConnect, localStorageService, configService, onResolve, dataService, tmhDynamicLocale, moment, $stateParams, configService, googleAnalyticsService, settingsService, $ocLazyLoad);
                    }
                    else
                        onResolve();

                });
            }

            var InitCustomer = function (returnState) {
                if (localStorageService.get(CustomerConnect.Config.Tenant + '_token') == null) {
                    $state.go('login', { returnState: returnState });
                    return;
                }

                CustomerConnect.Config.SessionId = localStorageService.get(CustomerConnect.Config.Tenant + '_token');
                apiConfig.setSessionId(CustomerConnect.Config.SessionId);



                var promiseC = dataService.customer.getCustomer();
                var promiseM = dataService.user.getMessages();

                Promise.all([promiseC, promiseM]).then(function (values) {
                    var vc = values[0];

                    if (vc.Failed) {
                        localStorageService.remove(CustomerConnect.Config.Tenant + '_token');
                        $state.go('login');
                        return;
                    }
                    userService.setCustomer(vc.ReturnObject);

                    var vm = values[1];
                    if (vm.Failed)
                        dialogs.error('Messages Error', 'Unable to load messages.');
                    else
                        userService.setMessages(vm.ReturnObject);

                    if (returnState)
                        $state.go(returnState);
                    else
                        $state.go('account');
                });
            };

            var isNeedInitCustomer = routeClean(to.url) === -1 && !userService.getCustomer();

            // if route requires auth and user is not logged in
            if (isNeedInitCustomer) {
                ev.preventDefault();//customer missing, stop load state.
            }

            return new Promise(function (resolve, reject) {

                var ls = loadSettings(apiConfig, configService, dataService, localStorageService, tmhDynamicLocale, settingsService, $stateParams, googleAnalyticsService, $ocLazyLoad);

                ls.then(function () {
                    if (isNeedInitCustomer) {
                        InitCustomer(to.name);
                    }
                    resolve();
                });

            });
        });

        $rootScope.$on('$stateChangeSuccess', function (event, to) {
            console.log(to);
            googleAnalyticsService.pageview(to.url);
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
})();