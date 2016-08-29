(function() {
    'use strict';

    angular
        .module('app')
        .service('configService', configService)
        .service('userService', userService)
        .service('dataService', dataService)
        .service('apiConfig', apiConfig);

    
    userService.$inject = [];
    apiConfig.$inject = [];
    dataService.$inject = ['$http', '$q', 'apiConfig'];
    configService.$inject = ['dataService','$q'];

    function apiConfig() {
        this.setURL = function (url) {
            this.url = url;
        };

        this.getURL = function () {
            return this.url;
        };

        this.setSessionId = function (sessionId) {
            this.sessionId = sessionId;
        };

        this.getSessionId = function () {
            return this.sessionId;
        };

        this.setAccountKey = function (accountKey) {
            this.accountKey = accountKey;
        };

        this.getAccountKey = function () {
            return this.accountKey;
        };

        this.setPublishableId = function (publishableId) {
            this.publishableId = publishableId;
        };

        this.getPublishableId = function () {
            return this.publishableId;
        };

        this.getFileResourceUrl = function (fileName) {
            return this.getURL().replace('/q', '/g') + '?Id=' + this.getPublishableId() + '&Action=GetFileResource&Name=' + fileName;
        };
    }

    function configService(dataService, $q) {
        var parent = this;

        this.authProviders = {
            // Setup
            setup: function () {
                var deferred = $q.defer();

                parent.authProviders.google.init().then(function () {
                    parent.authProviders.facebook.init();
                    deferred.resolve();
                });

                return deferred.promise;
            },

            anyEnabled: function () {
                return parent.authProviders.facebook.enabled || parent.authProviders.google.enabled;
            },

            facebook: {
                enabled: false,
                appId: "",
                spotAuthType: "facebook",

                init: function () {
                    console.log('facebook init');
                    if (parent.getProfile() !== null) {
                        var g = parent.getProfile().General['Authentication Providers'].Facebook;

                        if (g !== null) {
                            if (g.Enabled === "1") {
                                if (g.AppID.length > 0 && typeof(FB) !== "undefined") {
                                    this.enabled = true;
                                    this.appId = g.AppID;

                                    // Facebook API
                                    try
                                    {
                                        FB.init({
                                            appId: g.AppID,
                                            status: true,
                                            cookie: true,
                                            xfbml: true,
                                            version: 'v2.5'
                                        });

                                        console.log('Facebook set up.');
                                    }
                                    catch(err)
                                    {
                                        this.enabled = false;
                                        console.log('Unable to initialize Facebook SDK.');
                                    }
                                } else {
                                    console.log("AuthProvider Error: Facebook is enabled but AppID is not set. Leaving it disabled.");
                                }
                            }
                        }
                    }
                },

                isSignedIn: function () {
                    var deferred = $q.defer();

                    FB.getLoginStatus(function (data) {
                        if (data.authResponse && data.status === 'connected') {
                            deferred.resolve(true);
                        } else {
                            deferred.resolve(false);
                        }
                    });

                    return deferred.promise;
                },

                retrieveStatus: function () {
                    FB.getLoginStatus(function (data) {
                        return data;
                    });
                },

                signin: function () {
                    var deferred = $q.defer();

                    FB.login(function (response) {
                        if (response.authResponse) {
                            deferred.resolve();
                        } else {
                            return false;
                        }
                    });

                    return deferred.promise;
                },

                signout: function () {
                    var deferred = $q.defer();

                    FB.logout(function (data) {
                        deferred.resolve();
                    });

                    return deferred.promise;
                },

                unlink: function () {
                    var deferred = $q.defer();

                    FB.api('/me/permissions', 'DELETE', function (response) {
                        if (response.success === true) {
                            // Re-initialize FB API.
                            parent.authProviders.facebook.init();
                            deferred.resolve();
                        } else {
                            deferred.reject();
                        }
                    });

                    return deferred.promise;
                }
            },

            // Google Start
            google: {
                enabled: false,
                clientid: "",
                spotAuthType: "googleoauthv2",
                theme: "light",

                init: function () {
                    var deferred = $q.defer();

                    console.log('in google init');
                    if (parent.getProfile() !== null) {
                        // Start Google
                        var g = parent.getProfile().General['Authentication Providers'].Google;

                        if (g !== null) {
                            if (g.Enabled === "1") {
                                if (g.ClientID.length > 0 && typeof(gapi) !== "undefined") {
                                    this.enabled = true;
                                    this.clientid = g.ClientID;

                                    try
                                    {
                                        // Google API
                                        gapi.load('auth2', function () {
                                            gapi.auth2.init({
                                                client_id: g.ClientID
                                            });
                                        });

                                        console.log('Google set up.');
                                    }
                                    catch(err)
                                    {
                                        this.enabled = false;
                                        console.log('Google SDK failed to initialize.');
                                    }
                                    deferred.resolve();
                                } else {
                                    console.log("AuthProvider Error: Google is enabled but ClientID is not set. Leaving it disabled.");
                                    deferred.resolve();
                                }
                            } else {
                                deferred.resolve();
                            }
                        } else {
                            deferred.resolve();
                        }
                    } else {
                        deferred.resolve();
                    }

                    return deferred.promise;
                },

                isSignedIn: function () {
                    if (gapi.auth2) {
                        var x = gapi.auth2.getAuthInstance();

                        if (x !== null) {
                            return x.isSignedIn.get();
                        }
                    }

                    return false;
                },

                retrieveUserId: function () {
                    var x = gapi.auth2.getAuthInstance();

                    // Is not signed in, no user id.
                    if (!this.isSignedIn) {
                        return "";
                    }

                    if (x !== null) {
                        return x.currentUser.get().El;
                    }
                },

                signin: function () {
                    var deferred = $q.defer();
                    var x = gapi.auth2.getAuthInstance();


                    if (x !== null) {
                        x.signIn({ 'scope': 'profile email' })
                            .then(function (data) {
                                if (data) {
                                    if (data.El && data.El.length > 0) {
                                        deferred.resolve(data);
                                    }
                                }

                                deferred.reject();
                            });
                    }

                    return deferred.promise;
                },

                signout: function () {
                    var x = gapi.auth2.getAuthInstance();

                    if (x !== null) {
                        return x.signOut();
                    }
                },

                unlink: function () {
                    var x = gapi.auth2.getAuthInstance();

                    if (x !== null) {
                        x.disconnect();
                    }
                }
            }
            // Google End
        };

        this.setProfile = function (profile) {
            this.profile = profile;
        };

        this.getProfile = function () {
            return this.profile;
        };

        this.setCSSPath = function (path) {
            this.CSSPath = path;
        };

        this.getCSSPath = function (path) {
            return this.CSSPath;
        };

        this.init = function (init) {
            this.initialized = init;
        };

        this.isInitialized = function () {
            return this.initialized;
        };
    }
    
    function userService() {
        this.setEmail = function (email) {
            this.email = email;
        };

        this.getEmail = function () {
            return this.email;
        };

        this.setCaptchaValid = function (captchaValid) {
            this.captchaValid = captchaValid;
        };

        this.getCaptchaValid = function () {
            return this.captchaValid;
        };

        this.setPassword = function (password) {
            this.password = password;
        };

        this.getPassword = function () {
            return this.password;
        };

        this.setCustomer = function (customer) {
            this.customer = customer;
        };

        this.getCustomer = function () {
            return this.customer;
        };
        
        this.setMessages = function (messages) {
            this.messages = messages;
        };

        this.getMessages = function () {
            return this.messages;
        };

        this.unreadMessageCount = function () {
            var count = null;

            if (!this.messages) {
                return 0;
            }

            for (var x = 0; x < this.messages.length; x++) {
                if (this.messages[x].ReadDateTime === null) {
                    count += 1;
                }
            }

            return count;
        };
    }

    function dataService($http, $q, apiConfig) {
        // AR
        var ar = {
            getARBalance: function () {
                return createRequest('ARBalance', null).then(handleSuccess, handleError);
            },

            getARActivity: function () {
                return createRequest('ARCurrentActivity', null).then(handleSuccess, handleError);
            },

            getPayments: function () {
                return createRequest('ARPaymentsDetail', null).then(handleSuccess, handleError);
            },

            getStatement: function (statementId) {
                return createRequest('ARStatementDetail', { statementId: statementId }).then(handleSuccess, handleError);
            },

            getAllStatements: function () {
                return createRequest('ARStatementsList', null).then(handleSuccess, handleError);
            },

            savePayment: function (cardOnFileId, cardNo, cardExp, addCardToAccount, amount) {
                return createRequest('SavePayment', {
                    cardOnFileId: cardOnFileId, cardNo: cardNo,
                    cardExp: cardExp, addCardToAccount: addCardToAccount, amount: amount
                }).then(handleSuccess, handleError);
            }
        };

        // Customer
        var customer = {
            convertToDelivery: function () {
                return createRequest('ConvertToDelivery', null).then(handleSuccess, handleError);
            },

            getCustomer: function () {
                return createRequest('CustomerDetail', null).then(handleSuccess, handleError);
            },

            getCustomerNotificationsById: function (id) {
                return createRequest('RetrieveCustomerNotificationsById', { id: id }).then(handleSuccess, handleError);
            },

            getGiftCards: function () {
                return createRequest('RetrieveGiftCards', null).then(handleSuccess, handleError);
            },

            issueAward: function (award) {
                return createRequest('IssueAward', { awardId: award }).then(handleSuccess, handleError);
            },

            notifyPickup: function (storeId, timeRequested) {
                return createRequest('NotifyPickup', { storeId: storeId, timeRequested: timeRequested }).then(handleSuccess, handleError);
            },

            redeemGiftCard: function (giftCardNumber) {
                return createRequest('GiftCardRedeem', { Number: giftCardNumber }).then(handleSuccess, handleError);
            },

            retrieveGiftCardBalance: function () {
                return createRequest('GiftCardBalance', { giftCardNumber: giftCardNumber }).then(handleSuccess, handleError);
            },

            retrieveReferralInfo: function (id) {
                return createRequest('RetrieveReferralInfo', {id: id}).then(handleSuccess, handleError);
            },

            saveCustomer: function (body) {
                return createRequest('SaveCustomer', body).then(handleSuccess, handleError);
            },

            saveCustomerNotificationsById: function (body) {
                return createRequest('SaveCustomerNotificationsById', body).then(handleSuccess, handleError);
            },

            signupCustomer: function (body) {
                return createRequest('Signup', body).then(handleSuccess, handleError);
            }
        };

        // Invoice
        var invoice = {
            getInvoiceDetails: function (invoiceId) {
                return createRequest('InvoiceDetail', { invoiceId: invoiceId }).then(handleSuccess, handleError);
            },

            getInvoiceList: function (filterTypeId, startDate, endDate) {
                return createRequest('InvoicesList', { filterTypeId: filterTypeId, startDate: startDate, endDate: endDate }).then(handleSuccess, handleError);
            },

            getInvoiceListGarment: function (garmentDesc, descriptor) {
                return createRequest('InvoicesByGarment', { garmentDesc: garmentDesc, descriptor: descriptor }).then(handleSuccess, handleError);
            }
        };

        // Route
        var route = {
            getRouteDeliveryZones: function () {
                return createRequest('GetDeliveryZones', null).then(handleSuccess, handleError);
            },

            getPendingCancellations: function () {
                return createRequest('PendingCancellations', null).then(handleSuccess, handleError);
            },

            getPendingPickups: function () {
                return createRequest('PendingPickups', null).then(handleSuccess, handleError);
            },

            saveCancellation: function (cancellation) {
                return createRequest('CancellationRequest', cancellation).then(handleSuccess, handleError);
            },

            savePickup: function (pickup) {
                return createRequest('PickupRequest', pickup).then(handleSuccess, handleError);
            }
        };

        // Settings
        var settings = {
            getNotifications: function () {
                return createRequest('GetNotifications', null).then(handleSuccess, handleError);
            },

            getPreferences: function () {
                return createRequest('GetPreferences', null).then(handleSuccess, handleError);
            },

            getSettings: function () {
                return createRequest('GetSettings', null).then(handleSuccess, handleError);
            },

            getStates: function () {
                return createRequest('GetStates', null).then(handleSuccess, handleError);
            },

            getTimeSlots: function () {
                return createRequest('GetTimeSlots', null).then(handleSuccess, handleError);
            },

            storeJSON: function (name, json) {
                return createRequest('StoreJSON', { name: name, json: json }).then(handleSuccess, handleError);
            },

            retrieveJSON: function (name) {
                return createRequest('RetrieveJSON', { name: name }).then(handleSuccess, handleError);
            },

            validateCaptcha: function (response) {
                return createRequest('ValidateCaptcha', { response: response }).then(handleSuccess, handleError);
            }
        };

        // Store
        var store = {
            getStoreList: function () {
                return createRequest('StoreList', null).then(handleSuccess, handleError);
            }
        };

        // User
        var user = {
            changePassword: function (password) {
                return createRequest('ChangePassword', { newPassword: password }).then(handleSuccess, handleError);
            },

            loginOAuth: function (provider, token) {
                return createRequest('Login', { authProvider: provider, authToken: token }).then(handleSuccess, handleError);
            },

            login: function (emailAddress, password) {
                return createRequest('Login', { user: emailAddress, password: password }).then(handleSuccess, handleError);
            },

            logout: function () {
                return createRequest('Logoff', null).then(handleSuccess, handleError);
            },

            passwordReminder: function (requestInfo) {
                return createRequest('RememberPasswordRequest', requestInfo).then(handleSuccess, handleError);
            },

            finishPasswordReminder: function (requestInfo) {
                return createRequest('RememberPasswordFinish', requestInfo).then(handleSuccess, handleError);
            },

            sendMessage: function (subject, body, invoiceid) {
                return createRequest('MessageToManagerNoUser', { subject: subject, message: body, invoiceid: invoiceid }).then(handleSuccess, handleError);
            },

            getMessages: function () {
                return createRequest('GetMessages', null).then(handleSuccess, handleError);
            },

            readMessage: function (messageId) {
                return createRequest('ReadMessage', { messageId: messageId }).then(handleSuccess, handleError);
            },

            deleteMessage: function (messageId) {
                return createRequest('DeleteMessage', { messageId: messageId }).then(handleSuccess, handleError);
            },

            updateAuthProvider: function (authType, userId, authToken) {
                return createRequest('UpdateAuthProvider', { authProvider: authType, userId: userId, authToken: authToken }).then(handleSuccess, handleError);
            },

            removeAuthProvider: function (authType) {
                return createRequest('RemoveAuthProvider', { authProvider: authType }).then(handleSuccess, handleError);
            }

        };

        // Util
        var util = {
            getFileResource: function (fileName) {
                return getFileResource(fileName).then(handleSuccess, handleError);
            }
        };

        // Dependency
        return {
            ar: ar,
            customer: customer,
            invoice: invoice,
            route: route,
            settings: settings,
            store: store,
            user: user,
            util: util
        };

        function createRequest(requestType, body) {
            return $http({
                method: 'post',
                url: apiConfig.getURL(),
                data: '{"RequestType":"' + requestType + '","AccountKey":"' + apiConfig.getAccountKey() + '","SessionID":"' + apiConfig.getSessionId() + '","Body":"' + CustomerConnect.Util.base64._encode(JSON.stringify(body)) + '","UserAgent":"' + navigator.userAgent.toString() + '"}',
                async: true,
                contentType: "application/json",
                dataType: "json",
                headers: {'Content-Type': null}
            });
        }

        function getFileResource(fileName) {
            return $http({
                method: 'get',
                url: apiConfig.getFileResourceUrl(fileName),
                async: true
            });
        }

        // I transform the error response, unwrapping the application dta from
        // the API response payload.
        function handleError(response) {
            return response.data;
            // The API response from the server should be returned in a
            // nomralized format. However, if the request was not handled by the
            // server (or what not handles properly - ex. server error), then we
            // may have to normalize it on our end, as best we can.
            //if (!angular.isObject(response.data) || !response.data.message) {
            //    return ($q.reject("An unknown error occurred."));
            //}
            // Otherwise, use expected error message.
            //return ($q.reject(response.data));
        }
        // I transform the successful response, unwrapping the application data
        // from the API response payload.
        function handleSuccess(response) {
            return response.data;
        }
    }
})();