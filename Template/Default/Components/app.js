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

    ccApp.provider('settingsService', function () {
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

                var p = url.toLowerCase();
                console.log('pageview ' + p);

                if (!isLoaded || !$window.ga)
                    return;
                $window.ga('send', 'pageview', p);
            }

        }
    }]);


    ccApp.factory('CheckStateChangeService', function ($rootScope, $state) {

        var addCheck = function ($scope, validateStateChangeFunction) {

            var eventListener = $rootScope.$on('$stateChangeStart'
                , function (event, toState, toParams, fromState, fromParams) {

                    if (fromParams.skipSomeAsync) {
                        return;
                    }

                    event.preventDefault();

                    function continueNavigation() {
                        fromParams.skipSomeAsync = true;
                        $state.go(toState.name, toParams);
                    }

                    validateStateChangeFunction(continueNavigation);
                });

            $scope.$on("$destroy", eventListener);
        };

        return { checkFormOnStateChange: addCheck };
    });


    ccApp.provider('themeService', [function () {
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

        function setCssUrl(cssId, url) {
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

        var that = this;
        that.Data = {
            theme: null,
            themeurl: null,
            cssurl: null
        };

        that.getThemeCssUrl = function (name, configService, settingsService) {
            for (var x = 0; x < Themes.length; x++) {
                if (Themes[x].Name.toLowerCase() === name.toLowerCase()) {
                    configService.setCSSPath(settingsService.path + 'Content/bootstrap/' + Themes[x].File);
                    return configService.getCSSPath();
                }
            }
            return '';
        };

        that.setThemeCss = function (url) {
            setCssUrl('themeCss', url);
        };
        that.setAdditionalCss = function (url) {
            setCssUrl('additionalCss', url);
        };

        that.setTheme = function (name, configService, settingsService) {
            that.setThemeCss(that.getThemeCssUrl(name, configService, settingsService));
        }

        that.setupTheme = function (name, configService, settingsService) {
            that.data.themeurl = that.getThemeCssUrl(name, configService, settingsService);
        }

        that.setupThemePreview = function (configService, settingsService, $stateParams) {

            console.log('setupThemePreview');

            // Preview themes using &theme= or &themeurl=
            if ($stateParams.theme) {
                that.Data.theme = $stateParams.theme;
                that.setTheme($stateParams.theme, configService, settingsService);
            }
            if ($stateParams.themeurl) {
                that.Data.themeurl = $stateParams.themeurl;
                that.setThemeCss($stateParams.themeurl);
            }
            if ($stateParams.cssurl) {
                that.Data.cssurl = $stateParams.cssurl;
                that.setAdditionalCss($stateParams.cssurl);
            }
        }

        function Item() {
            return {
                Data: that.Data,
                setThemeCss: that.setThemeCss,
                setAdditionalCss: that.setAdditionalCss,
                setTheme: that.setTheme,
                getThemeCssUrl: that.getThemeCssUrl,
                setupThemePreview: that.setupThemePreview
            }
        }

        this.$get = [function () {
            return new Item();
        }];
    }]);

    ccApp.factory('blindService', ['blockUI', 'blockUIConfig', function (blockUI, blockUIConfig) {
        var hideCounter = 0;
        return {
            hide: function (n) {
                hideCounter = n;
                blockUIConfig.cssClass = 'block-ui-non-transparent';
                blockUI.start();
                //console.log('hide');
            },

            show: function () {
                //console.log('show');
                hideCounter--;

                if (hideCounter <= 0) {
                    blockUI.stop();
                    $('.block-ui-non-transparent').removeClass('block-ui-non-transparent');
                    //console.log('show time');
                }
            }
        }
    }]);

    ccApp.factory('facebookPixelTrackingService', [function () {
        var isLoaded = false;
        return {
            load: function (Settings, onCompleted) {

                if (!isLoaded && Settings && Settings.General && Settings.General["Facebook Pixel"]
                    && Settings.General["Facebook Pixel"]["Facebook Pixel ID"]) {

                    var key = Settings.General["Facebook Pixel"]["Facebook Pixel ID"];

                    !function (f, b, e, v, n, t, s) {
                        if (f.fbq) return; n = f.fbq = function () {
                            n.callMethod ?
                            n.callMethod.apply(n, arguments) : n.queue.push(arguments)
                        };
                        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
                        n.queue = []; t = b.createElement(e); t.async = !0;
                        t.src = v; s = b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t, s)
                    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

                    fbq('init', key);

                    isLoaded = true;
                    if (onCompleted)
                        onCompleted();
                }
                else
                    if (onCompleted)
                        onCompleted();
            },

            trackEvent: function (eventName) {

                if (!isLoaded || !fbq)
                    return;

                fbq('trackCustom', eventName);
            }
        }
    }]);

    ccApp.factory('printService', ['$rootScope', '$compile', '$http', '$timeout', '$q',
        function ($rootScope, $compile, $http, $timeout, $q) {

            var openNewWindow = function (html) {
                var popupWin = window.open('', '_blank', '');
                popupWin.document.open();
                popupWin.document.write('<html><head></head><body onload="window.print(); window.close();">' + html + '</html>');
                popupWin.document.close();
            };

            var print = function (templateUrl, data) {
                $http.get(templateUrl).then(function (templateResponse) {
                    var template = templateResponse.data;
                    var printScope = $rootScope.$new();
                    angular.extend(printScope, data);
                    var element = $compile($(template))(printScope);
                    var renderAndPrintPromise = $q.defer();

                    return new Promise(function (resolve, reject) {
                        var waitForRenderAndPrint = function () {
                            if (printScope.$$phase || $http.pendingRequests.length) {
                                $timeout(waitForRenderAndPrint, 1000);
                            } else {
                                openNewWindow(element.html());
                                resolve();
                                printScope.$destroy();
                            }
                        };
                        waitForRenderAndPrint();
                    });
                });
            };

            return {
                print: print
            };
        }]);


    ccApp.config(function ($stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider,
        $httpProvider, dialogsProvider, localStorageServiceProvider, tmhDynamicLocaleProvider,
        settingsServiceProvider
        , $controllerProvider, $compileProvider, $filterProvider, $provide, $ocLazyLoadProvider, themeServiceProvider, $locationProvider
        ) {

        $locationProvider.hashPrefix('');

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


        function loadMap($window, configService) {
            return new Promise(function (resolve, reject) {

                //console.log('loadMap');

                configService.onProfile(function () {

                    //console.log('got settings');

                    if (typeof google === 'object' && typeof google.maps === 'object') {
                        console.log('Map already loaded');
                        resolve();
                    } else {
                        $window.GoogleMapLoaded = function () {
                            console.log('Map loaded');
                            resolve();
                        }

                        var script = document.createElement("script");
                        script.type = "text/javascript";
                        script.src = "https://maps.googleapis.com/maps/api/js?libraries=places&callback=GoogleMapLoaded";

                        var s = configService.getProfile();

                        //Next 2 lines in case "Google API Key" is missing. Should be removed.
                        if (!s.General.Geocoding["Google API Key"])
                            s.General.Geocoding["Google API Key"] = 'AIzaSyAAFnu36gyziL9GvKd-e_VmvY-CqFvftjY';

                        if (s.General.Geocoding && s.General.Geocoding["Google API Key"])
                            script.src += '&key=' + s.General.Geocoding["Google API Key"];

                        document.body.appendChild(script);
                    }
                });
            });
        }

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


        var isRecaptchaLoaded = false;

        function loadRecaptcha($ocLazyLoad, $window) {
            return new Promise(function (resolve, reject) {
                resolve();//don't block load process

                if (isRecaptchaLoaded)
                    return;

                var f = function () {
                    if ($window.vcRecaptchaApiLoaded) { //is vcRecaptcha loaded?
                        console.log("loading recaptcha");
                        $ocLazyLoad.load('recaptcha').then(function () { isRecaptchaLoaded = true; });
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

                            componentPath('Base/PhoneNumber.js'),
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

                            componentPath('Base/PhoneNumber.js'),
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
                    files: [
                        cssPath('styles-material-bundle.min.css'),
                        scriptPath('angular-material-bundle.min.js?v=1.0.0'),

                        componentPath('Base/CreditCard.js'),
                        controllerPath('Payments')
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
                     files: [cssPath('styles-material-bundle.min.css'),
                             scriptPath('angular-material-bundle.min.js?v=1.0.0'),
                             controllerPath('Pickup')
                     ]
                 },
                 {
                     name: 'pickupCalendar',
                     files: [cssPath('styles-material-bundle.min.css'),
                             scriptPath('angular-material-bundle.min.js?v=1.0.0'),
                             controllerPath('PickupCalendar')
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
                 },
                 {
                     name: 'postback',
                     files: [controllerPath('postBack')
                     ]
                 },
                 {
                     name: 'coupon',
                     files: [controllerPath('coupon')
                     ]
                 },
                 {
                     name: 'locker',
                     files: [
                         cssPath('styles-material-bundle.min.css'),
                         scriptPath('angular-material-bundle.min.js?v=1.0.0'),

                         controllerPath('Locker')
                     ]
                 }
            ]
        });


        function resolveTemplate($stateParams, settingsService, configService) {
            var res =
            [
                '<site-header></site-header>',
                '<main-menu></main-menu>',
                '<div class="container">',
                '<ui-view></ui-view>',
                '</div>',
                '<site-footer></site-footer>'
            ].join('');

            return res;
        }

        function resolveTemplateLogin($stateParams, settingsService, configService) {
            var res =
            [
                '<site-header></site-header>',
                '<main-menu></main-menu>',
                '<ui-view></ui-view>',
                '<site-footer></site-footer>'
            ].join('');

            return res;
        }

        // Views
        $stateProvider.state('login', {
            url: '/login?sid&authtoken',
            parent: 'globaldependenciesLogin',
            templateUrl: viewPath('Login'),
            params: { forgotPasswordEmail: null, returnState: null },
            resolve: {
                loginBySid: loginBySid,
                load: loadFiles('login')
            }
        })
        // Views
        $stateProvider
        .state('signup', {
            url: '/signup?refid&refkey',
            parent: 'globaldependenciesanonymous',
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
            params: { requirePasswordChange: null, reload: false },
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
        .state('pickupcalendar', {
            url: '/pickupcalendar',
            parent: 'globaldependencies',
            templateUrl: viewPath('PickupCalendar'),
            resolve: { load: loadFiles('pickupCalendar') }
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
            parent: 'globaldependenciesanonymous',
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
            parent: 'globaldependenciesanonymous',
            templateUrl: viewPath('Confirmation'),
            resolve: { load: loadFiles('confirmation') }
        })
        .state('notifications', {
            url: '/notifications?Id',
            parent: 'globaldependenciesanonymous',
            templateUrl: viewPath('Notifications'),
            resolve: { load: loadFiles('notifications') }
        })
        .state('postback', {
            url: '/postback',
            parent: 'globaldependenciesanonymous',
            templateUrl: viewPath('PostBack'),
            resolve: { load: loadFiles('postback') }
        })
        .state('coupon', {
            url: '/coupon?barcode&qrcode&text&w&h',
            parent: 'globaldependenciesanonymous',
            templateUrl: viewPath('Coupon'),
            resolve: { load: loadFiles('coupon') }
        })
        .state('locker', {
            url: '/locker',
            parent: 'globaldependencies',
            templateUrl: viewPath('Locker'),
            resolve: { load: loadFiles('locker'), loadMap: loadMap }
        })


        .state('globaldependenciesLogin', {
            abstract: true,
            url: '?theme&themeurl&cssurl', // for previewing themes.
            template: resolveTemplateLogin,
            resolve: {
                setupThemePreview: themeServiceProvider.setupThemePreview,
                config: loadConfig
            }
        })
        .state('globaldependenciesanonymous', {
            abstract: true,
            url: '?theme&themeurl&cssurl', // for previewing themes.
            template: resolveTemplate,
            resolve: {
                //setupThemePreview: themeServiceProvider.setupThemePreview,
                config: loadConfig
            }
        })
        .state('globaldependencies', {
            abstract: true,
            url: '?theme&themeurl&cssurl', // for previewing themes.
            template: resolveTemplate,
            resolve: {
                //setupThemePreview: themeServiceProvider.setupThemePreview,//!!todo
                config: loadConfig
            }
        });

    });//ccApp.config

    // ********************************************************************************************************************************************************************************

    function loginBySid($stateParams, localStorageService, apiConfig, dataService, userService) {

        return new Promise(function (resolve, reject) {

            var sessionId = $stateParams.sid;
            if (!sessionId) {
                resolve();
                return;
            }

            apiConfig.setSessionId(sessionId);
            CustomerConnect.Config.SessionId = sessionId;
            localStorageService.set(CustomerConnect.Config.Tenant + '_token', sessionId);

            //suppose that server works OK and settings are being loaded using common functionality

            //load Customer
            initCustomer(null, localStorageService, CustomerConnect, apiConfig, dataService, userService).then(function () {
                console.log("loginBySid redirect");
                reject({ redirectTo: 'account' });
            })
        });
    }


    function loadConfig(configService, dataService, googleAnalyticsService, $ocLazyLoad, tmhDynamicLocale, $stateParams, settingsService,
        localStorageService, userService, $state, themeService, blindService, $urlRouter)
        //CustomerConnect is global
    {
        console.log('loadConfig');

        return new Promise(function (resolve) {

            var ls = loadSettings(configService, dataService,
                          googleAnalyticsService, $ocLazyLoad, CustomerConnect);

            ls.then(function () {
                console.log('Settings loaded');
                new Promise(function (resolve) {
                    themeService.setupThemePreview(configService, settingsService, $stateParams);
                    resolve();
                }).then(function () {
                    loadSettingsTheme(configService, tmhDynamicLocale, themeService, blindService, $stateParams, settingsService, $ocLazyLoad);//this is promise.
                });

                resolve();
            });

        });
    }

    function loadSettingsTheme(configService, tmhDynamicLocale, themeService, blindService, $stateParams, settingsService, $ocLazyLoad) {

        console.log('loadSettingsTheme');

        var loadTheme = function () {

            var Settings = configService.getProfile();

            var cssToLoad = [];

            if (Settings && Settings.General) {
                var themeCssUrl = '';
                var additionalCssUrl = '';

                var g = Settings.General;
                // Put into setting dynamic language
                tmhDynamicLocale.set(g['Data Formats']['Language Tag']);
                moment.locale(g['Data Formats']['Language Tag']);

                if (!g.Theme)
                    g.Theme = "Default";

                if (g.Theme !== 'Custom') {
                    if (!themeService.Data.theme) {
                        //themeService.setTheme(g.Theme, configService, settingsService);
                        themeCssUrl = themeService.getThemeCssUrl(g.Theme, configService, settingsService);
                    }
                } else {
                    if (!themeService.Data.themeurl) {
                        //themeService.setThemeCss(g['Theme Custom URL']);
                        themeCssUrl = g['Theme Custom URL'];
                    }
                }

                //if (g['Additional CSS URL'] && !themeService.Data.cssurl) {
                //    themeService.setAdditionalCss(g['Additional CSS URL']);
                //}

                additionalCssUrl = themeService.Data.cssurl ? themeService.Data.cssurl : g['Additional CSS URL'];

                if (themeCssUrl && themeCssUrl.length) cssToLoad.push(themeCssUrl);
                if (additionalCssUrl && additionalCssUrl.length) cssToLoad.push(additionalCssUrl);
            }

            $ocLazyLoad.load(cssToLoad)
            .then(function () {
                console.log('loadSettingsTheme: finished!');
                blindService.show();
            })
            .catch(function (err) {
                console.log('loadSettingsTheme: failed!', err);
                blindService.show();
            });
        }

        return new Promise(function (resolve, reject) {
            loadTheme();
            resolve();
        });
    }


    function loadSettings(configService, dataService,
                          googleAnalyticsService, $ocLazyLoad, CustomerConnect) {

        console.log('loadSettings');

        return new Promise(function (resolve, reject) {

            if (configService.isInitialized()) {
                resolve();
                return;
            }

            var onResolve = function () {
                console.groupEnd();
                configService.init(true);
                resolve();
            }

            var initConfigService = function (CustomerConnect, configService, dataService,
                                          googleAnalyticsService, $ocLazyLoad, onResolve) {
                dataService.settings.getSpecificSettings(true, true, true, true, true, true, true, true, true).then(function (data) {

                    if (!data)
                        return;

                    var Settings = null;

                    if (!data.Failed) {
                        Settings = data.ReturnObject.CustomerConnectSettings;
                        if (data.Version)
                            Settings.Version = data.Version;
                    }
                    else {
                        console.log('load settings failed');

                        if (data.Message == "Invalid or expired session") {
                            console.log('expired session');
                            window.location.reload();
                            return;//have nothing to do;
                        }

                        Settings = { Notifications: null, Preferences: null, Stores: null, States: null, General: { 'Authentication Providers': null } };
                        console.log('empty settings loaded');
                        console.log(data);
                    }

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

                    var pAuth = configService.authProviders.setup();

                    var localityPromise = new Promise(function (resolve, reject) {
                        dataService.settings.getLocalitySettings(true, true, true, true, true, true, true, true).then(function (data) {
                            if (!data.Failed) {
                                Settings.LocalitySettings = data.ReturnObject;
                                if (!Settings.LocalitySettings.Level2Name)
                                    Settings.LocalitySettings.Level2Name = "State";

                                //if (!Settings.LocalitySettings.Level3Name)
                                //{
                                //    var x = "City";//default

                                //    //Patch for RosesAltNZ, should be removed when Level3Name implemented and set up.
                                //    if (Settings.General.Workstation == 'ROSNZ_API') {
                                //        x = 'Suburb';
                                //        Settings.LocalitySettings.Level2Name = "City";
                                //    }

                                //    Settings.LocalitySettings.Level3Name = x;
                                //}


                                configService.setProfile(Settings);
                            }
                            resolve();
                        });
                    });

                    Promise.all([
                                authLoad.then(pAuth),
                                googleAnalyticsService.load(Settings),
                                localityPromise
                    ]).then(function () {
                        onResolve();
                    });
                });
            };

            console.groupCollapsed('loadingSettings');
            console.log('loading settings');
            initConfigService(CustomerConnect, configService, dataService,
                              googleAnalyticsService, $ocLazyLoad, onResolve);
        });
    };


    var initCustomer = function (returnState, localStorageService, CustomerConnect, apiConfig, dataService, userService) {
        console.log('initCustomer');

        return new Promise(function (resolve) {
            if (localStorageService.get(CustomerConnect.Config.Tenant + '_token') == null) {
                console.log('login with return');
                resolve({ state: 'login', params: { returnState: returnState } });
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
                    console.log('login');
                    resolve({ state: 'login', params: {} });
                    return;
                }
                userService.setCustomer(vc.ReturnObject);

                var vm = values[1];
                if (vm.Failed)
                    dialogs.error('Messages Error', 'Unable to load messages.');
                else
                    userService.setMessages(vm.ReturnObject);

                if (returnState) {
                    console.log('Continue');
                    resolve();
                }
                else {
                    console.log('account');
                    resolve({ state: 'account', params: {} });
                }
            });
        });
    };


    // -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    // Restriction
    ccApp.run(function ($rootScope, userService, $state, googleAnalyticsService, apiConfig, configService, dataService, localStorageService, tmhDynamicLocale, settingsService, $stateParams, $ocLazyLoad, themeService, blindService
    ) {
        blindService.hide(3);

        $rootScope.$on('$stateChangeStart', function (ev, toState, toParams, from, fromParams) {
            console.log('route');
            //console.log(ev);
            console.log(toState);

            //if (fromParams.skipSomeAsyncGlobal) {
            //    fromParams.skipSomeAsyncGlobal = false;
            //    return;
            //}

            if (!apiConfig.url)
                apiConfig.ApplyConfig(CustomerConnect.Config);

            var isAnonymousParent = function (route) {
                return $.inArray(route, ['globaldependenciesanonymous', 'globaldependenciesLogin']);
            };

            var isNeedCustomer = isAnonymousParent(toState.parent) === -1 && !userService.getCustomer();
            if (!isNeedCustomer)
                return;

            ev.preventDefault();

            function continueNavigation(data) {
                //fromParams.skipSomeAsyncGlobal = true;
                if (data)
                    $state.go(data.state, data.params);
                else
                    $state.go(toState.name, toParams);
            }

            initCustomer(toState.name, localStorageService, CustomerConnect, apiConfig, dataService, userService).then(function (data) {
                continueNavigation(data);
            });
        });

        $rootScope.$on('$stateChangeSuccess', function (event, toState) {
            googleAnalyticsService.pageview(toState.url);
        });

        $rootScope.$on('$routeChangeSuccess', function () {
            // fix recaptcha bug
            $('.pls-container').remove();
        });

        $rootScope.$on('$stateChangeError', function (evt, to, toParams, from, fromParams, error) {
            if (error.redirectTo) {
                $state.go(error.redirectTo, {}, { reload: true });
            }
            else {
                console.log("stateChangeError");
                console.log(error);
            }
        })
    });

    ccApp.directive('currencyformatter', function ($filter, configService) {

        var Settings = configService.getProfile();

        var symbol = Settings.LocalitySettings.CurrencySymbol;
        var precision = Settings.LocalitySettings.DigitsAfterDecimal;

        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ctrl) {
                ctrl.$formatters.push(function (data) {

                    var formatted = $filter('currency')(data, symbol, precision);
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
                    var formatted = $filter('currency')(plainNumberWithDecimal, symbol, precision);
                    element.val(formatted);

                    return Number(plainNumberWithDecimal);
                });
            }
        };
    });

    ccApp.filter('localizedCurrency', function ($filter, configService) {

        var Settings = configService.getProfile();

        var symbolDefault = Settings.LocalitySettings.CurrencySymbol;
        var precisionDefault = Settings.LocalitySettings.DigitsAfterDecimal;


        return function (input, symbol, precision) {

            // Ensure that we are working with a number
            if (isNaN(input)) {
                return input;
            } else {

                // Check if optional parameters are passed, if not, use the defaults
                var symbol = symbol || symbolDefault;
                var precision = precision === precision ? precisionDefault : precision;

                return $filter('currency')(input, symbol, precision);
            }
        }

    });

    ccApp.filter('localizedDate', function ($filter, configService) {

        var ls = configService.getProfile().LocalitySettings;

        var formats = {
            shortDate: ls.ShortDateFormat_Angular,
            fullDate: ls.LongDateFormat_Angular,

            short: ls.ShortDateFormat_Angular + ' ' + ls.TimeFormat_Angular,
            pickupDate: "EEE MMM dd"
        };

        return function (input, format) {

            if (formats[format] != undefined)
                return $filter('date')(input, formats[format]);

            return $filter('date')(input, format);
        }
    });

    ccApp.filter("trust", ['$sce', function ($sce) {
        return function (htmlCode) {
            return $sce.trustAsHtml(htmlCode);
        }
    }]);


})();