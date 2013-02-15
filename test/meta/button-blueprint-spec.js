/* <copyright>
 </copyright> */
var Montage = require("montage").Montage;
var TestPageLoader = require("support/testpageloader").TestPageLoader;

var testPage = TestPageLoader.queueTest("component-blueprint-test", function () {
    describe("meta/button-blueprint-spec", function () {
        it("should load", function () {
            expect(testPage.loaded).toBeTruthy();
        });

        var button;

        beforeEach(function () {
            console.log("CLEAR!")
            button = testPage.test.button;
        });

        it("can create load button blueprint", function () {

            var blueprintPromise = button.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).not.toBeNull();
            });
        });

        it("can read inherited property blueprint", function () {

            var blueprintPromise = button.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).not.toBeNull();
                expect(blueprint.propertyBlueprintForName("identifier")).not.toBeNull();

            });
        });


    });
});
