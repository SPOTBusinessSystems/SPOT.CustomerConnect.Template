'use strict';
var app = angular.module('app', []);

app.controller('couponController', couponController);

couponController.$inject = ['$scope', 'dataService', '$window', '$stateParams', 'apiConfig'];

function couponController($scope, dataService, $window, $stateParams, apiConfig) {

    $scope.Content = { html: "Loading...", textMessage: "Loading..." };

    var p = $stateParams;


    function setImage(url, alt) {
        var img = document.createElement("img");
        img.setAttribute('src', url);
        if (alt)
            img.setAttribute('alt', alt);

        var container = document.getElementById('barcodeContainer');
        container.innerHTML = "";
        container.appendChild(img);
    }

    var root = apiConfig.getURL().replace('/q', '/g') + '?Id=' + apiConfig.getPublishableId() + '&Action=GetBarcode';

    if (p.barcode) {
        var url = root + '&barcode=' + p.barcode;
        if (p.w) url = url + '&w=' + p.w;
        if (p.h) url = url + '&h=' + p.h;

        setImage(url, p.barcode);
    } else if (p.qrcode) {

        var url = root + '&qrcode=' + p.qrcode;
        if (p.w) url = url + '&w=' + p.w;
        if (p.h) url = url + '&h=' + p.h;

        setImage(url, p.qrcode);
    }

    if (p.text)
        $scope.textMessage = p.text;


    $scope.Content.html = true;

};


