angular.module("app")
    .service("apiConfig", ApiConfig);

class ApiConfig {
    static $inject = [];

    url: string;
    sessionId: string;
    accountKey: string;
    publishableId: string;

    constructor(url: string) {
        this.url = url;
    }

    getFileResourceUrl(fileName: string): any {
        return this.url.replace("/q", "/g") + "?Id=" + + "&Action=GetFileResource & Name=" + fileName;
    }
}