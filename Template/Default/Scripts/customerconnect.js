var CustomerConnect = {
    // Public - Configuration
    Config: {
        AccountKey: null,
        SessionId: null,
        CustomerName: null,
        URL: null,
        Settings: null,
        ReminderURL: null
    },

    // Request Functions and Objects
    Request: {
    },

    // AR Functions and Objects
    AR: {
    },

    // Customer functions and objects
    Customer: {
    },

    //Invoice Functions and Objects
    Invoice: {
    },

    // Route Pickup/Cancellation Functions and Objects
    Route: {
    },

    // Settings
    Settings: {
    },

    // Store functions and objects
    Store: {
    },

    //User Functions and Objects
    User: {
    },

    // Util functions
    Util: {

        // Private - Encode Base64.
        base64: {
            _PADCHAR: "=",
            _ALPHA: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
            _VERSION: "1.0",

            _getbyte64: function (s, i) {
                var idx = this._ALPHA.indexOf(s.charAt(i));
                if (idx === -1) {
                    throw "Cannot decode base64";
                }
                return idx;
            },

            _decode: function (s) {
                var pads = 0, i, b10,
                    imax = s.length,
                    x = [];
                s = String(s);
                if (imax === 0) {
                    return s;
                }
                if (imax % 4 !== 0) {
                    throw "Cannot decode base64";
                }
                if (s.charAt(imax - 1) === this._PADCHAR) {
                    pads = 1;
                    if (s.charAt(imax - 2) === this._PADCHAR) {
                        pads = 2;
                    }
                    imax -= 4;
                }
                for (i = 0; i < imax; i += 4) {
                    b10 = (this._getbyte64(s, i) << 18) | (this._getbyte64(s, i + 1) << 12) | (this._getbyte64(s, i + 2) << 6) | this._getbyte64(s, i + 3);
                    x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 255, b10 & 255));
                }
                switch (pads) {
                    case 1: b10 = (this._getbyte64(s, i) << 18) | (this._getbyte64(s, i + 1) << 12) | (this._getbyte64(s, i + 2) << 6); x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 255)); break;
                    case 2: b10 = (this._getbyte64(s, i) << 18) | (this._getbyte64(s, i + 1) << 12); x.push(String.fromCharCode(b10 >> 16)); break;
                }
                return x.join("");
            },

            _getbyte: function (s, i) {
                var x = s.charCodeAt(i);
                if (x > 255) {
                    throw "INVALID_CHARACTER_ERR: DOM Exception 5";
                }
                return x;
            },

            _encode: function (s) {
                if (arguments.length !== 1) {
                    throw "SyntaxError: exactly one argument required";
                }
                s = String(s);
                var i, b10, x = [], imax = s.length - s.length % 3;
                if (s.length === 0) {
                    return s;
                }
                for (i = 0; i < imax; i += 3) {
                    b10 = (this._getbyte(s, i) << 16) | (this._getbyte(s, i + 1) << 8) | this._getbyte(s, i + 2);
                    x.push(this._ALPHA.charAt(b10 >> 18));
                    x.push(this._ALPHA.charAt((b10 >> 12) & 63));
                    x.push(this._ALPHA.charAt((b10 >> 6) & 63));
                    x.push(this._ALPHA.charAt(b10 & 63));
                }
                switch (s.length - imax) {
                    case 1: b10 = this._getbyte(s, i) << 16; x.push(this._ALPHA.charAt(b10 >> 18) + this._ALPHA.charAt((b10 >> 12) & 63) + this._PADCHAR + this._PADCHAR); break;
                    case 2: b10 = (this._getbyte(s, i) << 16) | (this._getbyte(s, i + 1) << 8); x.push(this._ALPHA.charAt(b10 >> 18) + this._ALPHA.charAt((b10 >> 12) & 63) + this._ALPHA.charAt((b10 >> 6) & 63) + this._PADCHAR); break;
                }
                return x.join("");
            }
        },

        Validate: {
            CCExpiration: function (s) {
                if (/^[0-9]{2}[//][0-9]{2}$/.test(s)) {

                    var d = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
                    var expDate = new Date(Number(s.split('/')[1]) + 2000, Number(s.split('/')[0]), 1);

                    if (expDate >= d)
                        return true;
                }
                return false;
            },

            CCNumber: function (s, creditCardSettings) {

                var ca, sum = 0, mul = 1;
                var len = s.length;
                while (len--) {
                    ca = parseInt(s.charAt(len), 10) * mul;
                    sum += ca - (ca > 9) * 9;
                    mul ^= 3;
                }

                if (!((sum % 10 === 0) && (sum > 0)))
                    return false;

                return CustomerConnect.Util.Validate.CCType(s, creditCardSettings);
            },

            CCType: function (s, creditCardSettings) {

                if (!creditCardSettings || !creditCardSettings.CardTypesAllowed || !creditCardSettings.CardTypesAllowed.length)
                    return true;

                var t = CustomerConnect.Util.Validate.GetCCType(s);
                var name = CustomerConnect.Util.Validate.GetCCTypeName(t).toUpperCase();

                return creditCardSettings.CardTypesAllowed.includes(name);
            },

            EmailAddress: function (s) {
                return /^[A-Za-z0-9\._%+-]+@[A-Za-z0-9\.-]+\.[A-Za-z]{2,}/.test(s);
            },

            GetCCTypeName: function (typeAbbr) {
                switch (typeAbbr) {
                    case 'AMEX': return 'American Express';
                    case 'MC': return 'MasterCard';
                    case 'VISA': return 'Visa';
                    case 'DNRS': return 'Diners Club';
                    case 'DISC': return 'Discover';

                    case 'JCB': return 'JCB';
                    case 'CART': return 'Carte Blanche';
                    case 'SOLO': return 'Solo';
                    case 'SWTC': return 'Switch';
                    case 'MAES': return 'Maestro';
                    case 'UNKN': return 'Unknown';

                    default: return typeAbbr;
                }
            },

            GetCCType: function (s) {
                var cc = (s + '').replace(/\s/g, ''); //remove space

                if ((/^(34|37)/).test(cc) && cc.length == 15) {
                    return 'AMEX'; //AMEX begins with 34 or 37, and length is 15.
                } else if ((/^(51|52|53|54|55)/).test(cc) && cc.length == 16) {
                    return 'MC'; //MasterCard beigins with 51-55, and length is 16.
                } else if ((/^(4)/).test(cc) && (cc.length == 13 || cc.length == 16)) {
                    return 'VISA'; //VISA begins with 4, and length is 13 or 16.
                } else if ((/^(300|301|302|303|304|305|36|38)/).test(cc) && cc.length == 14) {
                    return 'DNRS'; //Diners Club begins with 300-305 or 36 or 38, and length is 14.
                } else if ((/^(6011)/).test(cc) && cc.length == 16) {
                    return 'DISC'; //Discover begins with 6011, and length is 16.
                } else if ((/^(3)/).test(cc) && cc.length == 16) {
                    return 'JCB';  //JCB begins with 3, and length is 16.
                } else if ((/^(2131|1800)/).test(cc) && cc.length == 15) {
                    return 'JCB';  //JCB begins with 2131 or 1800, and length is 15.
                } else if ((/^(300|301|302|303|304|305|36|38)/).test(cc) && cc.length == 14) {
                    return 'CART'; //Cart Blanche begins with 300-305 or 36 or 38 and length of 14.
                } else if ((/^(6334|6767)/).test(cc) && (cc.length == 16 || cc.length == 18 || cc.length == 19)) {
                    return 'SOLO'; //Solo begins with 6334 or 6767 and length is 16, 18, or 19.
                } else if ((/^(4903|4905|4911|4936|564182|633110|633|6759)/).test(cc) && (cc.length == 16 || cc.length == 18 || cc.length == 19)) {
                    return 'SWTC'; //Switch begins with 4903, 4905, 4911, 4936, 564182, 633110, 6333, 6759 and length is 16, 18, or 19.
                } else if ((/^(5020|6)/).test(cc) && (cc.length == 16 || cc.length == 18)) {
                    return 'MAES'; //Maestro begins with 5020 or 6 and length is 16 or 18.
                }
                return 'UNKN'; //unknown type
            },

            Password: function (s) {
                if (!/^.{6,30}$/.test(s) || !/[A-Z]/.test(s) || !/[0-9]/.test(s) || !/[a-z]/.test(s)) {
                    return false;
                } else {
                    return true;
                }
            },

            Phone10: function (s) {
                var p = (s + '').replace(/[^\d]/g, '');
                return /^[\d]{10}$/.test(p);
            }
        }
    }
};