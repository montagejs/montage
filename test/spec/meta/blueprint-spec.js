"use strict";
/**
 @module montage/data/blueprint-spec.js
 @requires montage/core/core
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var Blueprint = require("montage/core/meta/blueprint").Blueprint;
var Model = require("montage/core/meta/model").Model;
var PropertyDescriptor = require("montage/core/meta/property-descriptor").PropertyDescriptor;
var AssociationBlueprint = require("montage/core/meta/association-blueprint").AssociationBlueprint;

var Serializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer;
var Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer;

var BinderHelper = require("./blueprint/binderhelper").BinderHelper;
var Person = require("./blueprint/person").Person;
var Company = require("./blueprint/company").Company;


var logger = require("montage/core/logger").logger("./blueprint-spec.js");

describe("meta/blueprint-spec", function () {
    describe("Binder", function () {
        describe("Creation", function () {
        });
        describe("Adding blueprints", function () {
            var binder = new Model().initWithNameAndRequire("CompanyBinder", require);
            var personBlueprint = new Blueprint().initWithName("Person");
            binder.addObjectDescriptor(personBlueprint);

            var companyBlueprint = new Blueprint().initWithName("Company");
            binder.addObjectDescriptor(companyBlueprint);

            it("should have a binder", function () {
                expect(personBlueprint.model).toBe(binder);
                expect(companyBlueprint.model).toBe(binder);
            });

        });
    });

    describe("Blueprint", function () {
        describe("propertyBlueprints", function () {
            var blueprint = new Blueprint().initWithName("Person");
            var propertyBlueprint = blueprint.newPropertyDescriptor("foo", 1);
            it("should be able to add", function () {
                blueprint.addPropertyDescriptor(propertyBlueprint);
                expect(propertyBlueprint.owner).toBe(blueprint);
                expect(blueprint.propertyDescriptorForName("foo")).toBe(propertyBlueprint);
            });

            it("should be able to remove", function () {
                blueprint.removePropertyDescriptor(propertyBlueprint);
                expect(propertyBlueprint.owner).toBe(null);
                expect(blueprint.propertyDescriptorForName("foo")).toBeNull();
            });
        });
        describe("associations", function () {

            var personBlueprint = new Blueprint().initWithName("Person");
            var companyBlueprint = new Blueprint().initWithName("Company");

            var employerAssociation = personBlueprint.newAssociationBlueprint("employer", Infinity);
            employerAssociation.valueDescriptor = companyBlueprint;
            var employeesAssociation = companyBlueprint.newAssociationBlueprint("employees", Infinity);
            employeesAssociation.valueDescriptor = personBlueprint;

            personBlueprint.addPropertyDescriptor(employerAssociation);
            companyBlueprint.addPropertyDescriptor(employeesAssociation);

            it("basic properties should be correct", function () {
                expect(personBlueprint.propertyDescriptorForName("employer")).toBe(employerAssociation);
                expect(companyBlueprint.propertyDescriptorForName("employees")).toBe(employeesAssociation);
            });
            it("target blueprint promise to be resolved", function (done) {
                personBlueprint.propertyDescriptorForName("employer").valueDescriptor.then(function (blueprint) {
                    expect(blueprint).toBeTruthy();
                    expect(blueprint).toBe(companyBlueprint);
                }).finally(function () {
                    done();
                });
            });
            it("target blueprint promise to be resolved", function (done) {
                companyBlueprint.propertyDescriptorForName("employees").valueDescriptor.then(function (blueprint) {
                    expect(blueprint).toBeTruthy();
                    expect(blueprint).toBe(personBlueprint);
                }).finally(function () {
                    done();
                });
            });
        });
        describe("blueprint to instance association", function () {
            var binder, personBlueprint, companyBlueprint;
            beforeEach(function () {
                binder = new Model().initWithNameAndRequire("Binder", require);
                personBlueprint = new Blueprint().initWithName("Person");
                binder.addObjectDescriptor(personBlueprint);
                companyBlueprint = new Blueprint().initWithName("Company");
                binder.addObjectDescriptor(companyBlueprint);
            });
            it("should be found with the blueprint name", function () {
                expect(binder.objectDescriptorForName("Person")).toBe(personBlueprint);
                expect(binder.objectDescriptorForName("Company")).toBe(companyBlueprint);
            });
        });
        describe("applying a basic blueprint to a prototype", function () {
            var louis, personBlueprint;
            beforeEach(function () {
                var binder = new Model().initWithNameAndRequire("Binder", require);
                personBlueprint = new Blueprint().initWithName("Person");
                personBlueprint.addPropertyDescriptor(personBlueprint.newPropertyDescriptor("name", 1));
                personBlueprint.addPropertyDescriptor(personBlueprint.newPropertyDescriptor("keywords", Infinity));

                binder.addObjectDescriptor(personBlueprint);
                Model.group.addModel(binder);

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

        describe("adding a PropertyDescriptor", function () {
            var circle, shapeBlueprint;
            beforeEach(function () {
                var binder = new Model().initWithNameAndRequire("Binder", require);
                shapeBlueprint = new Blueprint().initWithName("Shape");
                binder.addObjectDescriptor(shapeBlueprint);
                var propertyBlueprint = shapeBlueprint.newPropertyDescriptor("size", 1);
                shapeBlueprint.addPropertyDescriptor(propertyBlueprint);
                propertyBlueprint = shapeBlueprint.newPropertyDescriptor("readOnlyPropertyDescriptor", 1);
                propertyBlueprint.readOnly = true;
                shapeBlueprint.addPropertyDescriptor(propertyBlueprint);
                propertyBlueprint = shapeBlueprint.newPropertyDescriptor("mandatoryPropertyDescriptor", 1);
                propertyBlueprint.mandatory = true;
                shapeBlueprint.addPropertyDescriptor(propertyBlueprint);
                propertyBlueprint = shapeBlueprint.newPropertyDescriptor("denyDelete", 1);
                propertyBlueprint.denyDelete = true;
                shapeBlueprint.addPropertyDescriptor(propertyBlueprint);
                Model.group.addModel(binder);

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
                    expect(function () {
                        circle.readOnlyPropertyDescriptor = "big";
                    }).toThrow();
                });
                it("should have a get and no set", function () {
                    var descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(circle), "readOnlyPropertyDescriptor");
                    expect(typeof descriptor.get).toEqual("function");
                    expect(typeof descriptor.set).toEqual("undefined");
                });
            });
            xdescribe("mandatory propertyBlueprint's property", function () {
                it("should not be settable", function () {
                    expect(
                        function () {
                            circle.readOnlyPropertyDescriptor = "big";
                        }).toThrow();
                });
                it("should have a get and no set", function () {
                    var descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(circle), "readOnlyPropertyDescriptor");
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
            var companyBinder = BinderHelper.companyBinder(),
                personBlueprint = companyBinder.blueprintForName("Person");

            personBlueprint.maxAge = 60;


            it("can serialize", function () {
                var serializedBinder = new Serializer().initWithRequire(require).serializeObject(companyBinder);
                expect(serializedBinder).not.toBeNull();
            });
            it("can deserialize", function (done) {
                var serializedBinder = new Serializer().initWithRequire(global.require).serializeObject(companyBinder);
                var deserializer = new Deserializer().init(serializedBinder, global.require).deserializeObject().then(function (deserializedBinder) {
                    var metadata = Montage.getInfoForObject(deserializedBinder);
                    expect(serializedBinder).not.toBeNull();
                    expect(metadata.objectName).toBe("Model");
                    expect(metadata.moduleId).toBe("core/meta/model");
                    var personBlueprint = deserializedBinder.objectDescriptorForName("Person");
                    expect(personBlueprint).toBeTruthy();
                    expect(personBlueprint.propertyBlueprintForName("phoneNumbers")).not.toBeNull();
                    expect(personBlueprint.maxAge).toBe(60);
                }).finally(function () {
                    done();
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
                expect(info.moduleId).toBe("spec/meta/blueprint/person");
                expect(info.objectName).toBe("Person");
            });
        });

        describe("createDefaultObjectDescriptorForObject", function () {
            it("should always return a promise", function (done) {
                var blueprint = Blueprint.createDefaultObjectDescriptorForObject({});
                expect(typeof blueprint.then).toBe("function");
                blueprint.then(function (blueprint) {
                    expect(Blueprint.prototype.isPrototypeOf(blueprint)).toBe(true);
                }).finally(function () {
                    done();
                });
            });

            it("has the correct module id for the parent", function (done) {
                var ComponentBlueprintTest1 = require("spec/meta/component-blueprint-test/component-blueprint-test-1.reel").ComponentBlueprintTest1;
                Blueprint.createDefaultObjectDescriptorForObject(ComponentBlueprintTest1)
                .then(function (blueprint) {
                    var id = blueprint.parent.objectDescriptorInstanceModule.resolve(require);
                    expect(id === "montage/ui/component.meta" || id === "montage/ui/component.mjson").toBeTruthy();
                }).finally(function () {
                    done();
                });
            });

        });

        describe("blueprint descriptor", function () {
            // Fixme: Spec was already broken before removing constructor compatibility (an unrelated error was raised)
            // Before removing constructor compatibility, it was possible to reproduce this issue by setting a constructor descriptor.
            //it("does not work for objects that aren't in a module", function () {
            //    var Sub = Blueprint.specialize();
            //    var sub = new Sub();
            //
            //    expect(function () {
            //        var x = sub.blueprint;
            //    }).toThrow();
            //});


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

                expect(sub.blueprintModuleId === "pass.meta" || sub.blueprintModuleId === "pass.mjson").toBeTruthy();
            });

            it("creates a blueprint when the parent has no blueprint", function (done) {
                Blueprint.blueprint.then(function (blueprint){
                    expect( blueprint.objectDescriptorInstanceModule.id === "core/meta/blueprint.meta" ||
                            blueprint.objectDescriptorInstanceModule.id === "core/meta/object-descriptor.mjson").toBeTruthy();
                }).finally(function () {
                    done();
                });
            });
        });

        describe("events", function () {
            var EventDescriptor = require("montage/core/meta/event-descriptor").EventDescriptor;

            var blueprint;
            beforeEach(function () {
                blueprint = new Blueprint().initWithName("test");
            });

            describe("eventDescriptors", function () {
                it("returns the same array", function () {
                    blueprint.addEventDescriptorNamed("event");
                    var eventDescriptors = blueprint.eventDescriptors;
                    expect(blueprint.eventDescriptors).toBe(eventDescriptors);
                });
            });

            describe("adding", function () {
                var eventBlueprint;
                afterEach(function () {
                    expect(blueprint.eventDescriptors.length).toEqual(1);
                    expect(blueprint.eventDescriptors[0]).toBe(eventBlueprint);
                });

                it("adds an existing blueprint", function () {
                    eventBlueprint = new EventDescriptor().initWithNameAndObjectDescriptor("event");
                    blueprint.addEventDescriptor(eventBlueprint);

                    expect(eventBlueprint.owner).toBe(blueprint);
                    expect(blueprint.eventDescriptorForName("event")).toBe(eventBlueprint);
                });

                it("only adds the blueprint once", function () {
                    eventBlueprint = new EventDescriptor().initWithNameAndObjectDescriptor("event");

                    blueprint.addEventDescriptor(eventBlueprint);
                    blueprint.addEventDescriptor(eventBlueprint);

                    expect(eventBlueprint.owner).toBe(blueprint);
                    expect(blueprint.eventDescriptorForName("event")).toBe(eventBlueprint);
                });

                it("creates a new blueprint with the given name", function () {
                    eventBlueprint = blueprint.addEventDescriptorNamed("event");

                    expect(eventBlueprint.owner).toBe(blueprint);
                    expect(eventBlueprint.name).toEqual("event");
                    expect(blueprint.eventDescriptorForName("event")).toBe(eventBlueprint);
                });
            });

            it("creates a new event blueprint", function () {
                var eventBlueprint = blueprint.newEventDescriptor("event");

                expect(eventBlueprint.name).toEqual("event");
                expect(eventBlueprint.owner).toBe(blueprint);
            });

            it("removes an existing blueprint", function () {
                var eventBlueprint = blueprint.addEventDescriptorNamed("event");
                blueprint.removeEventDescriptor(eventBlueprint);

                expect(eventBlueprint.owner).toBe(null);
                expect(blueprint.eventDescriptorForName("event")).toBe(null);
            });


            it("removes an existing blueprint from it's previous owner", function () {
                var oldBlueprint = new Blueprint().initWithName("old");

                var eventBlueprint = new EventDescriptor().initWithNameAndObjectDescriptor("event", oldBlueprint);
                blueprint.addEventDescriptor(eventBlueprint);

                expect(eventBlueprint.owner).toBe(blueprint);
                expect(blueprint.eventDescriptorForName("event")).toBe(eventBlueprint);

                expect(oldBlueprint.eventDescriptorForName("event")).toBe(null);
            });

            it("lists event blueprints of the parent", function () {
                var parentBlueprint = new Blueprint().initWithName("parent");
                blueprint.parent = parentBlueprint;

                var parentEvent = parentBlueprint.addEventDescriptorNamed("parentEvent");
                var event = blueprint.addEventDescriptorNamed("event");

                expect(blueprint.eventDescriptors.length).toEqual(2);
                expect(blueprint.eventDescriptors).toEqual([event, parentEvent]);
            });
        });
    });
});
