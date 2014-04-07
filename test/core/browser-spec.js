
var Browser = require("montage/core/browser").Browser;

describe("core/browser-spec", function () {
    var browser;

    describe("on Android", function () {
        beforeEach(function () {
            browser = new Browser("Mozilla/5.0 (Linux; U; Android 4.2.2; en-us; SM-T110 Build/JDQ39) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Safari/534.30");
        });
        it("should recognize Android", function () {
            expect(browser.android).toBeTruthy();
        });
        describe("browser", function () {
            it("should recognize Android Browser", function () {
                expect(browser.android ? browser.android.androidBrowser : false).toBeTruthy();
            });
        });
    });

});

