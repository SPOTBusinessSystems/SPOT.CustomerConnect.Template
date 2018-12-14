'use strict';
var app = angular.module('app', []);

app.controller('postBackController', postBackController);

postBackController.$inject = ['$scope', 'dataService', '$window'];

function postBackController($scope, dataService, $window) {

    $scope.Content = { html: "Loading...", error: null, errorDetail: null };

    var q = $window.location.hash.replace('#/postback', '');

    dataService.route.getTransactionConfirmationContent(q).then(function (d) {
        if (!d) {
            $scope.Content.html = null;
            $scope.Content.error = "Request Failed";
            return;
        }

        if (d.Failed) {
            $scope.Content.html = null;
            $scope.Content.error = "Unable to process request";
            $scope.Content.errorDetails = d.Message;
        } else {
            $scope.Content.html = d.Message;
        }
    });
};


