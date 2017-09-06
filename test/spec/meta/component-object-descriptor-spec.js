/* <copyright>
 </copyright> */
var Montage = require("montage").Montage;
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;
var Component = require("montage/ui/component").Component;
var Selector = require("montage/core/selector").Selector;
var ObjectDescriptor = require("montage/core/meta/object-descriptor").ObjectDescriptor;
var Promise = require("montage/core/promise").Promise;
var Serializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer;

TestPageLoader.queueTest("component-object-descriptor-test/component-object-descriptor-test", function (testPage) {
    describe("meta/component-object-descriptor-spec", function () {
        var component1;
        var component2;
        var component3;


        beforeEach(function () {
            component1 = testPage.test.component1;
            component2 = testPage.test.component2;
            component3 = testPage.test.component3;
        });

        it("can create new objectDescriptor", function (done) {
            var newObjectDescriptor = new ObjectDescriptor().initWithName(component1.identifier);
            component1.objectDescriptor = newObjectDescriptor;
            var objectDescriptorPromise = component1.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(newObjectDescriptor).toBeDefined();
                expect(objectDescriptor).toBe(newObjectDescriptor);
            }).finally(function () {
                done();
            });
        });

        it("can create new property objectDescriptor", function (done) {
            var newObjectDescriptor = new ObjectDescriptor().initWithName(component1.identifier);
            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty");
            component1.objectDescriptor = newObjectDescriptor;
            var objectDescriptorPromise = component1.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                var propertyDescriptor = objectDescriptor.propertyDescriptorForName("bindableProperty");
                expect(propertyDescriptor).toBeDefined();
            }).finally(function () {
                done();
            });
        });

        it("can serialize the component objectDescriptor", function (done) {
            var serializer = new Serializer().initWithRequire(require);

            var newObjectDescriptor = new ObjectDescriptor().initWithName(component1.identifier);
            //
            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty1");
            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty2");
            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty3");
            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty4");
            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty5");
            //
            newObjectDescriptor.addEventDescriptorNamed("action");
            //
            newObjectDescriptor.addPropertyDescriptorToGroupNamed(newObjectDescriptor.addToOnePropertyDescriptorNamed("requiredBindableProperty1"), "required");
            newObjectDescriptor.addPropertyDescriptorToGroupNamed(newObjectDescriptor.addToOnePropertyDescriptorNamed("requiredBindableProperty2"), "required");
            newObjectDescriptor.addPropertyDescriptorToGroupNamed(newObjectDescriptor.addToOnePropertyDescriptorNamed("requiredBindableProperty3"), "required");
            component1.objectDescriptor = newObjectDescriptor;

            var objectDescriptorPromise = component1.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                var serializedDescription = serializer.serializeObject(objectDescriptor);
                expect(serializedDescription).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        xit("can load the component objectDescriptor from the reel", function (done) {
            var objectDescriptorPromise = component2.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
                // TODO test look weird requiredBindableProperty1 vs bindableProperty1
                expect(objectDescriptor.propertyDescriptorForName("bindableProperty1")).toBeTruthy();
                expect(objectDescriptor.propertyDescriptorForName("required")).toBeTruthy();
            }).finally(function () {
                done();
            });
        });


        it("can create validation rules", function (done) {
            var serializer = new Serializer().initWithRequire(require);

            var newObjectDescriptor = new ObjectDescriptor().initWithName(component3.identifier);
            expect(newObjectDescriptor).toBeTruthy();
            //
            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty1");
            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty2");
            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty3");
            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty4");
            newObjectDescriptor.addToOnePropertyDescriptorNamed("bindableProperty5");
            //
            newObjectDescriptor.addPropertyDescriptorToGroupNamed(newObjectDescriptor.addToOnePropertyDescriptorNamed("requiredBindableProperty1"), "required");
            newObjectDescriptor.addPropertyDescriptorToGroupNamed(newObjectDescriptor.addToOnePropertyDescriptorNamed("requiredBindableProperty2"), "required");
            newObjectDescriptor.addPropertyDescriptorToGroupNamed(newObjectDescriptor.addToOnePropertyDescriptorNamed("requiredBindableProperty3"), "required");

            newObjectDescriptor.addPropertyValidationRule("rule1").validationSelector = null;
            //            newObjectDescriptor.addPropertyValidationRule("rule1").validationSelector = Selector.property("requiredBindableProperty1").isBound;
            //            newObjectDescriptor.addPropertyValidationRule("rule2").validationSelector = Selector.property("requiredBindableProperty2").isBound;
            //            newObjectDescriptor.addPropertyValidationRule("rule3").validationSelector = Selector.property("requiredBindableProperty3").isBound;

            component3.objectDescriptor = newObjectDescriptor;

            var objectDescriptorPromise = component3.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
                var serializedDescription = serializer.serializeObject(objectDescriptor);
                expect(serializedDescription).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        describe("test converter objectDescriptor", function () {
            var component = new Component();

            it("should exist", function (done) {
                var objectDescriptorPromise = component.objectDescriptor;
                objectDescriptorPromise.then(function (objectDescriptor) {
                    expect(objectDescriptor).toBeTruthy();
                }).finally(function () {
                    done();
                });
            });

            it("should have element property objectDescriptor", function (done) {
                var objectDescriptorPromise = component.objectDescriptor;
                objectDescriptorPromise.then(function (objectDescriptor) {
                    var propertyDescriptor = objectDescriptor.propertyDescriptorForName("element");
                    expect(propertyDescriptor).toBeTruthy();
                    expect(propertyDescriptor.valueType).toBe("string");
                    expect(propertyDescriptor.readOnly).toBe(true);
                }).finally(function () {
                    done();
                });
            });

            it("should have identifier property objectDescriptor", function (done) {
                var objectDescriptorPromise = component.objectDescriptor;
                objectDescriptorPromise.then(function (objectDescriptor) {
                    var propertyDescriptor = objectDescriptor.propertyDescriptorForName("identifier");
                    expect(propertyDescriptor).toBeTruthy();
                    expect(propertyDescriptor.valueType).toBe("string");
                }).finally(function () {
                    done();
                });
            });

        });

    });

});
