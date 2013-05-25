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

var Serializer = require("montage/core/serialization").Serializer;

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
//            return blueprintPromise.then(function (blueprint) {
//                expect(blueprint).toBeTruthy();
//                var serializer = new Serializer().initWithRequire(require);
//                var serializedDescription = serializer.serializeObject(blueprint);
//                console.log(serializedDescription);
//              });
//        });
//
//    });

    describe("test condition blueprint", function () {
        it("should exist", function () {
            var blueprintPromise = condition.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
              });
        });

    });

    describe("test loader blueprint", function () {
        it("should exist", function () {
            var blueprintPromise = loader.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
              });
        });

    });

    describe("test repetition blueprint", function () {
        it("should exist", function () {
            var blueprintPromise = repetition.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
              });
        });

    });

    describe("test slot blueprint", function () {
        it("should exist", function () {
            var blueprintPromise = slot.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
              });
        });

    });

    describe("test substitution blueprint", function () {
        it("should exist", function () {
            var blueprintPromise = substitution.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
              });
        });

        it("should have switchValue property blueprint", function () {
            var blueprintPromise = substitution.blueprint;
            return blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyBlueprintForName("switchValue");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("string");
            });
        });

        it("should have shouldLoadComponentTree property blueprint", function () {
            var blueprintPromise = substitution.blueprint;
            return blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyBlueprintForName("shouldLoadComponentTree");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("boolean");
            });
        });

        it("should have transition property blueprint", function () {
            var blueprintPromise = substitution.blueprint;
            return blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyBlueprintForName("transition");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("object");
            });
        });


    });

    describe("test text blueprint", function () {
        it("should exist", function () {
            var blueprintPromise = text.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            });
        });

        it("should have value property blueprint", function () {
            var blueprintPromise = text.blueprint;
            return blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyBlueprintForName("value");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("string");
            });
        });

        it("should have converter association blueprint", function () {
            var blueprintPromise = text.blueprint;
            return blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyBlueprintForName("converter");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.isAssociationBlueprint).toBe(true);
                expect(propertyBlueprint.targetBlueprint).toBeTruthy();
            });
        });
    });

});
