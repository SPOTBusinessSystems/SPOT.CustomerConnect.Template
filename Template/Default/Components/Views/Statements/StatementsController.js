(function () {
    'use strict';

    angular
    .module('app')
    .controller('StatementsController', StatementsController);

    StatementsController.$inject = ['$scope', 'dialogs', 'blockUI', '$filter', 'settingsService', 'userService', 'dataService', '$ocLazyLoad'];

    function StatementsController($scope, dialogs, blockUI, $filter, settingsService, userService, dataService, $ocLazyLoad) {
        /* jshint validthis:true */
        var vm = this;
        vm.title = 'StatementsController';

        activate();

        function activate() {
            $scope.filteredStatements = [];
            $scope.Statements = [];
            $scope.itemsPerPage = 5;
            $scope.currentPage = 1;

            $scope.numPages = function () {
                return Math.ceil($scope.Statements.length / $scope.numPerPage);
            };

            $scope.figureOutStatementsToDisplay = function () {
                var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
                var end = begin + $scope.itemsPerPage;
                $scope.filteredStatements = [];
                if ($scope.Statements) {
                    $scope.filteredStatements = $scope.Statements.slice(begin, end);
                }
            };

            $scope.pageChanged = function () {
                $scope.figureOutStatementsToDisplay();
            };

            $scope.LoadStatements = function () {
                dataService.ar.getAllStatements().then(function (data) {
                    if (!data.Failed) {
                        var orderBy = $filter('orderBy');
                        $scope.Statements = orderBy(data.ReturnObject, 'StatementDate', true);
                        $scope.figureOutStatementsToDisplay();
                    } else {
                        dialogs.error('Load failed.', data.Message);
                        $scope.filteredStatements = [];
                    }
                });
            };

            $scope.ShowStatement = function (key) {
                $scope.key = key;
                var p = $ocLazyLoad.load(settingsService.path + 'Components/Dialogs/StatementController.js');
                p.then(function () {
                    var dlg = dialogs.create(settingsService.path + 'Components/Dialogs/Statement.html', 'StatementController', $scope.key, 'lg');
                });
            };

            $scope.init = function () {
                $scope.LoadStatements();
            };

            $scope.init();
        };
    };
})();