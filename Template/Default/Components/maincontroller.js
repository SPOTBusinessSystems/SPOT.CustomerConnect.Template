(function () {
    'use strict';

    angular
        .module('app')
        .controller('maincontroller', maincontroller);

    maincontroller.$inject = ['$location', '$scope', 'localStorageService', '$state', 'dialogs', '$rootScope', 'settingsService', 'userService', 'dataService', 'configService', 'apiConfig', 'tmhDynamicLocale'];

    function maincontroller($location, $scope, localStorageService, $state, dialogs, $rootScope, settingsService, userService, dataService, configService, apiConfig, tmhDynamicLocale) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'maincontroller';

        activate();

        function activate() {
            CustomerConnect.Config.Customer = null;

            if (userService.getCustomer()) {
                $scope.Customer = userService.getCustomer();
            }

            $scope.isCollapsed = true;
            $scope.Settings = configService.getProfile();

            $scope.Themes = [
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

            $scope.ChangeTheme = function () {
                if ($scope.Settings) {
                    if ($scope.Settings.General != null) {
                        console.log('test');
                        console.log($scope.Settings);

                        // Put into setting dynamic language
                        tmhDynamicLocale.set($scope.Settings.General['Data Formats']['Language Tag']);
                        moment.locale($scope.Settings.General['Data Formats']['Language Tag']);

                        if ($scope.Settings.General.Theme !== 'Custom') {
                            for (var x = 0; x < $scope.Themes.length; x++) {
                                if ($scope.Themes[x].Name === $scope.Settings.General.Theme) {
                                    $("#themeCss").attr("href", settingsService.path + 'Content/bootstrap/' + $scope.Themes[x].File);
                                    return;
                                }
                            }
                        } else {
                            $("#themeCss").attr("href", $scope.Settings.General['Theme Custom URL']);
                        }
                    }
                }
            };

            $scope.LogOut = function () {
                dataService.user.logout().then(function (data) {
                    localStorageService.remove(CustomerConnect.Config.Tenant + '_token');
                    window.location.reload(); // Reacquire new session.
                });
            };

            $scope.LoadSettings = function () {
                if (localStorageService.get(CustomerConnect.Config.Tenant + '_ccCache') != null) {
                    configService.setProfile(JSON.parse(CustomerConnect.Util.base64._decode(localStorageService.get(CustomerConnect.Config.Tenant + '_ccCache'))));
                    $scope.Settings = configService.getProfile();
                    $rootScope.Settings = configService.getProfile();

                    $scope.ChangeTheme();
                    $scope.LoadUser();

                    $scope.Loaded = true;
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
                                        $scope.Settings = configService.getProfile();
                                        $rootScope.Settings = configService.getProfile();

                                        console.log($scope.Settings);

                                        $scope.ChangeTheme();
                                        $scope.LoadUser();
                                        $scope.Loaded = true;

                                        $state.go('account');
                                    });
                                });
                            })
                        })
                    });
                }
            };

            $scope.LoadUser = function () {
                if (localStorageService.get(CustomerConnect.Config.Tenant + '_token') != null) {
                    CustomerConnect.Config.SessionId = localStorageService.get(CustomerConnect.Config.Tenant + '_token');
                    apiConfig.setSessionId(CustomerConnect.Config.SessionId);

                    dataService.customer.getCustomer().then(function (data) {
                        if (!data.Failed) {
                            userService.setCustomer(data.ReturnObject);
                            $scope.Customer = data.ReturnObject;
                            $rootScope.LoggedIn = true;
                            $state.go('account');
                        } else {
                            //dialogs.error('Load Failed', 'Unable to retrieve customer data. Please login again.');
                            localStorageService.remove(CustomerConnect.Config.Tenant + '_token');
                            window.location.reload();
                        }
                    });
                }
            };

            // Use these if session token has already been established by server side component.
            $scope.LoadSettings();
            $scope.ChangeTheme();
        }
    }
})();
