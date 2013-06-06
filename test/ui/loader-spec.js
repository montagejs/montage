/*global require,exports,describe,it,expect */
var Montage = require("montage").Montage,
    TestPageLoader = require("montage-testing/testpageloader").TestPageLoader,
    PRELOADING = 0,
    BOOTSTRAPPING = 1,
    LOADING = 2,
    LOADED = 3;

TestPageLoader.queueTest("loader/loader-test", function(testPage) {
    var test;

    beforeEach(function() {
        test = testPage.test;
    });

    describe("ui/loader/loader-spec", function() {
        it("should be in the BOOTSTRAPPING stage or after", function() {
            var loader = test.templateObjects.owner;

            if (loader.currentStage === BOOTSTRAPPING) {
                waitsFor(function() {
                    return loader.currentStage > BOOTSTRAPPING;
                }, "BOOTSTRAPPING is over", 2000);
            }
        });

        it("should be in the LOADING stage or after", function() {
            var loader = test.templateObjects.owner;

            if (loader.currentStage === LOADING) {
                waitsFor(function() {
                    return loader.currentStage > LOADING;
                }, "LOADING is over", 2000);
            }
        });

        it("should be in the LOADED stage", function() {
            var loader = test.templateObjects.owner;

            expect(loader.currentStage).toBe(LOADED);
        });

        it("should load the main component", function() {
            var loader = test.templateObjects.owner,
                main = loader._mainComponent;

            expect(main.element.textContent).toBe(main.text);
        });

    });
});
