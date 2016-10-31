/// <reference path="../../../typings/index.d.ts" />
/// <reference path="../../../Source/Default/Components/index.d.ts" />

module Init {
    "use strict";

    angular.module("app", [
        "ui.router",
        "ngTouch",
        "ngAnimate",
        "ui.bootstrap",
        "dialogs.main",
        "mgo-angular-wizard",
        "blockUI",
        "LocalStorageModule",
        "tmh.dynamicLocale",
        "ui.mask",
        "vcRecaptcha",
        "ngMaterial",
        "ngMessages",
        "ngAria"
    ]);

    export var getModule: () => ng.IModule = () => {
        return angular.module("app");
    };
}