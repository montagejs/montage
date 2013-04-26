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
        it("should be in the LOADED stage", function() {
            var loader = test.templateObjects.loader;

            expect(loader.currentStage).toBe(LOADED);
        });

        it("should load the main component", function() {
            var loader = test.templateObjects.loader,
                main = loader._mainComponent;

            expect(main.element.textContent).toBe(main.text);
        });

    });

});
