/*global require,exports,describe,it,expect */
var Montage = require("montage").Montage;
var Promise = require("montage/core/promise").Promise;
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

var options = TestPageLoader.options("trigger-test", {timeoutLength: 10000}, function() {console.log("trigger-test callback");});
describe("trigger-test", function() {
    describe("trigger/trigger-spec", function() {
        var testWindow,
            promiseForFrameLoad;
        it("should receive a montageReady event", function() {
            console.group("trigger-test");
            console.log("should wait for the trigger");

            promiseForFrameLoad = TestPageLoader.testPage.loadFrame(options);
            return promiseForFrameLoad.then(function(iWindow) {
                var deferForMontageReady = Promise.defer();
                testWindow = iWindow;

                testWindow.addEventListener("message", function(event) {
                    if(event.source === testWindow) {
                        deferForMontageReady.resolve(event);
                    }
                });

                return deferForMontageReady.promise
                    .then(function(event) {
                        expect(event.data.type).toEqual("montageReady");
                        expect(TestPageLoader.testPage.loaded).toBeFalsy();
                    });
            });
        });
        it("load when message is posted", function() {
            console.log("load when message is posted");
            testWindow.postMessage({
                type: "montageInit",
                location: options.directory + "../package.json"
            }, "*");
            return TestPageLoader.testPage.loadTest(promiseForFrameLoad, options).then(function(testPage) {
                expect(TestPageLoader.testPage.loaded).toBeTruthy();
            });

        });
        it("should unload", function() {
            TestPageLoader.testPage.unloadTest();
            console.groupEnd();
        });
    });
});
