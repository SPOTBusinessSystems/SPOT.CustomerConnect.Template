﻿(function () {
    'use strict';

    angular
    .module('app')
    .controller('DialogController', DialogController);

    DialogController.$inject = ['$scope', '$uibModalInstance','data', 'configService'];

    function DialogController($scope, $uibModalInstance, data, configService) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'DialogController';

        activate();

        function activate() {
            $scope.data = data;
            $scope.opened = false;

            $scope.open = function ($event) {
                $event.preventDefault();
                $event.stopPropagation();
                $scope.opened = true;
            }; // end open

            $scope.done = function () {
                $uibModalInstance.close($scope.data);
            }; // end done

            $scope.cancel = function () {
                $uibModalInstance.close();
            };

            $scope.print = function () {
                var printContents = document.getElementsByClassName('modal-body')[0].innerHTML;
                if (printContents != null) {
                    var popupWin = window.open('', '_blank', '');
                    popupWin.document.open()
                    popupWin.document.write('<html><head><link rel="stylesheet" type="text/css" media="print" href="' + configService.getCSSPath() + '" /></head><body onload="window.print(); window.close();">' + printContents + '</html>');
                    popupWin.document.close();
                }
            };

            $scope.email = function () {

            };
        }
    }
})();