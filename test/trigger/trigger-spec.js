/*global require,exports,describe,it,expect */
var Montage = require("montage").Montage;
var Promise = require("montage/core/promise").Promise;
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;
var URL = require("montage/core/url");

var options = TestPageLoader.options("trigger-test", {timeoutLength: 10000}, function() {console.log("trigger-test callback");});
describe("trigger-test", function() {
    describe("trigger/trigger-spec", function() {
        var testWindow,
            promiseForFrameLoad;
        it("should receive a montageReady event", function() {
            console.group("trigger-test");

            promiseForFrameLoad = TestPageLoader.testPage.loadFrame(options);
            return promiseForFrameLoad.then(function(iWindow) {
                var deferForMontageReady = Promise.defer();
                testWindow = iWindow;

                testWindow.postMessage({
                    type: "isMontageReady",
                }, "*");
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
            return require.async("trigger/to-be-defined-package.json").then(function(packageJSON) {
                var injections = {};

                //packageDescriptions
                injections.packageDescriptions = [
                    {
                        name: "to-be-defined",
                        location: URL.resolve(options.directory, "node_modules/to-be-defined/"),
                        description: packageJSON
                    }
                ];

                //packageDescriptionLocations
                injections.packageDescriptionLocations = [
                    {
                        name: "inject-description-location",
                        location: URL.resolve(options.directory, "node_modules/inject-description-location/"),
                        descriptionLocation: URL.resolve(options.directory, "inject-description-location.json")
                    }
                ];

                //mappings
                injections.mappings = [
                    {
                        name: "__custom",
                        dependency: {
                            name: "__custom",
                            location: ".",
                            version: "*"
                        }
                    }
                ];

                //dependencies
                injections.dependencies = [
                    {
                        name: "injected-dependency"
                    },
                    {
                        name: "to-be-defined"
                    }
                ];

                testWindow.postMessage({
                    type: "montageInit",
                    location: options.directory,
                    injections: injections
                }, "*");
                return TestPageLoader.testPage.loadTest(promiseForFrameLoad, options).then(function(testPage) {
                    expect(testPage.loaded).toBeTruthy();
                });
            })
        });

        it("should be able to inject a packaged description", function() {
            // the inject-description-location.json is supposed to define the main modules as inject.js
            var injectModule = TestPageLoader.testPage.window.require.async("to-be-defined/inject");

            return injectModule.then(function(inject) {
                expect(inject.injected).toBeTruthy();
            });

        });
        it("should be able to inject a packaged description location", function() {
            // the inject-description-location.json is supposed to define the main modules as inject.js
            var injectModule = TestPageLoader.testPage.window.require.async("inject-description-location");

            return injectModule.then(function(inject) {
                expect(inject.injected).toBeTruthy();
            });

        });
        it("should be able to inject a mapping", function() {

            var injectModule = TestPageLoader.testPage.window.require.async("__custom/inject");

            return injectModule.then(function(inject) {
                expect(inject.injected).toBeTruthy();
            });

        });
        it("should be able to inject a dependency", function() {

            var injectModule = TestPageLoader.testPage.window.require.async("injected-dependency/inject");

            return injectModule.then(function(inject) {
                expect(inject.injected).toBeTruthy();
            });

        });
        it("should be able to still use an existing dependency", function() {

            var injectModule = TestPageLoader.testPage.window.require.async("existing/inject");

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
