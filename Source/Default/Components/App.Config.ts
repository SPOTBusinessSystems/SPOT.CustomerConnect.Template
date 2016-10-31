/// <reference path="../../../typings/index.d.ts" />
/// <reference path="../../../Source/Default/Components/index.d.ts" />

module AppConfig {
    "use strict";

    declare const CustomerConnect: any;

    class App {
        // public static $inject = ["$stateProvider","$urlRouterProvider","$urlMatcherFactoryProvider","$httpProvider","dialogsProvider","localStorageServiceProvider","tmhDynamicLocaleProvider","settingsServiceProvider","userService","$rootScope","$state"];
        public static $inject = [];

        static setConfig($stateProvider: ng.ui.IStateProvider,
            $urlRouterProvider: ng.ui.IUrlRouterProvider,
            $urlMatcherFactoryProvider: ng.ui.IUrlMatcherFactory,
            $httpProvider: ng.IHttpProvider,
            dialogsProvider: ng.dialogservice.IDialogService,
            localStorageServiceProvider: ng.local.storage.ILocalStorageServiceProvider,
            tmhDynamicLocaleProvider: ng.dynamicLocale.tmhDynamicLocaleProvider,
            settingsServiceProvider: Settings.ISettingsServiceProvider): any {

            console.log('config set');

            $urlMatcherFactoryProvider.caseInsensitive(true);
            $urlMatcherFactoryProvider.strictMode(false);

            if (CustomerConnect.Config.Layout === null) {
                CustomerConnect.Config.Layout = "Default";
            }

            if (CustomerConnect.Config.Tenant === null) {
                settingsServiceProvider.setPath("/Template/" + CustomerConnect.Config.Layout + "/");
            } else {
                settingsServiceProvider.setPath("/" + CustomerConnect.Config.Tenant + "/Template/" + CustomerConnect.Config.Layout + "/");
            }

            $urlRouterProvider.otherwise("/login");
            localStorageServiceProvider.setPrefix("app").setStorageType("localStorage");
            tmhDynamicLocaleProvider.localeLocationPattern(settingsServiceProvider.getPath()
                + "Scripts/angular/i18n/angular-locale_{{locale}}.js");

            $stateProvider.state("globaldependencies", {
                abstract: true,
                url: "?theme&themeurl&cssurl", // for previewing themes.
                template: [
                    "<site-header></site-header>",
                    "<main-menu></main-menu>",
                    "<div class='container'>",
                    "<ui-view></ui-view>",
                    "</div>",
                    "<site-footer></site-footer>"
                ].join(""),
                resolve: {
                    loadSettings: function (
                        $q: ng.IQService,
                        apiConfig: ApiConfig,
                        configService: any,
                        dataService: DataService,
                        localStorageService: ng.local.storage.ILocalStorageService,
                        tmhDynamicLocale: ng.dynamicLocale.tmhDynamicLocaleService,
                        settingsService: Settings.ISettingsServiceProvider,
                        $stateParams: StateParams
                    ): any {
                        console.groupCollapsed("loadingSettings");

                        console.log("load set");
                        var deferred: any = $q.defer();

                        if (!configService.isInitialized()) {
                            console.log("loading settings");

                            apiConfig.setUrl(CustomerConnect.Config.URL);
                            apiConfig.setAccountKey(CustomerConnect.Config.AccountKey);
                            apiConfig.setSessionId(CustomerConnect.Config.SessionId);
                            apiConfig.setPublishableId(CustomerConnect.Config.PublishableId);

                            if (localStorageService.get(CustomerConnect.Config.Tenant + "_ccCache") !== null) {
                                configService.setProfile(
                                    JSON.parse(
                                        CustomerConnect.Util.base64._decode(
                                            localStorageService.get(CustomerConnect.Config.Tenant + "_ccCache")
                                        )
                                    )
                                );

                                configService.authProviders.setup();

                                // temp for testing
                                // localStorageService.remove("ccCache");
                            } else {
                                dataService.getSpecificSettings(
                                    true, true, true, true, true, true, true, true
                                )
                                    .then(function (data: any): any {

                                        var Settings: any = null;

                                        if (!data.Failed) {
                                            Settings = data.ReturnObject.CustomerConnectSettings;
                                        } else {
                                            Settings = { Notifications: null, Preferences: null, Stores: null, States: null };
                                        }

                                        configService.setProfile(Settings);

                                        console.log("auth setup");
                                        configService.authProviders.setup().then(function (): any {
                                            console.log(Settings);

                                            var Themes: any = [
                                                { Name: "Default", File: "bootstrap-default.min.css" },
                                                { Name: "Cerulean", File: "bootstrap-cerulean.min.css" },
                                                { Name: "Cosmo", File: "bootstrap-cosmo.min.css" },
                                                { Name: "Cyborg", File: "bootstrap-cyborg.min.css" },
                                                { Name: "Darkly", File: "bootstrap-darkly.min.css" },
                                                { Name: "Flatly", File: "bootstrap-flatly.min.css" },
                                                { Name: "Journal", File: "bootstrap-journal.min.css" },
                                                { Name: "Lumen", File: "bootstrap-lumen.min.css" },
                                                { Name: "Paper", File: "bootstrap-paper.min.css" },
                                                { Name: "Readable", File: "bootstrap-readable.min.css" },
                                                { Name: "Sandstone", File: "bootstrap-sandstone.min.css" },
                                                { Name: "Simplex", File: "bootstrap-simplex.min.css" },
                                                { Name: "Slate", File: "bootstrap-slate.min.css" },
                                                { Name: "Spacelab", File: "bootstrap-spacelab.min.css" },
                                                { Name: "Superhero", File: "bootstrap-superhero.min.css" },
                                                { Name: "United", File: "bootstrap-united.min.css" },
                                                { Name: "Yeti", File: "bootstrap-yeti.min.css" }
                                            ];

                                            if (Settings) {
                                                if (Settings.General !== null) {
                                                    // put into setting dynamic language
                                                    tmhDynamicLocale.set(Settings.General["Data Formats"]["Language Tag"]);
                                                    moment.locale(Settings.General["Data Formats"]["Language Tag"]);

                                                    if (Settings.General.Theme !== "Custom") {
                                                        for (var x: number = 0; x < Themes.length; x++) {
                                                            if (Themes[x].Name === Settings.General.Theme) {
                                                                configService.setCSSPath(
                                                                    settingsService.getPath() + "Content/bootstrap/" + Themes[x].File
                                                                );
                                                                $("#themeCss").attr("href", configService.getCSSPath());
                                                            }
                                                        }
                                                    } else {
                                                        $("#themeCss").attr("href", Settings.General["Theme Custom URL"]);
                                                    }

                                                    if (Settings.General["Additional CSS URL"]) {
                                                        $("#additionalCss").attr("href", Settings.General["Additional CSS URL"]);
                                                    }
                                                }
                                            }

                                            // preview themes using &theme= or &themeurl=
                                            if ($stateParams.theme) {
                                                for (var y: number = 0; y < Themes.length; y++) {
                                                    if (Themes[y].Name.toLowerCase() === $stateParams.theme.toLowerCase()) {

                                                        configService.setCSSPath(
                                                            settingsService.getPath() + "Content/bootstrap/" + Themes[y].File
                                                        );

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

                                            // config is initialized.
                                            configService.init(true);

                                            console.groupEnd();

                                            deferred.resolve();
                                        });
                                    });
                            }

                            return deferred.promise;
                        }
                    }
                }
            });

            $stateProvider.state("login", {
                url: "/login",
                parent: "globaldependencies",
                templateUrl: settingsServiceProvider.getPath() + "Components/Views/Login/LoginView.html"
            });

            $stateProvider.state("signup", {
                url: "/signup?refid&refkey",
                parent: "globaldependencies",
                templateUrl: settingsServiceProvider.getPath() + "Components/Views/Signup/SignupView.html",
                params: {
                    key: {
                        value: null,
                        squash: true
                    }
                }
            });

            $stateProvider.state("payment", {
                url: "/payment",
                parent: "globaldependencies",
                templateUrl: settingsServiceProvider.getPath() + "Components/Views/Payments/PaymentsView.html"
            });

            $stateProvider.state("account", {
                url: "/account",
                parent: "globaldependencies",
                templateUrl: settingsServiceProvider.getPath() + "Components/Views/Account/AccountView.html"
            });

            $stateProvider.state("giftcards", {
                url: "/giftcards",
                parent: "globaldependencies",
                templateUrl: settingsServiceProvider.getPath() + "Components/Views/GiftCards/GiftCardsView.html"
            });

            $stateProvider.state("orders", {
                url: "/orders",
                parent: "globaldependencies",
                templateUrl: settingsServiceProvider.getPath() + "Components/Views/Orders/OrdersView.html"
            });

            $stateProvider.state("pickup", {
                url: "/pickup",
                parent: "globaldependencies",
                templateUrl: settingsServiceProvider.getPath() + "Components/Views/Pickup/PickupView.html"
            });

            $stateProvider.state("suspend", {
                url: "/suspend",
                parent: "globaldependencies",
                templateUrl: settingsServiceProvider.getPath() + "Components/Views/Suspend/Suspend.html"
            });

            $stateProvider.state("kiosk", {
                url: "/kiosk",
                parent: "globaldependencies",
                templateUrl: settingsServiceProvider.getPath() + "Components/Views/Kiosk/KioskView.html"
            });

            $stateProvider.state("statements", {
                url: "/statements",
                parent: "globaldependencies",
                templateUrl: settingsServiceProvider.getPath() + "Components/Views/Statements/StatementsView.html"
            });

            $stateProvider.state("reminder", {
                url: "/reminder/:key",
                parent: "globaldependencies",
                templateUrl: settingsServiceProvider.getPath() + "Components/Views/Reminder/ReminderView.html",
                params: {
                    key: {
                        value: null,
                        squash: true
                    }
                }
            });

            $stateProvider.state("confirmation", {
                url: "/confirmation?Status&Type&PickupDate&TransactionID&Comment",
                parent: "globaldependencies",
                templateUrl: settingsServiceProvider.getPath() + "Components/Views/Confirmation/ConfirmationView.html"
            });

            $stateProvider.state("notifications", {
                url: "/notifications?Id",
                parent: "globaldependencies",
                templateUrl: settingsServiceProvider.getPath() + "Components/Views/Notifications/NotificationsView.html"
            });

        };

        static setRun($rootScope: ng.IRootScopeService, userService: IUserService, $state: ng.ui.IStateService) {
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
        };
    }


    Init.getModule().config(App.setConfig);
    Init.getModule().run(App.setRun);
}