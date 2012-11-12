/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
var Montage = require("montage").Montage;
var Attribute = require("montage/data/blueprint").Attribute;
var Association = require("montage/data/blueprint").Association;
var Blueprint = require("montage/data/blueprint").Blueprint;
var BlueprintBinder = require("montage/data/blueprint").BlueprintBinder;
var ChangeContext = require("montage/data/change-context").ChangeContext;

var Serializer = require("montage/core/serializer").Serializer;
var Deserializer = require("montage/core/deserializer").Deserializer;

var BinderHelper = require("data/object/binderhelper").BinderHelper;
var Person = require("data/object/person").Person;
var Company = require("data/object/company").Company;

var logger = require("montage/core/logger").logger("blueprint-spec");

describe("data/blueprint-spec", function () {
    describe("Binder", function () {
        describe("Creation", function () {
        });
        describe("Adding blueprints", function () {
            var binder = BlueprintBinder.create().initWithName("CompanyBinder");

            var personBlueprint = Blueprint.create().initWithName("Person");
            binder.addBlueprint(personBlueprint);

            var companyBlueprint = Blueprint.create().initWithName("Company");
            binder.addBlueprint(companyBlueprint);

            it("should have a binder", function () {
                expect(personBlueprint.binder).toBe(binder);
                expect(companyBlueprint.binder).toBe(binder);
            });

        })
    });

    describe("Blueprint", function () {
        describe("attributes", function () {
            var blueprint = Blueprint.create().initWithName("Person");
            var attribute = Attribute.create().initWithName("foo");
            it("should be able to add", function () {
                blueprint.addAttribute(attribute);
                expect(attribute.blueprint).toBe(blueprint);
                expect(blueprint.attributeForName("foo")).toBe(attribute);
            });

            it("should be able to remove", function () {
                blueprint.removeAttribute(attribute);
                expect(attribute.blueprint).toBe(null);
                expect(blueprint.attributeForName("foo")).toBeNull();
            });
        });
        describe("associations", function () {

            var personBlueprint = Blueprint.create().initWithName("Person");
            var companyBlueprint = Blueprint.create().initWithName("Company");

            var employerAssociation = Association.create().initWithName("employer");
            employerAssociation.targetBlueprint = companyBlueprint;
            var employeesAssociation = Association.create().initWithNameAndCardinality("employees", Infinity);
            employeesAssociation.targetBlueprint = personBlueprint;

            personBlueprint.addAttribute(employerAssociation);
            companyBlueprint.addAttribute(employeesAssociation);

            it("basic properties should be correct", function () {
                expect(personBlueprint.attributeForName("employer")).toBe(employerAssociation);
                expect(personBlueprint.attributeForName("employer").targetBlueprint).toBe(companyBlueprint);
                expect(companyBlueprint.attributeForName("employees")).toBe(employeesAssociation);
                expect(companyBlueprint.attributeForName("employees").targetBlueprint).toBe(personBlueprint);
            });
        });
        describe("blueprint to instance association", function () {
            var binder = BlueprintBinder.create().initWithName("Binder");
            var personBlueprint = Blueprint.create().initWithName("Person");
            var companyBlueprint = Blueprint.create().initWithName("Company");
            binder.addBlueprint(personBlueprint);
            binder.addBlueprint(companyBlueprint);
            personBlueprint.moduleId = "mymodule";
            companyBlueprint.prototypeName = "Firm";
            companyBlueprint.moduleId = "mymodule";
            it("should be found with a prototypeName and moduleId", function () {
                expect(binder.blueprintForPrototype("Person", "mymodule")).toBe(personBlueprint);
                expect(binder.blueprintForPrototype("Firm", "mymodule")).toBe(companyBlueprint);
            });
        });
        describe("applying a basic blueprint to a prototype", function () {
            var louis, context, personBlueprint;
            beforeEach(function () {
                var binder = BlueprintBinder.create().initWithName("Binder");
                personBlueprint = Blueprint.create().initWithNameAndModuleId("Person", "mymodule");
                personBlueprint.addAttribute(Attribute.create().initWithName("name"));
                personBlueprint.addAttribute(Attribute.create().initWithName("keywords"));

                binder.addBlueprint(personBlueprint);
                BlueprintBinder.manager.addBlueprintBinder(binder);

                louis = personBlueprint.newInstance().init();

                context = ChangeContext.create().init();
                context.insert(louis);
            });

            it("should have a blueprint", function () {
                expect(louis.blueprint).toBe(personBlueprint);
            });
            it("should have a context", function () {
                expect(louis.context).toBe(context);
            });
            it("should have an objectId", function () {
                expect(typeof louis.objectId).toEqual("object");
            });
            it("should have a the correct properties defined", function () {
                expect(louis.__proto__.hasOwnProperty("name")).toBeTruthy();
                expect(louis.__proto__.hasOwnProperty("keywords")).toBeTruthy();
            });
        });

        describe("adding a Attribute", function () {
            var circle, context, shapeBlueprint;
            beforeEach(function () {
                var binder = BlueprintBinder.create().initWithName("Binder");
                shapeBlueprint = Blueprint.create().initWithNameAndModuleId("Shape", "mymodule");
                binder.addBlueprint(shapeBlueprint);
                var attribute = Attribute.create().initWithName("size");
                shapeBlueprint.addAttribute(attribute);
                attribute = Attribute.create().initWithName("readOnlyAttribute");
                attribute.readOnly = true;
                shapeBlueprint.addAttribute(attribute);
                attribute = Attribute.create().initWithName("mandatoryAttribute");
                attribute.mandatory = true;
                shapeBlueprint.addAttribute(attribute);
                attribute = Attribute.create().initWithName("denyDelete");
                attribute.denyDelete = true;
                shapeBlueprint.addAttribute(attribute);
                BlueprintBinder.manager.addBlueprintBinder(binder);

                circle = shapeBlueprint.newInstance().init();

                context = ChangeContext.create().init();
                context.insert(circle);
            });
            describe("normal attribute's property", function () {
                it("should be settable", function () {
                    var descriptor = Object.getOwnPropertyDescriptor(circle.__proto__, "size");
                    expect(typeof descriptor.get).toEqual("function");
                    expect(typeof descriptor.set).toEqual("function");
                    expect(circle.size).toBeNull();
                    circle.size = "big";
                    expect(circle.size).toEqual("big");
                });
                it("should be enumerable", function () {
                    var descriptor = Object.getOwnPropertyDescriptor(circle.__proto__, "size");
                    expect(descriptor.enumerable).toBeTruthy();
                });
                it("should have a get and set", function () {
                    var descriptor = Object.getOwnPropertyDescriptor(circle.__proto__, "size");
                    expect(typeof descriptor.get).toEqual("function");
                    expect(typeof descriptor.set).toEqual("function");
                });
            });
            describe("read only attribute's property", function () {
                it("should not be settable", function () {
                    expect(
                        function () {
                            "use strict"
                            circle.readOnlyAttribute = "big"
                        }).toThrow();
                });
                it("should have a get and no set", function () {
                    var descriptor = Object.getOwnPropertyDescriptor(circle.__proto__, "readOnlyAttribute");
                    expect(typeof descriptor.get).toEqual("function");
                    expect(typeof descriptor.set).toEqual("undefined");
                });
            });
            xdescribe("mandatory attribute's property", function () {
                it("should not be settable", function () {
                    expect(
                        function () {
                            circle.readOnlyAttribute = "big"
                        }).toThrow();
                });
                it("should have a get and no set", function () {
                    var descriptor = Object.getOwnPropertyDescriptor(circle.__proto__, "readOnlyAttribute");
                    expect(typeof descriptor.get).toEqual("function");
                    expect(typeof descriptor.set).toEqual("undefined");
                });
            });
            describe("denyDelete attribute's property", function () {
                it("should not be settable to null", function () {
                    circle.denyDelete = "big";
                    expect(
                        function () {
                            circle.denyDelete = null
                        }).toThrow();
                });
            });
        });

        describe("serializing", function () {
            var companyBinder = BinderHelper.companyBinder();

            it("can serialize", function () {
                expect(Serializer.create().initWithRequire(require).serializeObject(companyBinder)).not.toBeNull();
            });
            it("can deserialize", function () {
                var serializedBinder = Serializer.create().initWithRequire(require).serializeObject(companyBinder);
                Deserializer.create().initWithStringAndRequire(serializedBinder, require).deserializeObject(function (deserializedBinder) {
                    var metadata = Montage.getInfoForObject(deserializedBinder);
                    expect(serializedBinder).not.toBeNull();
                    expect(metadata.objectName).toBe("BlueprintBinder");
                    expect(metadata.moduleId).toBe("data/blueprint");
                    var personBlueprint = deserializedBinder.blueprintForPrototype("Person", "data/object/person");
                    expect(personBlueprint).not.toBeNull();
                    expect(personBlueprint.attributeForName("phoneNumbers")).not.toBeNull();
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
                expect(info.moduleId).toBe("data/object/person");
                expect(info.objectName).toBe("Person");
            });
        });

    });
});
