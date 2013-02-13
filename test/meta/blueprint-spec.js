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

var Serializer = require("montage/core/serializer").Serializer;
var Deserializer = require("montage/core/deserializer").Deserializer;

var BinderHelper = require("meta/blueprint/binderhelper").BinderHelper;
var Person = require("meta/blueprint/person").Person;
var Company = require("meta/blueprint/company").Company;


var logger = require("montage/core/logger").logger("meta/blueprint-spec.js");

describe("meta/blueprint-spec", function () {
    describe("Binder", function () {
        describe("Creation", function () {
        });
        describe("Adding blueprints", function () {
            var binder = Binder.create().initWithName("CompanyBinder");

            var personBlueprint = Blueprint.create().initWithName("Person");
            binder.addBlueprint(personBlueprint);

            var companyBlueprint = Blueprint.create().initWithName("Company");
            binder.addBlueprint(companyBlueprint);

            it("should have a binder", function () {
                expect(personBlueprint.binder).toBe(binder);
                expect(companyBlueprint.binder).toBe(binder);
            });

        });
    });

    describe("Blueprint", function () {
        describe("propertyBlueprints", function () {
            var blueprint = Blueprint.create().initWithName("Person");
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

            var personBlueprint = Blueprint.create().initWithName("Person");
            var companyBlueprint = Blueprint.create().initWithName("Company");

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
            var binder = Binder.create().initWithName("Binder");
            var personBlueprint = Blueprint.create().initWithName("Person");
            personBlueprint.moduleId = "mymodule";
            binder.addBlueprint(personBlueprint);
            var companyBlueprint = Blueprint.create().initWithName("Company");
            companyBlueprint.prototypeName = "Firm";
            companyBlueprint.moduleId = "mymodule";
            binder.addBlueprint(companyBlueprint);
            it("should be found with a prototypeName and moduleId", function () {
                expect(binder.blueprintForPrototype("Person", "mymodule")).toBe(personBlueprint);
                expect(binder.blueprintForPrototype("Firm", "mymodule")).toBe(companyBlueprint);
            });
        });
        describe("applying a basic blueprint to a prototype", function () {
            var louis, personBlueprint;
            beforeEach(function () {
                var binder = Binder.create().initWithName("Binder");
                personBlueprint = Blueprint.create().initWithNameAndModuleId("Person", "mymodule");
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
                var binder = Binder.create().initWithName("Binder");
                shapeBlueprint = Blueprint.create().initWithNameAndModuleId("Shape", "mymodule");
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
                var serializedBinder = Serializer.create().initWithRequire(require).serializeObject(companyBinder);
                console.log(serializedBinder);
                expect(serializedBinder).not.toBeNull();
            });
            it("can deserialize", function () {
                var serializedBinder = Serializer.create().initWithRequire(require).serializeObject(companyBinder);
                Deserializer.create().initWithStringAndRequire(serializedBinder, require).deserializeObject(function (deserializedBinder) {
                    var metadata = Montage.getInfoForObject(deserializedBinder);
                    expect(serializedBinder).not.toBeNull();
                    expect(metadata.objectName).toBe("Binder");
                    expect(metadata.moduleId).toBe("core/meta/binder");
                    var personBlueprint = deserializedBinder.blueprintForPrototype("Person", "meta/blueprint/person");
                    expect(personBlueprint).not.toBeNull();
                    expect(personBlueprint.propertyBlueprintForName("phoneNumbers")).not.toBeNull();
                }, require);
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

    });
});
