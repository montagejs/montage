/*global require,exports,describe,it,expect */
var Montage = require("montage").Montage;
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("label-test", function (testPage) {
    var test;
    beforeEach(function () {
        test = testPage.test;
    });

    describe("ui/label/label-spec", function () {

        describe("Label with text", function () {
            it("value can be set", function () {
                test.label.value = "foo";
                testPage.waitForDraw();
                runs(function () {
                    expect(test.label.element.textContent).toEqual("foo");
                })
            });
        });

        describe("Label as a button", function () {
            it("activates its target component", function () {
                // Ok, not super realistic to 'activate' some text,
                // but there's not much available in Montage core
                test.text.activate = function (){};
                var spy = spyOn(test.text, 'activate');

                test.label.target = test.text;
                test.label.handlePress();

                expect(spy).toHaveBeenCalled();
            });
            it("calls a custom method on its target", function () {
                // Ok, not super realistic to 'activate' some text,
                // but there's not much available in Montage core
                test.text.activateMe = function (){};
                var spy = spyOn(test.text, 'activateMe');

                test.label.target = test.text;
                test.label.action = "activateMe";
                test.label.handlePress();

                expect(spy).toHaveBeenCalled();
            })
        });

    });

});
