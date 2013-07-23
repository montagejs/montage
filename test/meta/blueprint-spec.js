"use strict";
/**
 @module montage/data/blueprint-spec.js
 @requires montage/core/core
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var Blueprint = require("montage/core/meta/blueprint").Blueprint;
var Binder = require("montage/core/meta/binder").Binder;
var PropertyBlueprint = require("montage/core/meta/property-blueprint").PropertyBlueprint;
var AssociationBlueprint = require("montage/core/meta/association-blueprint").AssociationBlueprint;

var Serializer = require("montage/core/serialization").Serializer;
var Deserializer = require("montage/core/serialization").Deserializer;

var BinderHelper = require("meta/blueprint/binderhelper").BinderHelper;
var Person = require("meta/blueprint/person").Person;
var Company = require("meta/blueprint/company").Company;


var logger = require("montage/core/logger").logger("meta/blueprint-spec.js");

describe("meta/blueprint-spec", function () {
    describe("Binder", function () {
        describe("Creation", function () {
        });
        describe("Adding blueprints", function () {
            var binder = new Binder().initWithNameAndRequire("CompanyBinder", global.require);

            var personBlueprint = new Blueprint().initWithName("Person");
            binder.addBlueprint(personBlueprint);

            var companyBlueprint = new Blueprint().initWithName("Company");
            binder.addBlueprint(companyBlueprint);

            it("should have a binder", function () {
                expect(personBlueprint.binder).toBe(binder);
                expect(companyBlueprint.binder).toBe(binder);
            });

        });
    });

    describe("Blueprint", function () {
        describe("propertyBlueprints", function () {
            var blueprint = new Blueprint().initWithName("Person");
            var propertyBlueprint = blueprint.newPropertyBlueprint("foo", 1);
            it("should be able to add", function () {
                blueprint.addPropertyBlueprint(propertyBlueprint);
                expect(propertyBlueprint.owner).toBe(blueprint);
                expect(blueprint.propertyBlueprintForName("foo")).toBe(propertyBlueprint);
            });

            it("should be able to remove", function () {
                blueprint.removePropertyBlueprint(propertyBlueprint);
                expect(propertyBlueprint.owner).toBe(null);
                expect(blueprint.propertyBlueprintForName("foo")).toBeNull();
            });
        });
        describe("associations", function () {

            var personBlueprint = new Blueprint().initWithName("Person");
            var companyBlueprint = new Blueprint().initWithName("Company");

            var employerAssociation = personBlueprint.newAssociationBlueprint("employer", Infinity);
            employerAssociation.targetBlueprint = companyBlueprint;
            var employeesAssociation = companyBlueprint.newAssociationBlueprint("employees", Infinity);
            employeesAssociation.targetBlueprint = personBlueprint;

            personBlueprint.addPropertyBlueprint(employerAssociation);
            companyBlueprint.addPropertyBlueprint(employeesAssociation);

            it("basic properties should be correct", function () {
                expect(personBlueprint.propertyBlueprintForName("employer")).toBe(employerAssociation);
                expect(companyBlueprint.propertyBlueprintForName("employees")).toBe(employeesAssociation);
            });
            it("target blueprint promise to be resolved", function () {
                return personBlueprint.propertyBlueprintForName("employer").targetBlueprint.then(function (blueprint) {
                    expect(blueprint).toBeTruthy();
                    expect(blueprint).toBe(companyBlueprint);
                });
            });
            it("target blueprint promise to be resolved", function () {
                return companyBlueprint.propertyBlueprintForName("employees").targetBlueprint.then(function (blueprint) {
                    expect(blueprint).toBeTruthy();
                    expect(blueprint).toBe(personBlueprint);
                });
            });
        });
        describe("blueprint to instance association", function () {
            var binder, personBlueprint, companyBlueprint;
            beforeEach(function () {
                binder = new Binder().initWithNameAndRequire("Binder", global.require);
                personBlueprint = new Blueprint().initWithName("Person");
                personBlueprint.moduleId = "mymodule";
                binder.addBlueprint(personBlueprint);
                companyBlueprint = new Blueprint().initWithName("Company");
                companyBlueprint.prototypeName = "Firm";
                companyBlueprint.moduleId = "mymodule";
                binder.addBlueprint(companyBlueprint);
            });
            it("should be found with a prototypeName and moduleId", function () {
                expect(binder.blueprintForPrototype("Person", "mymodule")).toBe(personBlueprint);
                expect(binder.blueprintForPrototype("Firm", "mymodule")).toBe(companyBlueprint);
            });
        });
        describe("applying a basic blueprint to a prototype", function () {
            var louis, personBlueprint;
            beforeEach(function () {
                var binder = new Binder().initWithNameAndRequire("Binder", global.require);
                personBlueprint = new Blueprint().initWithName("Person");
                personBlueprint.addPropertyBlueprint(personBlueprint.newPropertyBlueprint("name", 1));
                personBlueprint.addPropertyBlueprint(personBlueprint.newPropertyBlueprint("keywords", Infinity));

                binder.addBlueprint(personBlueprint);
                Binder.manager.addBinder(binder);

                louis = personBlueprint.newInstance().init();
            });

            it("should have a blueprint", function () {
                expect(louis.blueprint).toBe(personBlueprint);
            });
            it("should have a the correct properties defined", function () {
                expect(Object.getPrototypeOf(louis).hasOwnProperty("name")).toBeTruthy();
                expect(Object.getPrototypeOf(louis).hasOwnProperty("keywords")).toBeTruthy();
            });
        });

        describe("adding a PropertyBlueprint", function () {
            var circle, shapeBlueprint;
            beforeEach(function () {
                var binder = new Binder().initWithNameAndRequire("Binder", global.require);
                shapeBlueprint = new Blueprint().initWithName("Shape");
                binder.addBlueprint(shapeBlueprint);
                var propertyBlueprint = shapeBlueprint.newPropertyBlueprint("size", 1);
                shapeBlueprint.addPropertyBlueprint(propertyBlueprint);
                propertyBlueprint = shapeBlueprint.newPropertyBlueprint("readOnlyPropertyBlueprint", 1);
                propertyBlueprint.readOnly = true;
                shapeBlueprint.addPropertyBlueprint(propertyBlueprint);
                propertyBlueprint = shapeBlueprint.newPropertyBlueprint("mandatoryPropertyBlueprint", 1);
                propertyBlueprint.mandatory = true;
                shapeBlueprint.addPropertyBlueprint(propertyBlueprint);
                propertyBlueprint = shapeBlueprint.newPropertyBlueprint("denyDelete", 1);
                propertyBlueprint.denyDelete = true;
                shapeBlueprint.addPropertyBlueprint(propertyBlueprint);
                Binder.manager.addBinder(binder);

                circle = shapeBlueprint.newInstance().init();
            });
            describe("normal propertyBlueprint's property", function () {
                it("should be settable", function () {
                    var descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(circle), "size");
                    expect(typeof descriptor.get).toEqual("function");
                    expect(typeof descriptor.set).toEqual("function");
                    expect(circle.size).toBeNull();
                    circle.size = "big";
                    expect(circle.size).toEqual("big");
                });
                it("should be enumerable", function () {
                    var descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(circle), "size");
                    expect(descriptor.enumerable).toBeTruthy();
                });
                it("should have a get and set", function () {
                    var descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(circle), "size");
                    expect(typeof descriptor.get).toEqual("function");
                    expect(typeof descriptor.set).toEqual("function");
                });
            });
            describe("read only propertyBlueprint's property", function () {
                it("should not be settable", function () {
                    expect(
                        function () {
                            circle.readOnlyPropertyBlueprint = "big";
                        }).toThrow();
                });
                it("should have a get and no set", function () {
                    var descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(circle), "readOnlyPropertyBlueprint");
                    expect(typeof descriptor.get).toEqual("function");
                    expect(typeof descriptor.set).toEqual("undefined");
                });
            });
            xdescribe("mandatory propertyBlueprint's property", function () {
                it("should not be settable", function () {
                    expect(
                        function () {
                            circle.readOnlyPropertyBlueprint = "big";
                        }).toThrow();
                });
                it("should have a get and no set", function () {
                    var descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(circle), "readOnlyPropertyBlueprint");
                    expect(typeof descriptor.get).toEqual("function");
                    expect(typeof descriptor.set).toEqual("undefined");
                });
            });
            describe("denyDelete propertyBlueprint's property", function () {
                it("should not be settable to null", function () {
                    circle.denyDelete = "big";
                    expect(
                        function () {
                            circle.denyDelete = null;
                        }).toThrow();
                });
            });
        });

        describe("serializing", function () {
            var companyBinder = BinderHelper.companyBinder();

            it("can serialize", function () {
                var serializedBinder = new Serializer().initWithRequire(require).serializeObject(companyBinder);
                //console.log(serializedBinder);
                expect(serializedBinder).not.toBeNull();
            });
            it("can deserialize", function () {
                var serializedBinder = new Serializer().initWithRequire(require).serializeObject(companyBinder);
                return new Deserializer().init(serializedBinder, require).deserializeObject().then(function (deserializedBinder) {
                    var metadata = Montage.getInfoForObject(deserializedBinder);
                    expect(serializedBinder).not.toBeNull();
                    expect(metadata.objectName).toBe("Binder");
                    expect(metadata.moduleId).toBe("core/meta/binder");
                    var personBlueprint = deserializedBinder.blueprintForPrototype("Person", "meta/blueprint/person");
                    expect(personBlueprint).toBeTruthy();
                    expect(personBlueprint.propertyBlueprintForName("phoneNumbers")).not.toBeNull();
                });
            });
        });

        describe("create new prototype", function () {

            it("Should be a prototype", function () {
                var info = Montage.getInfoForObject(Person);
                expect(info.isInstance).toBeFalsy();
            });

            it("Should have the right moduleId and Name", function () {
                var info = Montage.getInfoForObject(Person);
                expect(info.moduleId).toBe("meta/blueprint/person");
                expect(info.objectName).toBe("Person");
            });
        });

        describe("createDefaultBlueprintForObject", function () {
            it("should always return a promise", function () {
                var blueprint = Blueprint.createDefaultBlueprintForObject({});
                expect(typeof blueprint.then).toBe("function");
                return blueprint.then(function (blueprint) {
                    expect(Blueprint.prototype.isPrototypeOf(blueprint)).toBe(true);
                });
            });

        });

        describe("blueprint descriptor", function () {
            it("does not work for objects that aren't in a module", function () {
                var Sub = Blueprint.specialize();
                var sub = new Sub();

                expect(function () {
                    var x = sub.blueprint;
                }).toThrow();
            });


            it("uses the correct module ID for objects with no .meta", function () {
                var Sub = Blueprint.specialize();
                // fake object loaded from module
                Object.defineProperty(Sub, "_montage_metadata", {
                    value: {
                        require: require,
                        module: "pass",
                        moduleId: "pass", // deprecated
                        property: "Pass",
                        objectName: "Pass", // deprecated
                        isInstance: false
                    }
                });

                var sub = new Sub();
                sub._montage_metadata = Object.create(Sub._montage_metadata, {
                    isInstance: { value: true }
                });

                expect(sub.blueprintModuleId).toBe("pass.meta");
            });

            it("creates a blueprint when the parent has no blueprint", function () {
                return Blueprint.blueprint.then(function (blueprint){
                    expect(blueprint.blueprintInstanceModule.id).toBe("core/meta/blueprint.meta");
                });
            });
        });

    });
});
