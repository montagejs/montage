/* <copyright>
 </copyright> */
/**
 @requires montage/core/core
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var ObjectDescriptor = require("montage/core/meta/object-descriptor").ObjectDescriptor;

var ParentController = require("spec/meta/controller-object-descriptor-test/parent-controller").ParentController;
var ChildController = require("spec/meta/controller-object-descriptor-test/child-controller").ChildController;
var TestController = require("spec/meta/controller-object-descriptor-test/test-controller").TestController;

var Serializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer;

var logger = require("montage/core/logger").logger("meta/object-descriptor-spec.js");

describe("meta/controller-object-descriptor-spec", function () {

    describe("Controller ObjectDescriptor", function () {
        it("Adding object descriptors to controller", function (done) {
            var serializer = new Serializer().initWithRequire(require);

            var testController = new TestController().init();

            var newObjectDescriptor = new ObjectDescriptor().initWithName("TestController");
            testController.objectDescriptor = newObjectDescriptor;

            // This is for test only it. in a real app we need a customer objectDescriptor and those would be association
            newObjectDescriptor.addToManyPropertyDescriptorNamed("customerList");
            newObjectDescriptor.addToManyPropertyDescriptorNamed("customerSelectionList");


            var objectDescriptorPromise = testController.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
                var serializedDescription = serializer.serializeObject(objectDescriptor);
                expect(serializedDescription).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        it("Loading controller objectDescriptor", function (done) {
            var parentController = new ParentController().init();

            var objectDescriptorPromise = parentController.objectDescriptor;
            return objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
                expect(objectDescriptor.propertyDescriptorForName("customerList")).toBeTruthy();
                expect(objectDescriptor.propertyDescriptorForName("customerSelectionList")).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        it("Adding objectDescriptors to controller parent", function (done) {
            var serializer = new Serializer().initWithRequire(require);

            var parentController = new ParentController().init();
            var testController = new TestController().init();

            var parentObjectDescriptor = new ObjectDescriptor().initWithName("ParentController");
            parentController.objectDescriptor = parentObjectDescriptor;

            // This is for test only it. in a real app we need a customer objectDescriptor and those would be association
            parentObjectDescriptor.addToManyPropertyDescriptorNamed("customerList");
            parentObjectDescriptor.addToManyPropertyDescriptorNamed("customerSelectionList");

            var newObjectDescriptor = new ObjectDescriptor().initWithName("TestController");
            testController.objectDescriptor = newObjectDescriptor;
            newObjectDescriptor.parent = parentObjectDescriptor;

            var objectDescriptorPromise = testController.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
                var serializedDescription = serializer.serializeObject(objectDescriptor);
                expect(serializedDescription).toBeTruthy();
                //console.log(serializedDescription);
            }).finally(function () {
                done();
            });
        });

        it("Loading child controller objectDescriptor", function (done) {
            var childController = new ChildController().init();

            var objectDescriptorPromise = childController.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
                expect(objectDescriptor.propertyDescriptorForName("customerList")).toBeTruthy();
                expect(objectDescriptor.propertyDescriptorForName("customerSelectionList")).toBeTruthy();
                expect(objectDescriptor.propertyDescriptorForName("purchaseList")).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        it("Create a default controller objectDescriptor", function (done) {
            var serializer = new Serializer().initWithRequire(require);

            var testController = new TestController().init();
            testController.objectDescriptor = null;

            var objectDescriptorPromise = testController.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
                expect(objectDescriptor.propertyDescriptorForName("customerList")).toBeTruthy();
                expect(objectDescriptor.propertyDescriptorForName("customerSelectionList")).toBeTruthy();
                var serializedDescription = serializer.serializeObject(objectDescriptor);
                expect(serializedDescription).toBeTruthy();
                //console.log(serializedDescription);
            }).finally(function () {
                done();
            });
        });
    });
});
