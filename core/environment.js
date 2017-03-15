var Montage = require("./core").Montage;

var TRIDENT = "trident",
    MSIE = "msie",
    UNKNOWN = "unknown",
    CRIOS = "crios",
    FXIOS = "fxios",
    CROS = "cros",
    OPR = "opr";

var Environment = exports.Environment = Montage.specialize({

    constructor: {
        value: function Environment (userAgent) {
            this.userAgent = userAgent ?  userAgent : global.navigator ? global.navigator.userAgent : '';
        }
    },

    _userAgent: {
        value: null
    },

    userAgent: {
        set: function (userAgent) {
            userAgent = userAgent.toLowerCase();

            if (userAgent !== this._userAgent) {
                this._userAgent = userAgent;
            }
        },
        get: function () {
            return this._userAgent;
        }
    },

    _device: {
        value: null
    },

    device: {
        get: function () {
            if (!this._device) {
                //todo: support more devices
               var match = this.userAgent.match(/iphone|ipod|ipad/i);

                if (match && match.length) {
                    this._device = match[0];

                } else {
                    this._device = UNKNOWN;
                }
            }

            return this._device;
        }
    },

    _supportsPointerEvents: {
        value: null
    },

    supportsPointerEvents: {
        get: function () {
            return typeof this._supportsPointerEvents !== "boolean" ?
                (this._supportsPointerEvents = !!(global.PointerEvent ||
                (global.MSPointerEvent && global.navigator.msPointerEnabled))) : this._supportsPointerEvents;
        }
    },

    _isIOSDevice: {
        value: null
    },

    isIOSDevice: {
        get: function () {
            return typeof this._isIOSDevice !== "boolean" ?
                (this._isIOSDevice = /iphone|ipad|ipod/.test(this.device)) : this._isIOSDevice;
        }
    },

    _isAndroidDevice: {
        value: null
    },

    isAndroidDevice: {
        get: function () {
            return typeof this._isAndroidDevice !== "boolean" ?
                (this._isAndroidDevice = this.platformName === Environment.Platform.ANDROID) : this._isAndroidDevice;
        }
    },

    isCordova: {
        value: !!global.cordova
    },

    _isMobileDevice: {
        value: null
    },

    isMobileDevice: {
        get: function () {
            // Android 4.4+ Chrome, Opera mobile 12+, Firefox 11.0+, Safari, IE (no tablet)
            return typeof this._isMobileDevice !== "boolean" ?
                (this._isMobileDevice = /mobile/gi.test(this.userAgent)) : this._isMobileDevice;
        }
    },

    isAndroidTablet: {
        get: function () {
            return this.isAndroidDevice && !this.isMobileDevice;
        }
    },

    _isStandalone: {
        value: null
    },

    isStandalone: {
        get: function () {
            return typeof this._isStandalone !== "boolean" ?
                (this._isStandalone = !!('standalone' in navigator && navigator.standalone)) : this._isStandalone;
        }
    },

    _platformName: {
        value: null
    },

    platformName: {
        get: function () {
            if (typeof this._platformName !== "string") {
                var match = this.userAgent.match(/android|windows\sphone|windows|macintosh|linux|cros/gi);

                if (match && match.length) {
                    var firstCandidate = match[0];

                    if (firstCandidate === Environment.Platform.LINUX && match[1] === Environment.Platform.ANDROID) {
                        firstCandidate = Environment.Platform.ANDROID;

                    } else if (firstCandidate === CROS) {
                        firstCandidate = Environment.Platform.CHROME_OS;
                    }

                    this._platformName = firstCandidate;

                } else if (this.isIOSDevice) {
                    this._platformName = Environment.Platform.IOS;

                } else {
                    this._platformName = UNKNOWN;
                }
            }

            return this._platformName;
        }
    },

    _browserVersion: {
        value: null
    },

    browserVersion: {
        get: function () {
            if (typeof this._browserVersion !== "string") {
                this._analyzeBrowser();
            }

            return this._browserVersion;
        }
    },

    _browserName: {
        value: null
    },

    browserName: {
        get: function () {
            if (typeof this._browserName !== "string") {
                this._analyzeBrowser();
            }

            return this._browserName;
        }
    },

    _isWKWebView: {
        value: null
    },

    isWKWebView: {
        get: function () {
            return typeof this._isWKWebView !== "boolean" ?
                (this._isWKWebView = this.isIOSDevice && !!global.indexedDB) : this._isWKWebView;
        }
    },

    _isUIWebView: {
        value: null
    },

    isUIWebView: {
        get: function () {
            return typeof this._isUIWebView !== "boolean" ?
                (this._isUIWebView = !this.isWKWebView) : this._isUIWebView;
        }
    },

    _analyzeBrowser: {
        value: function () {
            var userAgent = this.userAgent,
                browserName = '',
                browserVersion = '',
                match;

            if (userAgent.indexOf(OPR) > -1) {
                match = userAgent.match(/(opr(?=\/))\/?\s*([\d+\.?]+)/i);

            } else if (userAgent.indexOf(Environment.Browser.EDGE) > -1) {
                match = userAgent.match(/(edge(?=\/))\/?\s*([\d+\.?]+)/i);

            }  else {
                match = userAgent.match(/(opera|chrome|safari|firefox|msie|trident|crios|fxios(?=\/))\/?\s*([\d+\.?]+)/i);
            }

            if (match && match.length > 1) {
                browserName = match[1];

                if (browserName === Environment.Browser.SAFARI) {
                    // Support only safari 3.0+
                    browserVersion = userAgent.match(/version\/([\d+\.?]+)/i)[1];

                } else if (browserName === Environment.Browser.CHROME || browserName=== Environment.Browser.FIREFOX || browserName === FXIOS ||
                    browserName === MSIE || browserName === Environment.Browser.OPERA || browserName === CRIOS || browserName=== Environment.Browser.EDGE) {
                    // Support any version of Chrome or FF, Opera < 15 and some internet explorer user agents.
                    browserVersion = match[2];

                } else if (browserName === TRIDENT) {
                    match = /\brv[ :]+(\d+)/g.exec(userAgent);
                    browserVersion = match && match.length > 1 ? match[1] : '';
                }

                if (browserName === TRIDENT || browserName === MSIE) {
                    browserName = Environment.Browser.IE;

                } else if (browserName === OPR) {
                    // Opera 15+
                    browserName = Environment.Browser.OPERA;

                } else if (browserName === CRIOS) {
                    // Chrome IOS
                    browserName = Environment.Browser.CHROME;

                } else if (browserName === FXIOS) {
                    // FIREFOX IOS
                    browserName = Environment.Browser.FIREFOX;
                }
            }

            this._browserName = browserName;
            this._browserVersion = browserVersion;
        }
    }

}, {

    Device: {
        value: {
            IPHONE: "iphone",

            IPAD: "ipad",

            IPOD: "ipod"
        }
    },

    Platform: {
        value: {
            IOS: "ios",

            ANDROID: "android",

            WINDOWS_PHONE: "windows phone",

            MACINTOSH: "macintosh",

            WINDOWS: "windows",

            LINUX: "linux",

            CHROME_OS: "chrome os"
        }
    },

    Browser: {
        value: {
            SAFARI: "safari",

            FIREFOX: "firefox",

            CHROME: "chrome",

            OPERA: "opera",

            IE: "ie",

            EDGE: "edge"
        }
    }

});

exports.currentEnvironment = new Environment();
