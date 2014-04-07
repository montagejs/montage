/*global navigator*/
var Montage = require("montage").Montage;

var regExAppleWebKit = new RegExp(/AppleWebKit\/([\d.]+)/);

var Browser = Montage.specialize({
    constructor: {
        value: function Browser(userAgent) {
            this.super();
            this._userAgent = userAgent;
            this._analyze(userAgent);
        }
    },

    _analyze: {
        value: function (userAgent) {
            if (/*isAndroidMobile*/ userAgent.indexOf("Android") > -1 && userAgent.indexOf("Mozilla/5.0") > -1 && userAgent.indexOf("AppleWebKit") > -1) {
                this.android = {};
                var resultAppleWebKitRegEx = regExAppleWebKit.exec(userAgent);
                var appleWebKitVersion = (resultAppleWebKitRegEx === null ? null : parseFloat(regExAppleWebKit.exec(userAgent)[1]));
                this.android.androidBrowser = appleWebKitVersion !== null && appleWebKitVersion < 537;
            }
        }
    },

    _userAgent: {
        value: null
    }

});

var _browser = null;

Montage.defineProperties(exports, {

    browser: {
        get: function () {
            if(_browser === null) {
                _browser = new Browser(navigator.userAgent);
            }
            return _browser;
        }
    },

    Browser: {
        value: Browser
    }

});
