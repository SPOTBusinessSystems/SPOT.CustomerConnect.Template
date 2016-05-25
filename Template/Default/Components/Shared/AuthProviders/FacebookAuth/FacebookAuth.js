(function () {
    'use strict';

    angular.module('app').component('facebookAuth', {
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
                if (configService.authProviders.facebook.enabled) {
                    // Is a user signed in. This is for showing the unlink button.
                    configService.authProviders.facebook.isSignedIn().then(function (data) {
                        if (data && userService.getCustomer()) {
                            ctrl.signedIn = true;
                        }
                    });
                }
            };

            ctrl.authorize = function (data) {
                console.log(data);
                dataService.user.updateAuthProvider(configService.authProviders.facebook.spotAuthType, data.authResponse.userID, data.authResponse.accessToken)
                    .then(function (data) {
                        if (!ctrl.signedIn) {
                            $state.reload();
                        }
                    });
            };

            this.login = function () {
                configService.authProviders.facebook.signin().then(function () {
                    if (configService.authProviders.facebook.enabled) {

                        // Check if user is already logged in.
                        FB.getLoginStatus(function (data) {
                            if (data.authResponse && data.status == 'connected') {
                                // User logged in to Facebook. Attempt login to API.
                                dataService.user.loginOAuth(configService.authProviders.facebook.spotAuthType, data.authResponse.accessToken)
                                    .then(function (data) {
                                        if (!data.Failed) {
                                            // Login successful. Set session and load customer.
                                            apiConfig.setSessionId(data.ReturnObject.SessionID);
                                            CustomerConnect.Config.SessionId = data.ReturnObject.SessionID;
                                            ctrl.onLogin();
                                        } else {
                                            // Login failed due to invalid token or user account is not associated to Facebook account.
                                            dialogs.error('Login Failed', data.Message);
                                            configService.authProviders.facebook.signout();
                                        }
                                    });
                            }
                        });
                    }
                });
            };

            this.onSuccess = function () {
                if (userService.getCustomer()) {
                    this.associate();
                } else {
                    this.login();
                }
            };

            this.associate = function () {
                FB.login(function (response) {
                    if (response.status === 'connected') {
                        ctrl.authorize(response);
                    } else {
                        dialogs.error('Unable to associate Facebook account.');
                    }
                }, { scope: 'public_profile,email' });
            };

            // When unlinked, remove from customer/app.
            this.unlink = function () {
                // Unlink from Facebook.
                configService.authProviders.facebook.unlink().then(function () {
                    // Remove from SPOT API.
                    dataService.user.removeAuthProvider(configService.authProviders.facebook.spotAuthType)
                        .then(function (data) {
                            $state.reload();
                        });
                });
            };
        },
        template: [
            '<div class="btn btn-block btn-social btn-facebook" ng-if="$ctrl.configService.authProviders.facebook.enabled">',
                '<span class="fa fa-facebook"></span>',
                '<label ng-if="!$ctrl.signedIn" ng-click="$ctrl.onSuccess($ctrl.signedIn);">Login with Facebook</label>',
                '<label ng-if="$ctrl.signedIn">Logged in with Facebook</label>',
                '<label class="social-right" ng-if="$ctrl.signedIn" ng-click="$ctrl.unlink();">Unlink</label>',
            '</div>'
        ].join('')
    });
})();