/// <reference path="../../../typings/index.d.ts" />
/// <reference path="../../../Source/Default/Components/index.d.ts" />

"use strict";

interface IUserService extends ng.IServiceProvider {
    setEmail(email: string): void;
    getEmail(): string;

    setCaptchaValid(captchaValid: boolean): void;
    getCaptchaValid(): boolean;

    setPassword(password: string): void;
    getPassword(): string;

    setCustomer(customer: any): void;
    getCustomer(): any;

    setMessages(messages: any): void;
    getMessages(): any;
    unreadMessageCount(): number;
}

class UserService implements IUserService {
    private email: string = "";
    private captchaValid: boolean = false;
    private password: string = "";
    private customer: any;
    private messages: any;

    public setEmail(email: string): void {
        this.email = email;
    };

    public getEmail(): string {
        return this.email;
    };

    public setCaptchaValid(captchaValid: boolean): void {
        this.captchaValid = captchaValid;
    };

    public getCaptchaValid(): boolean {
        return this.captchaValid;
    };

    public setPassword(password: string): void {
        this.password = password;
    };

    public getPassword(): string {
        return this.password;
    };

    public setCustomer(customer: any): void {
        this.customer = customer;
    };

    public getCustomer(): any {
        return this.customer;
    };

    public setMessages(messages: any): void {
        this.messages = messages;
    };

    public getMessages(): any {
        return this.messages;
    };

    public unreadMessageCount(): number {
        var count = null;

        if (!this.messages) {
            return 0;
        }

        for (var x = 0; x < this.messages.length; x++) {
            if (this.messages[x].ReadDateTime === null) {
                count += 1;
            }
        }

        return count;
    };

    public $get(): any {
        return {
        };
    }
}

Init.getModule().provider("userService", UserService);