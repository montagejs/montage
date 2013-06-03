/* <copyright>
 </copyright> */
/**
 @module montage/data/blueprint-spec.js
 @requires montage/core/core
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var Blueprint = require("montage/core/meta/blueprint").Blueprint;
var Binder = require("montage/core/meta/blueprint").Binder;
var PropertyBlueprint = require("montage/core/meta/blueprint").PropertyBlueprint;
var AssociationBlueprint = require("montage/core/meta/blueprint").AssociationBlueprint;

var ParentController = require("meta/controller-blueprint-test/parent-controller").ParentController;
var ChildController = require("meta/controller-blueprint-test/child-controller").ChildController;
var TestController = require("meta/controller-blueprint-test/test-controller").TestController;

var Serializer = require("montage/core/serialization").Serializer;

var logger = require("montage/core/logger").logger("meta/blueprint-spec.js");

describe("meta/controller-blueprint-spec", function () {

    describe("Controller Blueprint", function () {
        it("Adding blueprints to controller", function () {
            var serializer = new Serializer().initWithRequire(require);

            var testController = new TestController().init();

            var newBlueprint = new Blueprint().initWithName("TestController");
            testController.blueprint = newBlueprint;

            // This is for test only it. in a real app we need a customer blueprint and those would be association
            newBlueprint.addToManyPropertyBlueprintNamed("customerList");
            newBlueprint.addToManyPropertyBlueprintNamed("customerSelectionList");


            var blueprintPromise = testController.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
                var serializedDescription = serializer.serializeObject(blueprint);
                expect(serializedDescription).toBeTruthy();
                //console.log(serializedDescription);
            });
        });

        it("Loading controller blueprint", function () {
            var parentController = new ParentController().init();

            var blueprintPromise = parentController.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
                expect(blueprint.propertyBlueprintForName("customerList")).toBeTruthy();
                expect(blueprint.propertyBlueprintForName("customerSelectionList")).toBeTruthy();
            });
        });

        it("Adding blueprints to controller parent", function () {
            var serializer = new Serializer().initWithRequire(require);

            var parentController = new ParentController().init();
            var testController = new TestController().init();

            var parentBlueprint = new Blueprint().initWithName("ParentController");
            parentController.blueprint = parentBlueprint;

            // This is for test only it. in a real app we need a customer blueprint and those would be association
            parentBlueprint.addToManyPropertyBlueprintNamed("customerList");
            parentBlueprint.addToManyPropertyBlueprintNamed("customerSelectionList");

            var newBlueprint = new Blueprint().initWithName("TestController");
            testController.blueprint = newBlueprint;
            newBlueprint.parent = parentBlueprint;

            var blueprintPromise = testController.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
                var serializedDescription = serializer.serializeObject(blueprint);
                expect(serializedDescription).toBeTruthy();
                //console.log(serializedDescription);
            });
        });

        it("Loading child controller blueprint", function () {
            var childController = new ChildController().init();

            var blueprintPromise = childController.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
                expect(blueprint.propertyBlueprintForName("customerList")).toBeTruthy();
                expect(blueprint.propertyBlueprintForName("customerSelectionList")).toBeTruthy();
                expect(blueprint.propertyBlueprintForName("purchaseList")).toBeTruthy();
            });
        });

        it("Create a default controller blueprint", function () {
            var serializer = new Serializer().initWithRequire(require);

            var testController = new TestController().init();
            testController.blueprint = null;

            var blueprintPromise = testController.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
                expect(blueprint.propertyBlueprintForName("customerList")).toBeTruthy();
                expect(blueprint.propertyBlueprintForName("customerSelectionList")).toBeTruthy();
                var serializedDescription = serializer.serializeObject(blueprint);
                expect(serializedDescription).toBeTruthy();
                //console.log(serializedDescription);
            });
        });

    });

});
