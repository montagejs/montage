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
            this.userAgent = userAgent || navigator.userAgent;
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

    _isBrowserSupportPointerEvents: {
        value: null
    },

    isBrowserSupportPointerEvents: {
        get: function () {
            if (this._isBrowserSupportPointerEvents === null) {
                this._isBrowserSupportPointerEvents = !!(window.PointerEvent ||
                    (window.MSPointerEvent && window.navigator.msPointerEnabled));
            }

            return this._isBrowserSupportPointerEvents;
        }
    },

    _isIOSDevice: {
        value: null
    },

    isIOSDevice: {
        get: function () {
            if (this._isIOSDevice === null) {
                this._isIOSDevice = /iphone|ipad|ipod/.test(this.device);
            }

            return this._isIOSDevice;
        }
    },

    _isAndroidDevice: {
        value: null
    },

    isAndroidDevice: {
        get: function () {
            if (this._isAndroidDevice === null) {
                this._isAndroidDevice = this.platformName === Environment.ANDROID;
            }

            return this._isAndroidDevice;
        }
    },

    isCordova: {
        value: !!window.cordova
    },

    _isMobileDevice: {
        value: null
    },

    isMobileDevice: {
        get: function () {
            if (this._isMobileDevice === null) {
                // Android 4.4+ Chrome, Opera mobile 12+, Firefox 11.0+, Safari, IE (no tablet)
                this._isMobileDevice = /mobile/gi.test(this.userAgent);
            }

            return this._isMobileDevice;
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
            if (this._isStandalone === null) {
                this._isStandalone = !!('standalone' in navigator && navigator.standalone);
            }

            return this._isStandalone;
        }
    },

    _platformName: {
        value: null
    },

    platformName: {
        get: function () {
            if (this._platformName === null) {
                var match = this.userAgent.match(/android|windows\sphone|windows|macintosh|linux|cros/gi);

                if (match && match.length) {
                    var firstCandidate = match[0];

                    if (firstCandidate === Environment.LINUX && match[1] === Environment.ANDROID) {
                        firstCandidate = Environment.ANDROID;

                    } else if (firstCandidate === CROS) {
                        firstCandidate = Environment.CHROME_OS;
                    }

                    this._platformName = firstCandidate;

                } else if (this.isIOSDevice) {
                    this._platformName = Environment.IOS;

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
            if (this._browserVersion === null) {
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
            if (this._browserName === null) {
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
            if (this._isWKWebView === null) {
                this._isWKWebView = this.isIOSDevice && !!window.indexedDB;
            }

            return this._isWKWebView;
        }
    },

    _isUIWebView: {
        value: null
    },

    isUIWebView: {
        get: function () {
            if (this._isUIWebView === null) {
                this._isUIWebView = !this.isWKWebView;
            }

            return this._isUIWebView;
        }
    },

    _analyzeBrowser: {
        value: function () {
            var userAgent = this.userAgent,
                match;

            if (userAgent.indexOf(OPR) > -1) {
                match = userAgent.match(/(opr(?=\/))\/?\s*([\d+\.?]+)/i);

            } else if (userAgent.indexOf(Environment.EDGE) > -1) {
                match = userAgent.match(/(edge(?=\/))\/?\s*([\d+\.?]+)/i);

            }  else {
                match = userAgent.match(/(opera|chrome|safari|firefox|msie|trident|crios|fxios(?=\/))\/?\s*([\d+\.?]+)/i);
            }

            if (match && match.length > 1) {
                var browserName = match[1],
                    browserVersion;

                if (browserName === Environment.SAFARI) {
                    // Support only safari 3.0+
                    browserVersion = userAgent.match(/version\/([\d+\.?]+)/i)[1];

                } else if (browserName === Environment.CHROME || browserName=== Environment.FIREFOX || browserName === FXIOS ||
                    browserName === MSIE || browserName === Environment.OPERA || browserName === CRIOS || browserName=== Environment.EDGE) {
                    // Support any version of Chrome or FF, Opera < 15 and some internet explorer user agents.
                    browserVersion = match[2];

                } else if (browserName === TRIDENT) {
                    match = /\brv[ :]+(\d+)/g.exec(userAgent);
                    browserVersion = match && match.length > 1 ? match[1] : '';
                }

                if (browserName === TRIDENT || browserName === MSIE) {
                    browserName = Environment.IE;

                } else if (browserName === OPR) {
                    // Opera 15+
                    browserName = Environment.OPERA;

                } else if (browserName === CRIOS) {
                    // Chrome IOS
                    browserName = Environment.CHROME;

                } else if (browserName === FXIOS) {
                    // FIREFOX IOS
                    browserName = Environment.FIREFOX;
                }

                this._browserName = browserName;
                this._browserVersion = browserVersion;
            }
        }
    }

}, {

    IOS: {
        value: "ios"
    },

    ANDROID: {
        value: "android"
    },

    WINDOWS_PHONE: {
        value: "windows phone"
    },

    IPHONE: {
        value: "iphone"
    },

    IPAD: {
        value: "ipad"
    },

    IPOD: {
        value: "ipod"
    },

    MACINTOSH: {
        value: "macintosh"
    },

    WINDOWS: {
        value: "windows"
    },

    LINUX: {
        value: "linux"
    },

    CHROME_OS: {
        value: "chrome os"
    },

    SAFARI: {
        value: "safari"
    },

    FIREFOX: {
        value: "firefox"
    },

    CHROME: {
        value: "chrome"
    },

    OPERA: {
        value: "opera"
    },

    IE: {
        value: "ie"
    },

    EDGE: {
        value: "edge"
    }

});

exports.currentEnvironment = new Environment();
