(function () {
    'use strict';

    angular.module('app').component('googleAuth', {
        bindings: {
            onLogin: '&'
        },
        controller: function (dataService, userService, configService, $state, apiConfig, dialogs) {
            var ctrl = this;
            ctrl.signedIn = false;
            ctrl.configService = configService;

            this.$onInit = function () {
                console.log('init');

                // Check to make sure Google association is enabled.
                if (configService.authProviders.google.enabled) {
                    // Check to make sure user is signed in to both Google and CC.
                    ctrl.signedIn = configService.authProviders.google.isSignedIn() && userService.getCustomer();
                }
            };

            this.onSuccess = function () {
                if (userService.getCustomer()) {
                    this.associate();
                } else {
                    this.login();
                }
            };

            this.login = function () {
                // Google signin
                configService.authProviders.google.signin().then(function (gData) {
                    if (gData.tokenId) {
                        // Use login to authenticate to API.
                        dataService.user.loginOAuth(configService.authProviders.google.spotAuthType, gData.tokenId)
                            .then(function (data) {
                                if (!data.Failed) {
                                    // Success, setup session.
                                    console.log('set session');
                                    apiConfig.setSessionId(data.ReturnObject.SessionID);
                                    CustomerConnect.Config.SessionId = data.ReturnObject.SessionID;

                                    // Successfully logged in, return to controller and proceed.
                                    ctrl.onLogin();
                                } else {
                                    // Failed to login with Google.
                                    dialogs.error('Login Failed', data.Message);
                                    configService.authProviders.google.signout();
                                }
                            });
                    } else {
                        // Could not sign in to Google.
                        dialogs.error('Login Failed', 'Unable to authenticate with Google.');
                        configService.authProviders.google.signout();
                    }
                });
            };

            this.associate = function () {
                // Login to Google.
                configService.authProviders.google.signin().then(function (gData) {
                    if (gData.tokenId) {
                        dataService.user.updateAuthProvider(configService.authProviders.google.spotAuthType, gData.El, gData.tokenId)
                            .then(function (data) {
                                if (!ctrl.signedIn) {
                                    $state.reload();
                                }
                            });
                    } else {
                        // Could not sign in to Google.
                        dialogs.error('Login Failed', 'Unable to authenticate with Google.');
                        configService.authProviders.google.signout();
                    }
                });
            };

            this.onSuccessOld = function (gData) {
                // Prevent loggging when the user is already signed in. Only log on association.
                if (!ctrl.signedIn) {
                    //ctrl.onLink(gData);
                    dataService.user.updateAuthProvider(configService.authProviders.google.spotAuthType, gData.El, gData.hg.id_token)
                        .then(function (data) {
                            if (!ctrl.signedIn) {
                                $state.reload();
                            }
                        });
                }
            };

            // When unlinked, remove from customer/app.
            this.unlink = function () {
                configService.authProviders.google.unlink();
                configService.authProviders.google.signout().then(function () {
                    dataService.user.removeAuthProvider(configService.authProviders.google.spotAuthType)
                    .then(function (data) {
                        $state.reload();
                    });
                })
            };
        },
        template: [
            '<div class="btn btn-block btn-social btn-google" ng-if="$ctrl.configService.authProviders.google.enabled && !$ctrl.signedIn" ng-click="$ctrl.onSuccess($ctrl.signedIn);">',
                '<span class="fa fa-google"></span>',
                '<label>Login with Google</label>',
            '</div>',
            '<div class="btn btn-block btn-social btn-google" ng-if="$ctrl.configService.authProviders.google.enabled && $ctrl.signedIn">',
                '<span class="fa fa-google"></span>',
                '<label>Logged in with Google</label>',
                '<label class="social-right" ng-if="$ctrl.signedIn" ng-click="$ctrl.unlink();">Unlink</label>',
            '</div>'
        ].join('')
    });
})();