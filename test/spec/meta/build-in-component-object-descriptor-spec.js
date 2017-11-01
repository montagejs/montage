/* <copyright>
 </copyright> */
/**
 @requires montage/core/core
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var Condition = require("montage/ui/condition.reel").Condition;
var Loader = require("montage/ui/loader.reel").Loader;
var Repetition = require("montage/ui/repetition.reel").Repetition;
var Slot = require("montage/ui/slot.reel").Slot;
var Substitution = require("montage/ui/substitution.reel").Substitution;
var Text = require("montage/ui/text.reel").Text;

var ObjectDescriptor = require("montage/core/meta/object-descriptor").ObjectDescriptor;

var Serializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer;

describe("meta/build-in-component-object-descriptor-spec", function () {

    var textinput,
        condition,
        loader,
        repetition,
        slot,
        substitution,
        text;

    beforeEach(function () {
//        textinput = new TextInput();
        condition = new Condition();
        loader = new Loader();
        repetition = new Repetition();
        slot = new Slot();
        substitution = new Substitution();
        text = new Text();
    });

    // TODO: Why is this commented out?
//
//    describe("test text input objectDescriptor", function () {
//        it("should exist", function () {
//            var objectDescriptorPromise = textinput.objectDescriptor;
//            objectDescriptorPromise.then(function (objectDescriptor) {
//                expect(objectDescriptor).toBeTruthy();
//                var serializer = new Serializer().initWithRequire(require);
//                var serializedDescription = serializer.serializeObject(objectDescriptor);
//                console.log(serializedDescription);
//              }).finally(function () {
//               done();
//            });
//        });
//
//    });

    describe("test condition objectDescriptor", function () {
        it("should exist", function (done) {
            var objectDescriptorPromise = condition.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

    });

    describe("test loader objectDescriptor", function () {
        it("should exist", function (done) {
            var objectDescriptorPromise = loader.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

    });

    describe("test repetition objectDescriptor", function () {
        it("should exist", function (done) {
            var objectDescriptorPromise = repetition.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

    });

    describe("test slot objectDescriptor", function () {
        it("should exist", function (done) {
            var objectDescriptorPromise = slot.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

    });

    describe("test substitution objectDescriptor", function () {
        it("should exist", function (done) {
            var objectDescriptorPromise = substitution.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        it("should have switchValue property objectDescriptor", function (done) {
            var objectDescriptorPromise = substitution.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                var propertyDescriptor = objectDescriptor.propertyDescriptorForName("switchValue");
                expect(propertyDescriptor).toBeTruthy();
                expect(propertyDescriptor.valueType).toBe("string");
            }).finally(function () {
                done();
            });
        });

        it("should have shouldLoadComponentTree property objectDescriptor", function (done) {
            var objectDescriptorPromise = substitution.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                var propertyDescriptor = objectDescriptor.propertyDescriptorForName("shouldLoadComponentTree");
                expect(propertyDescriptor).toBeTruthy();
                expect(propertyDescriptor.valueType).toBe("boolean");
            }).finally(function () {
                done();
            });
        });

        it("should have transition property objectDescriptor", function (done) {
            var objectDescriptorPromise = substitution.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                var propertyDescriptor = objectDescriptor.propertyDescriptorForName("transition");
                expect(propertyDescriptor).toBeTruthy();
                expect(propertyDescriptor.valueType).toBe("object");
            }).finally(function () {
                done();
            });
        });
    });

    describe("test text objectDescriptor", function () {
        it("should exist", function (done) {
            var objectDescriptorPromise = text.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        it("should have value property objectDescriptor", function (done) {
            var objectDescriptorPromise = text.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                var propertyDescriptor = objectDescriptor.propertyDescriptorForName("value");
                expect(propertyDescriptor).toBeTruthy();
                expect(propertyDescriptor.valueType).toBe("string");
            }).finally(function () {
                done();
            });
        });

        it("should have converter association objectDescriptor", function (done) {
            var objectDescriptorPromise = text.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                var propertyDescriptor = objectDescriptor.propertyDescriptorForName("converter");
                expect(propertyDescriptor).toBeTruthy();
                // TODO: isAssociationBlueprint is deprecated but has no equivalent
                // expect(propertyDescriptor.isAssociationBlueprint).toBe(true);
                expect(propertyDescriptor.valueDescriptor).toBeTruthy();
            }).catch(fail).finally(done);
        });
    });

});
