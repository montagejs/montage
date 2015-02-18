/*global require,exports,describe,it,expect */
var Montage = require("montage").Montage;
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("text-test", function (testPage) {
    var test;
    beforeEach(function () {
        test = testPage.test;
    });

    describe("ui/text/text-spec", function () {

        describe("Text", function () {
            it("wipes out its content in initialization", function () {
                expect(testPage.getElementById("bar")).toBeNull();
            });
        });

        describe("Text using plain text", function () {
            it("can be created", function () {
                expect(test.plainText).toBeDefined();
            });
            it("value can be set", function () {
                test.plainText.value = "foo";
                testPage.waitForDraw();
                runs(function () {
                    expect(test.plainText.element.textContent).toEqual("foo");
                })
            });
            it("value can be reset", function () {
                test.plainText.value = "";
                testPage.waitForDraw();
                runs(function () {
                    expect(test.plainText.element.textContent).toEqual("");
                })
            });
        });

    });

});
