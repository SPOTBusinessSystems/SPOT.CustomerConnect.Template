/// <reference path="../../../Scripts/typings/angularjs/angular.d.ts" />

angular.module("app")
    .service("apiSettings", DataService.Settings);

module DataService {
    "use strict";

    class DataServiceBase {
        static $inject = ["$http", "$q", "apiConfig"];
        private http: ng.IHttpService;
        private config: ng.IRequestShortcutConfig;
        private apiConfig: ApiConfig;

        constructor($http: ng.IHttpService, $q: any, apiConfig: ApiConfig) {
            var config: angular.IRequestShortcutConfig = {
                responseType: "json",
                headers: {
                    "Content-Type": "application/json"
                }
            };

            this.config = config;
            this.http = $http;
            this.apiConfig = apiConfig;
        }

        createRequest(requestType: string, body: any):any {
            return this.http.post(
                this.apiConfig.url,
                "{\"RequestType\":\"" + requestType +
                "\",\"AccountKey\":\"" + this.apiConfig.accountKey +
                "\",\"SessionID\":\"" + this.apiConfig.sessionId +
                "\",\"Body\":\"" + window.btoa(JSON.stringify(body)) +
                "\",\"UserAgent\":\"" + navigator.userAgent.toString() +
                "\"}",
                this.config
            );
        }
    }

    export class Settings extends DataServiceBase {
        constructor() {
            super(null, null, null);
        }

        getAllSettings():any {
            return super.createRequest("GetAllSettings", null);
        }
    }
}