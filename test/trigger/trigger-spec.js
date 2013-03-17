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
            return require.async("trigger/package.json").then(function(packageJSON) {

                var injections = {}
                injections.packageDescriptions = [];
                injections.packageDescriptionLocations = [];
                injections.mappings = [
                    {
                        name: "test",
                        application: true,
                        dependency: {
                            name: "test",
                            location: "../",
                            version: "*"
                        }
                    },
                    {
                        name: "montage",
                        application: true,
                        dependency: {
                            name: "montage",
                            location: "../../",
                            version: "*"
                        }
                    },
                    {
                        name: "montage-testing",
                        application: true,
                        dependency: {
                            name: "montage-testing",
                            location: "../../node_modules/montage-testing",
                            version: "*"
                        }
                    },
                    {
                        name: "__custom",
                        application: true,
                        dependency: {
                            name: "__custom",
                            location: ".",
                            version: "*"
                        }
                    }
                ];
                injections.dependencies = [];

                testWindow.postMessage({
                    type: "montageInit",
                    location: options.directory,
                    injections: injections
                }, "*");
            }).then(function() {
                return TestPageLoader.testPage.loadTest(promiseForFrameLoad, options).then(function(testPage) {
                    expect(testPage.loaded).toBeTruthy();
                });
            }) ;
        });
        it("should accept to load a custom mapping", function() {
            console.log("should accept to load a custom mapping");

            var injectModule = TestPageLoader.testPage.window.require.async("__custom/inject");

            return injectModule.then(function(inject) {
                expect(inject.injected).toBeTruthy();
            });

        });
        it("should unload", function() {
            TestPageLoader.testPage.unloadTest();
            console.groupEnd();
        });
    });
});
