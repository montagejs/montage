/*global require,exports,describe,beforeEach,it,expect,waits,waitsFor,runs,spyOn */
var Environment = require("montage/core/environment").Environment;


var USER_AGENTS = {
    IOS_IPHONE: "Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53",
    IOS_IPAD: "Mozilla/5.0 (iPad; CPU OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53",
    IOS_IPOD: "Mozilla/5.0 (iPod touch; CPU iPhone OS 7_0_3 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11B511 Safari/9537.53",
    IOS_CHROME: "Mozilla/5.0 (iPhone; U; CPU iPhone OS 5_1_1 like Mac OS X; en) AppleWebKit/534.46.0 (KHTML, like Gecko) CriOS/19.0.1084.60 Mobile/9B206 Safari/7534.48.3",
    IOS_FIREFOX: "Mozilla/5.0 (iPhone; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69 Safari/600.1.4",
    ANDROID_NEXUS_CHROME: "Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76B) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.133 Mobile Safari/535.19",
    ANDROID_FIREFOX: "Mozilla/5.0 (Android; Mobile; rv:29.0) Gecko/29.0 Firefox/29.0",
    ANDROID_OPERA: "Mozilla/5.0 (Linux; Android 4.4; LT15i Build/4.1.B.0.587) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.72 Mobile Safari/537.36 OPR/19.0.1340.69721",
    ANDROID_OPERA_TABLET: "Mozilla/5.0 (Linux; Android 4.4; LT15i Build/4.1.B.0.587) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.72 Safari/537.36 OPR/19.0.1340.69721",
    ANDROID_FIREFOX_TABLET: "Mozilla/5.0 (Android; Tablet; rv:40.0) Gecko/40.0 Firefox/40.0",
    ANDROID_CHROME_TABLET: "Mozilla/5.0 (Linux; Android 4.4; Nexus 7 Build/IMM76B) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.133 Safari/535.19",
    MAC_CHROME: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.97 Safari/537.36",
    MAC_OPERA: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36 OPR/34.0.2036.50",
    MAC_SAFARI: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/601.5.10 (KHTML, like Gecko) Version/9.1 Safari/601.5.10",
    MAC_FIREFOX: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:44.0) Gecko/20100101 Firefox/44.0",
    WINDOWS_CHROME: "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36",
    WINDOWS_FIREFOX: "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.1",
    WINDOWS_OPERA: "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.52 Safari/537.36 OPR/15.0.1147.100",
    WINDOWS_IE_10: "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)",
    WINDOWS_IE_11: "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko",
    WINDOWS_EDGE: "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.10136",
    WINDOWS_PHONE_EDGE: "Mozilla/5.0 (Windows Phone 10.0; Android 4.2.1; DEVICE INFO) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Mobile Safari/537.36 Edge/12.0",
    LINUX_CHROME: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36",
    CHROME_OS: "Mozilla/5.0 (X11; CrOS x86_64 4731.85.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36"
};

describe("environment-spec", function () {
    var environment;

    describe("ios environment", function () {

        it("should detect when running on IOS", function () {
            environment = new Environment(USER_AGENTS.IOS_IPHONE);
            expect(environment.platformName).toBe(Environment.Platform.IOS);
            expect(environment.isMobileDevice).toBe(true);
            expect(environment.isIOSDevice).toBe(true);
        });

        it("should detect the correct IOS device", function () {
            environment = new Environment(USER_AGENTS.IOS_IPHONE);
            expect(environment.device).toBe(Environment.Device.IPHONE);
            expect(environment.isIOSDevice).toBe(true);
            expect(environment.isMobileDevice).toBe(true);

            environment = new Environment(USER_AGENTS.IOS_IPOD);
            expect(environment.device).toBe(Environment.Device.IPOD);
            expect(environment.isIOSDevice).toBe(true);
            expect(environment.isMobileDevice).toBe(true);

            environment = new Environment(USER_AGENTS.IOS_IPAD);
            expect(environment.device).toBe(Environment.Device.IPAD);
            expect(environment.isIOSDevice).toBe(true);
            expect(environment.isMobileDevice).toBe(true);
        });

        it("should detect the correct browser on IOS", function () {
            environment = new Environment(USER_AGENTS.IOS_CHROME);
            expect(environment.device).toBe(Environment.Device.IPHONE);
            expect(environment.isMobileDevice).toBe(true);
            expect(environment.isIOSDevice).toBe(true);
            expect(environment.platformName).toBe(Environment.Platform.IOS);
            expect(environment.browserName).toBe(Environment.Browser.CHROME);

            environment = new Environment(USER_AGENTS.IOS_IPHONE);
            expect(environment.device).toBe(Environment.Device.IPHONE);
            expect(environment.isMobileDevice).toBe(true);
            expect(environment.isIOSDevice).toBe(true);
            expect(environment.platformName).toBe(Environment.Platform.IOS);
            expect(environment.browserName).toBe(Environment.Browser.SAFARI);

            environment = new Environment(USER_AGENTS.IOS_IPHONE);
            expect(environment.device).toBe(Environment.Device.IPHONE);
            expect(environment.isIOSDevice).toBe(true);
            expect(environment.isMobileDevice).toBe(true);
            expect(environment.platformName).toBe(Environment.Platform.IOS);
            expect(environment.browserName).toBe(Environment.Browser.SAFARI);

            environment = new Environment(USER_AGENTS.IOS_FIREFOX);
            expect(environment.device).toBe(Environment.Device.IPHONE);
            expect(environment.isIOSDevice).toBe(true);
            expect(environment.isMobileDevice).toBe(true);
            expect(environment.platformName).toBe(Environment.Platform.IOS);
            expect(environment.browserName).toBe(Environment.Browser.FIREFOX);
        });

    });

    describe("android environment", function () {

        it("should detect when running on android", function () {
            environment = new Environment(USER_AGENTS.ANDROID_NEXUS_CHROME);
            expect(environment.platformName).toBe(Environment.Platform.ANDROID);
            expect(environment.isMobileDevice).toBe(true);
            expect(environment.isAndroidDevice).toBe(true);
        });

        it("should detect the correct browser on android", function () {
            environment = new Environment(USER_AGENTS.ANDROID_NEXUS_CHROME);
            expect(environment.isMobileDevice).toBe(true);
            expect(environment.platformName).toBe(Environment.Platform.ANDROID);
            expect(environment.browserName).toBe(Environment.Browser.CHROME);
            expect(environment.isAndroidDevice).toBe(true);

            environment = new Environment(USER_AGENTS.ANDROID_FIREFOX);
            expect(environment.isMobileDevice).toBe(true);
            expect(environment.platformName).toBe(Environment.Platform.ANDROID);
            expect(environment.browserName).toBe(Environment.Browser.FIREFOX);
            expect(environment.isAndroidDevice).toBe(true);

            environment = new Environment(USER_AGENTS.ANDROID_OPERA);
            expect(environment.isMobileDevice).toBe(true);
            expect(environment.platformName).toBe(Environment.Platform.ANDROID);
            expect(environment.browserName).toBe(Environment.Browser.OPERA);
            expect(environment.isAndroidDevice).toBe(true);

            environment = new Environment(USER_AGENTS.ANDROID_FIREFOX_TABLET);
            expect(environment.platformName).toBe(Environment.Platform.ANDROID);
            expect(environment.browserName).toBe(Environment.Browser.FIREFOX);
            expect(environment.isAndroidDevice).toBe(true);
            expect(environment.isMobileDevice).toBe(false);
            expect(environment.isAndroidTablet).toBe(true);

            environment = new Environment(USER_AGENTS.ANDROID_CHROME_TABLET);
            expect(environment.platformName).toBe(Environment.Platform.ANDROID);
            expect(environment.browserName).toBe(Environment.Browser.CHROME);
            expect(environment.isAndroidDevice).toBe(true);
            expect(environment.isMobileDevice).toBe(false);
            expect(environment.isAndroidTablet).toBe(true);

            environment = new Environment(USER_AGENTS.ANDROID_OPERA_TABLET);
            expect(environment.platformName).toBe(Environment.Platform.ANDROID);
            expect(environment.browserName).toBe(Environment.Browser.OPERA);
            expect(environment.isAndroidDevice).toBe(true);
            expect(environment.isMobileDevice).toBe(false);
            expect(environment.isAndroidTablet).toBe(true);
        });

    });

    describe("mac os x environment", function () {

        it("should detect when running on mac os x", function () {
            environment = new Environment(USER_AGENTS.MAC_CHROME);
            expect(environment.platformName).toBe(Environment.Platform.MACINTOSH);
        });

        it("should detect the correct browser on mac os x", function () {
            environment = new Environment(USER_AGENTS.MAC_CHROME);
            expect(environment.platformName).toBe(Environment.Platform.MACINTOSH);
            expect(environment.browserName).toBe(Environment.Browser.CHROME);

            environment = new Environment(USER_AGENTS.MAC_FIREFOX);
            expect(environment.platformName).toBe(Environment.Platform.MACINTOSH);
            expect(environment.browserName).toBe(Environment.Browser.FIREFOX);

            environment = new Environment(USER_AGENTS.MAC_OPERA);
            expect(environment.platformName).toBe(Environment.Platform.MACINTOSH);
            expect(environment.browserName).toBe(Environment.Browser.OPERA);

            environment = new Environment(USER_AGENTS.MAC_SAFARI);
            expect(environment.platformName).toBe(Environment.Platform.MACINTOSH);
            expect(environment.browserName).toBe(Environment.Browser.SAFARI);

        });

    });

    describe("windows environment", function () {

        it("should detect when running on windows", function () {
            environment = new Environment(USER_AGENTS.WINDOWS_CHROME);
            expect(environment.platformName).toBe(Environment.Platform.WINDOWS);
        });

        it("should detect the correct browser on windows", function () {
            environment = new Environment(USER_AGENTS.WINDOWS_CHROME);
            expect(environment.platformName).toBe(Environment.Platform.WINDOWS);
            expect(environment.browserName).toBe(Environment.Browser.CHROME);

            environment = new Environment(USER_AGENTS.WINDOWS_OPERA);
            expect(environment.platformName).toBe(Environment.Platform.WINDOWS);
            expect(environment.browserName).toBe(Environment.Browser.OPERA);

            environment = new Environment(USER_AGENTS.WINDOWS_FIREFOX);
            expect(environment.platformName).toBe(Environment.Platform.WINDOWS);
            expect(environment.browserName).toBe(Environment.Browser.FIREFOX);

            environment = new Environment(USER_AGENTS.WINDOWS_IE_10);
            expect(environment.platformName).toBe(Environment.Platform.WINDOWS);
            expect(environment.browserName).toBe(Environment.Browser.IE);

            environment = new Environment(USER_AGENTS.WINDOWS_IE_11);
            expect(environment.platformName).toBe(Environment.Platform.WINDOWS);
            expect(environment.browserName).toBe(Environment.Browser.IE);

            environment = new Environment(USER_AGENTS.WINDOWS_EDGE);
            expect(environment.platformName).toBe(Environment.Platform.WINDOWS);
            expect(environment.browserName).toBe(Environment.Browser.EDGE);
        });

    });

    describe("windows phone environment", function () {

        it("should detect when running on windows phone", function () {
            environment = new Environment(USER_AGENTS.WINDOWS_PHONE_EDGE);
            expect(environment.platformName).toBe(Environment.Platform.WINDOWS_PHONE);
            expect(environment.isMobileDevice).toBe(true);

        });

        it("should detect the correct browser on windows phone", function () {
            environment = new Environment(USER_AGENTS.WINDOWS_PHONE_EDGE);
            expect(environment.platformName).toBe(Environment.Platform.WINDOWS_PHONE);
            expect(environment.browserName).toBe(Environment.Browser.EDGE);
            expect(environment.isMobileDevice).toBe(true);
        });

    });

    describe("linux environment", function () {

        it("should detect when running on linux", function () {
            environment = new Environment(USER_AGENTS.LINUX_CHROME);
            expect(environment.platformName).toBe(Environment.Platform.LINUX);
            expect(environment.isMobileDevice).toBe(false);

        });

        it("should detect the correct browser on windows phone", function () {
            environment = new Environment(USER_AGENTS.LINUX_CHROME);
            expect(environment.platformName).toBe(Environment.Platform.LINUX);
            expect(environment.browserName).toBe(Environment.Browser.CHROME);
        });

    });

    describe("chrome os environment", function () {

        it("should detect when running on chrome os", function () {
            environment = new Environment(USER_AGENTS.LINUX_CHROME);
            expect(environment.platformName).toBe(Environment.Platform.LINUX);
            expect(environment.isMobileDevice).toBe(false);

        });

        it("should detect the correct browser on chrome os", function () {
            environment = new Environment(USER_AGENTS.CHROME_OS);
            expect(environment.platformName).toBe(Environment.Platform.CHROME_OS);
            expect(environment.browserName).toBe(Environment.Browser.CHROME);
        });

    });

});
