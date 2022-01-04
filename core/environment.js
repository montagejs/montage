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

    /*
        set by EventManager to avoid circular dependencies... Should environment be exposed only via application and live inside application.js?
    */
    application: {
        value: null
    },

    systemLocaleIdentifier: {
        get: function () {
            return this.languages[0];
        }
    },

    _languages: {
        value: undefined
    },

    languages: {
        get: function() {
            if(!this._languages) {
                this._languages = typeof navigator === "object"
                    ? (navigator.languages && navigator.languages.length)
                        ? navigator.languages
                        : [navigator.userLanguage || navigator.language || navigator.browserLanguage || 'en']
                    : ["en"];
            }
            return this._languages;
        },
        set: function(value) {
            this._languages = value;
        }
    },

    userAgentIPAddress: {
        value: undefined
    },

    /**
     * The name of the stage the code is running.
     *
     * this.application.url.searchParams.get("stage");
     *
     * @property {string}
     */
    _stage: {
        value: undefined
    },
    stage: {
        get: function() {
            if(this._stage === undefined) {
                //Check if we have an argument:
                var applicationURL = this.application.url,
                    stageArgument = applicationURL && applicationURL.searchParams.get("stage");

                if(stageArgument) {
                    this._stage = stageArgument;
                } else if(applicationURL && (applicationURL.hostname === "127.0.0.1" || applicationURL.hostname === "localhost" || applicationURL.hostname.endsWith(".local")) ) {
                    this._stage = "dev";
                } else {
                    /*
                        could be staging or production or anything else, we don't know and stop the guessing game.
                    */
                   this._stage = null;
                }
            }

            return this._stage;
        },
        set: function(value) {
            this._stage = value;
        }
    },

    isBrowser: {
        value: (typeof window !== "undefined")
    },

    _isNode: {
        value: undefined
    },
    isNode: {
        get: function() {
            return this._isNode || (this._isNode = ((typeof process !== 'undefined') &&
(process.release.name.search(/node|io.js/) !== -1)));
        }
    },

    _isAWS: {
        value: undefined
    },

    /**
     * Returns true if the code runs in AWS LAMBDA environment using the reserved environment variable
     *
     * AWS_EXECUTION_ENV
     *
     * more at https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html
     *
     * @property {Boolean} value
     */

    isAWS: {
        get: function() {
            return this._isAWS || (this._isAWS = ((typeof process !== 'undefined') && (typeof process.env.AWS_EXECUTION_ENV !== 'undefined')));
        }
    },

    _userAgent: {
        value: null
    },

    userAgent: {
        set: function (userAgent) {

            if(userAgent) {
                userAgent = userAgent.toLowerCase();
            }

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

    _supportsLinkRel: {
        value: function _supportsLinkRel(feature){
            var tokenList;
            var fakeLink = document.createElement('link');
            try {
                if(fakeLink.relList && _.isFunction(fakeLink.relList.supports)){
                    return  fakeLink.relList.supports(feature);
                }
            } catch(err){
                return false;
            }
        }
    },

    _supportsLinkPrefetch: {
        value: undefined
    },
    supportsLinkPrefetch: {
        value: function() {
            return typeof this._supportsLinkPrefetch === "boolean"
                ? this._supportsLinkPrefetch
                : (this._supportsLinkPrefetch = (this.isBrowser && this._supportsLinkRel('prefetch')));
        }
    },
    _supportsLinkPreload: {
        value: undefined
    },
    supportsLinkPreload: {
        value: function() {
            return typeof this._supportsLinkPreload === "boolean"
                ? this._supportsLinkPreload
                : (this._supportsLinkPreload = (this.isBrowser && this._supportsLinkRel('preload')));
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


    _isApplePlatform: {
        value: null
    },

    isApplePlatform: {
        get: function () {
            return typeof this._isApplePlatform !== "boolean" ?
                (this._isApplePlatform = new RegExp(Environment.Platform.MACINTOSH+"|"+Environment.Platform.IOS).test(this.platformName)) : this._isApplePlatform;
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
