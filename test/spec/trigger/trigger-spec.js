/*global require,exports,describe,it,expect */
var Montage = require("montage").Montage;
var Promise = require("montage/core/promise").Promise;
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

var options = TestPageLoader.options("trigger-test", {timeoutLength: 10000}, function () {console.log("trigger-test callback");});
describe("trigger-test", function () {
    describe("trigger/trigger-spec", function () {
        var testWindow,
            promiseForFrameLoad;

        it("should receive a montageReady event", function (done) {
            //console.group("trigger-test");
            promiseForFrameLoad = TestPageLoader.testPage.loadFrame(options);
            promiseForFrameLoad.then(function(iWindow) {
                var deferForMontageReady = new Promise(function(resolve, reject) {
                    testWindow = iWindow;

                    testWindow.postMessage({
                        type: "isMontageReady"
                    }, "*");
                    testWindow.addEventListener("message", function(event) {
                        if(event.source === testWindow) {
                            resolve(event);
                        }
                    });
                });

                return deferForMontageReady
                    .then(function(event) {
                        expect(event.data.type).toEqual("montageReady");
                        expect(TestPageLoader.testPage.loaded).toBeFalsy();
                    });
            }).finally(function () {
                done();
            });
        });

        it("load when message is posted", function (done) {
            //console.log("load when message is posted");
            require.async("spec/trigger/to-be-defined-package.json").then(function (packageJSON) {
                var injections = {};

                //packageDescriptions
                injections.packageDescriptions = [
                    {
                        name: "to-be-defined",
                        location: options.directory + "node_modules/to-be-defined/",
                        description: packageJSON
                    }
                ];

                //packageDescriptionLocations
                injections.packageDescriptionLocations = [
                    {
                        name: "inject-description-location",
                        location: options.directory + "node_modules/inject-description-location/",
                        descriptionLocation: options.directory + "inject-description-location.json"
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

                return TestPageLoader.testPage.loadTest(promiseForFrameLoad, options).then(function (testPage) {
                    expect(testPage.loaded).toBeTruthy();
                });
            }).finally(function () {
                done();
            });
        });

        it("should be able to inject a packaged description", function (done) {
            // the inject-description-location.json is supposed to define the main modules as inject.js
            var injectModule = TestPageLoader.testPage.global.mr.async("to-be-defined/inject");

            injectModule.then(function (inject) {
                expect(inject.injected).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        it("should be able to inject a packaged description location", function (done) {
            // the inject-description-location.json is supposed to define the main modules as inject.js
            var injectModule = TestPageLoader.testPage.global.mr.async("inject-description-location");

            injectModule.then(function (inject) {
                expect(inject.injected).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        it("should be able to inject a mapping", function (done) {

            var injectModule = TestPageLoader.testPage.global.mr.async("__custom/inject");

            injectModule.then(function (inject) {
                expect(inject.injected).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        it("should be able to inject a dependency", function (done) {

            var injectModule = TestPageLoader.testPage.global.mr.async("injected-dependency/inject");

            injectModule.then(function (inject) {
                expect(inject.injected).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        it("should be able to still use an existing dependency", function (done) {

            var injectModule = TestPageLoader.testPage.global.mr.async("existing/inject");

            injectModule.then(function (inject) {
                expect(inject.injected).toBeTruthy();
            }).finally(function () {
                done();
            });
        });
    });
});
