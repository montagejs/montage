/* <copyright>
 </copyright> */
/**
 @module montage/data/blueprint-spec.js
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

var Blueprint = require("montage/core/meta/blueprint").Blueprint;
var Binder = require("montage/core/meta/blueprint").Binder;
var PropertyBlueprint = require("montage/core/meta/blueprint").PropertyBlueprint;
var AssociationBlueprint = require("montage/core/meta/blueprint").AssociationBlueprint;

var Serializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer;

describe("meta/build-in-component-blueprint-spec", function () {

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
//
//    describe("test text input blueprint", function () {
//        it("should exist", function () {
//            var blueprintPromise = textinput.blueprint;
//            blueprintPromise.then(function (blueprint) {
//                expect(blueprint).toBeTruthy();
//                var serializer = new Serializer().initWithRequire(require);
//                var serializedDescription = serializer.serializeObject(blueprint);
//                console.log(serializedDescription);
//              }).finally(function () {
//               done();
//            });
//        });
//
//    });

    describe("test condition blueprint", function () {
        it("should exist", function (done) {
            var blueprintPromise = condition.blueprint;
            blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

    });

    describe("test loader blueprint", function () {
        it("should exist", function (done) {
            var blueprintPromise = loader.blueprint;
            blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

    });

    describe("test repetition blueprint", function () {
        it("should exist", function (done) {
            var blueprintPromise = repetition.blueprint;
            blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

    });

    describe("test slot blueprint", function () {
        it("should exist", function (done) {
            var blueprintPromise = slot.blueprint;
            blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

    });

    describe("test substitution blueprint", function () {
        it("should exist", function (done) {
            var blueprintPromise = substitution.blueprint;
            blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        it("should have switchValue property blueprint", function (done) {
            var blueprintPromise = substitution.blueprint;
            blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyBlueprintForName("switchValue");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("string");
            }).finally(function () {
                done();
            });
        });

        it("should have shouldLoadComponentTree property blueprint", function (done) {
            var blueprintPromise = substitution.blueprint;
            blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyBlueprintForName("shouldLoadComponentTree");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("boolean");
            }).finally(function () {
                done();
            });
        });

        it("should have transition property blueprint", function (done) {
            var blueprintPromise = substitution.blueprint;
            blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyBlueprintForName("transition");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("object");
            }).finally(function () {
                done();
            });
        });
    });

    describe("test text blueprint", function () {
        it("should exist", function (done) {
            var blueprintPromise = text.blueprint;
            blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        it("should have value property blueprint", function (done) {
            var blueprintPromise = text.blueprint;
            blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyBlueprintForName("value");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("string");
            }).finally(function () {
                done();
            });
        });

        it("should have converter association blueprint", function (done) {
            var blueprintPromise = text.blueprint;
            blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyBlueprintForName("converter");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.isAssociationBlueprint).toBe(true);
                expect(propertyBlueprint.targetBlueprint).toBeTruthy();
            }).finally(function () {
                done();
            });
        });
    });

});
