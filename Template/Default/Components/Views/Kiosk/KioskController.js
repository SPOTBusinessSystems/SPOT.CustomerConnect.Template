(function () {
    'use strict';

    angular
    .module('app')
    .controller('KioskController', KioskController);

    KioskController.$inject = ['$scope','dialogs','userService'];

    function KioskController($scope, dialogs, userService) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'KioskController';

        activate();

        function activate() {
            $scope.Customer = userService.getCustomer();
        }
    };
})();