/* <copyright>
</copyright> */
var Montage = require("montage").Montage;
var TestPageLoader = require("support/testpageloader").TestPageLoader;
var Component = require("montage/ui/component").Component;
var Selector = require("montage/core/selector").Selector;
var ComponentDescription = require("montage/ui/component-description").ComponentDescription;
var Serializer = require("montage/core/serializer").Serializer;

var testPage = TestPageLoader.queueTest("component-description-test", function() {
    describe("ui/component-description-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBeTruthy();
        });

        var component1;
        var component2;
        var component3;

        beforeEach(function() {
            console.log("CLEAR!")
            component1 = testPage.test.component1;
            component2 = testPage.test.component2;
            component3 = testPage.test.component3;
        });

        it("can create new description", function() {
            var newComponentDescription = ComponentDescription.create().initWithComponent(component1);
            expect(newComponentDescription).toBeTruthy();
            component1.description = newComponentDescription;
            var promise = component1.description;
            waitsFor(function () {
                return promise.isFulfilled();
            }, "promise", 500);
            runs(function () {
                var result = promise.valueOf();
                expect(result).not.toBeNull();
            });
        });

        it("can create new property description", function() {
            var newComponentDescription = ComponentDescription.create().initWithComponent(component1);
            expect(newComponentDescription).toBeTruthy();
            newComponentDescription.addComponentPropertyDescription("bindableProperty");
            component1.description = newComponentDescription;
            var promise = component1.description;
            waitsFor(function () {
                return promise.isFulfilled();
            }, "promise", 500);
            runs(function () {
                var result = promise.valueOf();
                expect(result).not.toBeNull();
            });
        });


        it("can serialize the component description", function() {
            var serializer = Serializer.create().initWithRequire(require);

            var newComponentDescription = ComponentDescription.create().initWithComponent(component1);
            expect(newComponentDescription).toBeTruthy();
            //
            newComponentDescription.addComponentPropertyDescription("bindableProperty1");
            newComponentDescription.addComponentPropertyDescription("bindableProperty2");
            newComponentDescription.addComponentPropertyDescription("bindableProperty3");
            newComponentDescription.addComponentPropertyDescription("bindableProperty4");
            newComponentDescription.addComponentPropertyDescription("bindableProperty5");
            //
            newComponentDescription.addComponentPropertyDescriptionToGroup("requiredBindableProperty1", "required");
            newComponentDescription.addComponentPropertyDescriptionToGroup("requiredBindableProperty2", "required");
            newComponentDescription.addComponentPropertyDescriptionToGroup("requiredBindableProperty3", "required");
            component1.description = newComponentDescription;

            component1.description.then(function (description) {
                expect(description).toBeTruthy()
                var serializedDescription = serializer.serializeObject(description);
                expect(serializedDescription).toBeTruthy();
            });
        });

        it("can load the component description from the reel", function() {
            var descriptionPromise = component2.description;
            waitsThen(descriptionPromise, function (description) {
                expect(description).toBeTruthy();
                expect(description.componentPropertyDescriptionForName("bindableProperty1")).toBeTruthy();
                expect(description.componentPropertyDescriptionGroupForName("required")).toBeTruthy();
             });
        });

        it("can create validation rules", function() {
            var newComponentDescription = ComponentDescription.create().initWithComponent(component1);
            expect(newComponentDescription).toBeTruthy();
            //
            newComponentDescription.addComponentPropertyDescription("bindableProperty1");
            newComponentDescription.addComponentPropertyDescription("bindableProperty2");
            newComponentDescription.addComponentPropertyDescription("bindableProperty3");
            newComponentDescription.addComponentPropertyDescription("bindableProperty4");
            newComponentDescription.addComponentPropertyDescription("bindableProperty5");
            //
            newComponentDescription.addComponentPropertyDescriptionToGroup("requiredBindableProperty1", "required");
            newComponentDescription.addComponentPropertyDescriptionToGroup("requiredBindableProperty2", "required");
            newComponentDescription.addComponentPropertyDescriptionToGroup("requiredBindableProperty3", "required");

            newComponentDescription.addComponentPropertyValidationRule("rule1").validationSelector = Selector.property("requiredBindableProperty1").isBound;
            newComponentDescription.addComponentPropertyValidationRule("rule2").validationSelector = Selector.property("requiredBindableProperty2").isBound;
            newComponentDescription.addComponentPropertyValidationRule("rule3").validationSelector = Selector.property("requiredBindableProperty3").isBound;

            component3.description = newComponentDescription;

            component3.description.then(function (description) {
                expect(description).toBeTruthy()
                var serializedDescription = serializer.serializeObject(description);
                expect(serializedDescription).toBeTruthy();
            });
        });


    });
});
