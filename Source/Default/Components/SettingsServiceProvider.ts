/// <reference path="../../../typings/index.d.ts" />
/// <reference path="../../../Source/Default/Components/index.d.ts" />

module Settings {
    "use strict";

    export interface ISettingsServiceProvider extends ng.IServiceProvider {
        setPath(path: string): void;
        getPath(): string;
    }

    export class SettingsServiceProvider implements ISettingsServiceProvider {
        private path = "";

        public setPath(path: string): void {
            this.path = path;
        }

        public getPath(): string {
            return this.path;
        }

        public $get(): any {
            return {
                getPath: (): string => { return this.path; }
            };
        }
    }

    Init.getModule().provider("settingsService", SettingsServiceProvider);
}