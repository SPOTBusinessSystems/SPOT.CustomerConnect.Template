(function () {
    'use strict';

    angular.module('app').component('changePassword', {
        bindings: {
        },
        controller: function ($compile,$scope,dataService) {
            var ctrl = this;

            ctrl.data = { Password: '', PasswordConfirm: '', Valid: false, Done: false };

            this.$onInit = function () {
                // Watch services

                $scope.$watch('$ctrl.data.Done', function () {
                    console.log('changed');

                    if (swal.isVisible()) {
                        if (ctrl.data.Done) {
                            swal.enableConfirmButton();
                        } else {
                            swal.disableConfirmButton();
                        }
                    }
                });
            };

            ctrl.changePassword = function () {
                swal({
                    title: 'Change Password',
                    html: '<div class="model-body"><passwordindicator data="$ctrl.data"></passwordindicator></div>',
                    showCancelButton: true,
                    confirmButtonText: 'Save',
                    preConfirm: function (m) {
                        return new Promise(function (resolve, reject) {
                            // Data Service
                            dataService.user.changePassword(ctrl.data.Password).then(function (response) {
                                if (!response.Failed) {
                                    resolve();
                                } else {
                                    reject(response.Message);
                                }
                            });
                        });
                    }
                }).then(function (m) {
                    swal({
                        type: 'success',
                        title: 'Password Changed',
                        text: 'Your password has been changed.'
                    });
                }, function (m) {
                    if (m !== 'cancel') {
                        swal({
                            type: 'error',
                            title: 'Error',
                            text: m
                        });
                    }
                });

                swal.disableConfirmButton();

                $compile(angular.element('passwordindicator'))($scope.$new());
            };
        },
        template: [
            '<label class="btn btn-success" ng-click="$ctrl.changePassword()">Change Password</label>'
        ].join('')
    });
})();