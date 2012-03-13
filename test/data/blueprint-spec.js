/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var ToOneAttribute = require("montage/data/blueprint").ToOneAttribute;
var ToManyAttribute = require("montage/data/blueprint").ToManyAttribute;
var ToOneRelationship = require("montage/data/blueprint").ToOneRelationship;
var ToManyRelationship = require("montage/data/blueprint").ToManyRelationship;
var Blueprint = require("montage/data/blueprint").Blueprint;
var BlueprintBinder = require("montage/data/blueprint").BlueprintBinder;
var Context = require("montage/data/context").Context;

var Serializer = require("montage/core/serializer").Serializer;
var Deserializer = require("montage/core/deserializer").Deserializer;

var BinderHelper = require("data/object/binderhelper").BinderHelper;
var Person = require("data/object/person").Person;
var Company = require("data/object/company").Company;

var logger = require("montage/core/logger").logger("blueprint-spec");

describe("data/blueprint-spec", function() {
describe("Binder", function() {
    describe("Creation", function() {
    });
    describe("Adding blueprints", function() {
        var binder = BlueprintBinder.create().initWithName("CompanyBinder");

        var personBlueprint = Blueprint.create().initWithName("Person");
        binder.addBlueprint(personBlueprint);

        var companyBlueprint = Blueprint.create().initWithName("Company");
        binder.addBlueprint(companyBlueprint);

        it("should have a binder", function() {
            expect(personBlueprint.binder).toBe(binder);
            expect(companyBlueprint.binder).toBe(binder);
        });

    })
});

describe("Blueprint", function() {
    describe("attributes", function() {
        var blueprint = Blueprint.create().initWithName("Person");
        var attribute = ToOneAttribute.create().initWithName("foo");
        it("should be able to add", function() {
            blueprint.addAttribute(attribute);
            expect(attribute.blueprint).toBe(blueprint);
            expect(blueprint.attributeForName("foo")).toBe(attribute);
        });

        it("should be able to remove", function() {
            blueprint.removeAttribute(attribute);
            expect(attribute.blueprint).toBe(null);
            expect(blueprint.attributeForName("foo")).toBeNull();
        });
    });
    describe("relationships", function() {

        var personBlueprint = Blueprint.create().initWithName("Person");
        var companyBlueprint = Blueprint.create().initWithName("Company");

        var employerRelationship = ToOneRelationship.create().initWithName("employer");
        employerRelationship.targetBlueprint = companyBlueprint;
        var employeesRelationship = ToManyRelationship.create().initWithName("employees");
        employeesRelationship.targetBlueprint = personBlueprint;

        personBlueprint.addAttribute(employerRelationship);
        companyBlueprint.addAttribute(employeesRelationship);

        it("basic properties should be correct", function() {
            expect(personBlueprint.attributeForName("employer")).toBe(employerRelationship);
            expect(personBlueprint.attributeForName("employer").targetBlueprint).toBe(companyBlueprint);
            expect(companyBlueprint.attributeForName("employees")).toBe(employeesRelationship);
            expect(companyBlueprint.attributeForName("employees").targetBlueprint).toBe(personBlueprint);
        });
    });
    describe("blueprint to instance relationship", function() {
        var binder = BlueprintBinder.create().initWithName("Binder");
        var personBlueprint = Blueprint.create().initWithName("Person");
        var companyBlueprint = Blueprint.create().initWithName("Company");
        binder.addBlueprint(personBlueprint);
        binder.addBlueprint(companyBlueprint);
        personBlueprint.moduleId = "mymodule";
        companyBlueprint.prototypeName = "Firm";
        companyBlueprint.moduleId = "mymodule";
        it("should be found with a prototypeName and moduleId", function() {
            expect(binder.blueprintForPrototype("Person", "mymodule")).toBe(personBlueprint);
            expect(binder.blueprintForPrototype("Firm", "mymodule")).toBe(companyBlueprint);
        });
    });
    describe("applying a basic blueprint to a prototype", function() {
        var louis, context, personBlueprint;
        beforeEach(function() {
            var binder = BlueprintBinder.create().initWithName("Binder");
            personBlueprint = Blueprint.create().initWithName("Person");
            personBlueprint.moduleId = "mymodule";
            personBlueprint.addAttribute(ToOneAttribute.create().initWithName("name"));
            personBlueprint.addAttribute(ToManyAttribute.create().initWithName("keywords"));

            binder.addBlueprint(personBlueprint);

            var Person = Montage.create(Montage);
            addMontageMetadataToProto("Person", "mymodule", Person);

            louis = Person.create();
            // context = Montage.create(Context).init();
            context = Context.create().init();
            //temporary
            context.addBlueprintBinder(binder);

            context.insert(louis);
        });

        it("should have a blueprint", function() {
            expect(louis.blueprint).toBe(personBlueprint);
        });
        it("should have a context", function() {
            expect(louis.context).toBe(context);
        });
        it("should have an objectId", function() {
            expect(typeof louis.objectId).toEqual("object");
        });
        it("should have a the correct properties defined", function() {
            expect(louis.__proto__.hasOwnProperty("name")).toBeTruthy();
            expect(louis.__proto__.hasOwnProperty("keywords")).toBeTruthy();
        });
    });

    describe("adding a ToOneAttribute", function() {
        var circle, context, personBlueprint;
        beforeEach(function() {
            var binder = BlueprintBinder.create().initWithName("Binder");
            personBlueprint = Blueprint.create().initWithName("Shape");
            personBlueprint.moduleId = "mymodule";
            binder.addBlueprint(personBlueprint);
            var Shape = Montage.create(Montage);
            addMontageMetadataToProto("Shape", "mymodule", Shape);
            context = Context.create().init();
            //temporary
            context.addBlueprintBinder(binder);
            circle = Shape.create();
            var attribute = ToOneAttribute.create().initWithName("size");
            personBlueprint.addAttribute(attribute);
            attribute = ToOneAttribute.create().initWithName("readOnlyAttribute");
            attribute.readOnly = true;
            personBlueprint.addAttribute(attribute);
            attribute = ToOneAttribute.create().initWithName("mandatoryAttribute");
            attribute.mandatory = true;
            personBlueprint.addAttribute(attribute);
            attribute = ToOneAttribute.create().initWithName("denyDelete");
            attribute.denyDelete = true;
            personBlueprint.addAttribute(attribute);
            context.insert(circle);
        });
        describe("normal attribute's property", function() {
            it("should be settable", function() {
                var descriptor = Object.getOwnPropertyDescriptor(circle.__proto__, "size");
                expect(typeof descriptor.get).toEqual("function");
                expect(typeof descriptor.set).toEqual("function");
                expect(circle.size).toBeNull();
                circle.size = "big";
                expect(circle.size).toEqual("big");
            });
            it("should be enumerable", function() {
                var descriptor = Object.getOwnPropertyDescriptor(circle.__proto__, "size");
                expect(descriptor.enumerable).toBeTruthy();
            });
            it("should have a get and set", function() {
                var descriptor = Object.getOwnPropertyDescriptor(circle.__proto__, "size");
                expect(typeof descriptor.get).toEqual("function");
                expect(typeof descriptor.set).toEqual("function");
            });
        });
        describe("read only attribute's property", function() {
            it("should not be settable", function() {
                expect(
                    function() {
                        "use strict"
                        circle.readOnlyAttribute = "big"
                    }).toThrow();
            });
            it("should have a get and no set", function() {
                var descriptor = Object.getOwnPropertyDescriptor(circle.__proto__, "readOnlyAttribute");
                expect(typeof descriptor.get).toEqual("function");
                expect(typeof descriptor.set).toEqual("undefined");
            });
        });
        xdescribe("mandatory attribute's property", function() {
            it("should not be settable", function() {
                expect(
                    function() {
                        circle.readOnlyAttribute = "big"
                    }).toThrow();
            });
            it("should have a get and no set", function() {
                var descriptor = Object.getOwnPropertyDescriptor(circle.__proto__, "readOnlyAttribute");
                expect(typeof descriptor.get).toEqual("function");
                expect(typeof descriptor.set).toEqual("undefined");
            });
        });
        describe("denyDelete attribute's property", function() {
            it("should not be settable to null", function() {
                circle.denyDelete = "big";
                expect(
                    function() {
                        circle.denyDelete = null
                    }).toThrow();
            });
        });
    });

    describe("serializing", function() {
        var companyBinder = BinderHelper.companyBinder();

        it("can serialize", function() {
            expect(Serializer.create().initWithRequire(require).serialize(companyBinder)).not.toBeNull();
        });
        it("can deserialize", function() {
            var serializedBinder = Serializer.create().initWithRequire(require).serializeObject(companyBinder);
            Deserializer.create().initWithStringAndRequire(serializedBinder, require).deserializeObject(function(deserializedBinder) {
                var metadata = Montage.getInfoForObject(deserializedBinder);
                expect(serializedBinder).not.toBeNull();
                expect(metadata.objectName).toBe("BlueprintBinder");
                expect(metadata.moduleId).toBe("data/blueprint");
                var personBlueprint = deserializedBinder.blueprintForPrototype("Person", "data/object/person");
                expect(personBlueprint).not.toBeNull();
                expect(personBlueprint.attributeForName("phoneNumbers")).not.toBeNull();
            },require);
        });
    });

    describe("create new prototype", function() {

        it("Should be a prototype", function() {
            var info = Montage.getInfoForObject(Person);
            expect(info.isInstance).toBeFalsy();
        });

        it("Should have the right moduleId and Name", function() {
            var info = Montage.getInfoForObject(Person);
            expect(info.moduleId).toBe("data/object/person");
            expect(info.objectName).toBe("Person");
        });
    });

});
});
