(function () {
    'use strict';

    angular
        .module('app')
        .directive('passwordindicator', passwordindicator);

    passwordindicator.$inject = ['$window', 'settingsService'];

    function passwordindicator($window, settingsService) {
        // Usage:
        //     <passwordindicator></passwordindicator>
        // Creates:
        // 
        var directive = {
            controller: controller,
            link: link,
            restrict: 'EA',
            replace: true,
            scope: {
                data: '='
            },
            templateUrl: settingsService.path + 'Components/Shared/PasswordIndicator/PasswordIndicatorView.html'
        };
        return directive;

        function link(scope, iElement, iAttrs, ctrl, data) {

            if (typeof (data) == 'undefined') {
                scope.data = { Password: '', Valid: false, Done: false };
            }

            scope.$watch('data.Password', function () {
                scope.setInit();
                scope.getPasswordStrength(scope.data.Password);
                scope.getCSSClass();
                scope.data.Valid = scope.isValid(scope.data.Password);
                scope.data.Done = scope.data.Valid && (scope.data.Password == scope.data.PasswordConfirm);
            });

            scope.$watch('data.PasswordConfirm', function () {
                scope.data.Done = scope.data.Valid && (scope.data.Password == scope.data.PasswordConfirm);
            });
        }

        function controller($scope, userService) {
            $scope.setInit = function () {
                if (userService.getPassword() != '') {
                    $scope.data.Password = userService.getPassword();
                    userService.setPassword('');
                }
            };

            $scope.getStrength = function (pass) {
                var score = 0;

                if (!pass)
                    return score;

                // award every unique letter until 5 repetitions
                var letters = new Object();
                for (var i = 0; i < pass.length; i++) {
                    letters[pass[i]] = (letters[pass[i]] || 0) + 1;
                    score += 5.0 / letters[pass[i]];
                }

                // bonus points for mixing it up
                var variations = {
                    digits: /\d/.test(pass),
                    lower: /[a-z]/.test(pass),
                    upper: /[A-Z]/.test(pass),
                    nonWords: /\W/.test(pass),
                }

                var variationCount = 0;
                for (var check in variations) {
                    variationCount += (variations[check] == true) ? 1 : 0;
                }
                score += (variationCount - 1) * 10;

                if (score > 100) score = 100;

                if (!CustomerConnect.Util.Validate.Password($scope.data.Password) && score >= 40) score = 39;

                return parseInt(score);
            };

            $scope.isPasswordWeak = function () {
                return $scope.passwordStrength < 40;
            };

            $scope.isPasswordStrong = function () {
                return $scope.passwordStrength > 70 && CustomerConnect.Util.Validate.Password($scope.data.Password);
            };

            $scope.isPasswordOk = function () {
                return $scope.passwordStrength >= 40 && $scope.passwordStrength <= 70 && CustomerConnect.Util.Validate.Password($scope.data.Password);
            };

            $scope.getPasswordStrength = function (password) {
                $scope.passwordStrength = $scope.getStrength(password);
            };

            $scope.getCSSClass = function () {
                if ($scope.isPasswordStrong()) {
                    $scope.cssClass = 'success';
                } else if ($scope.isPasswordOk()) {
                    $scope.cssClass = 'warning';
                } else {
                    $scope.cssClass = 'danger';
                }
            };

            $scope.isValid = function () {
                return $scope.passwordStrength >= 40 && CustomerConnect.Util.Validate.Password($scope.data.Password);
            };
        }
    }
})();