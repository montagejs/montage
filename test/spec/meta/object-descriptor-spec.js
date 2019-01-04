"use strict";
/**
 @module montage/data/object-descriptor-spec.js
 @requires montage/core/core
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var ObjectDescriptor = require("montage/core/meta/object-descriptor").ObjectDescriptor;
var Model = require("montage/core/meta/model").Model;
var PropertyDescriptor = require("montage/core/meta/property-descriptor").PropertyDescriptor;
var Serializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer;
var Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer;
var ModelHelper = require("./blueprint/model-helper").ModelHelper;
var Person = require("./blueprint/person").Person;
var Company = require("./blueprint/company").Company;
var Employee = require("./blueprint/employee").Employee;
var Customer = require("./blueprint/customer").Customer;
var logger = require("montage/core/logger").logger("./object-descriptor-spec.js");

// Require to deserialize
// TODO add proper deps to montage modules
require('montage/core/meta/object-descriptor');
require('montage/core/meta/property-descriptor');
require('montage/core/meta/module-object-descriptor');

describe("meta/object-descriptor-spec", function () {
    describe("Model", function () {
        describe("Creation", function () {
        });
        describe("Adding object descriptors", function () {
            var binder = new Model().initWithNameAndRequire("CompanyModel", require);
            var personObjectDescriptor = new ObjectDescriptor().initWithName("Person");
            binder.addObjectDescriptor(personObjectDescriptor);

            var companyObjectDescriptor = new ObjectDescriptor().initWithName("Company");
            binder.addObjectDescriptor(companyObjectDescriptor);

            it("should have a binder", function () {
                expect(personObjectDescriptor.model).toBe(binder);
                expect(companyObjectDescriptor.model).toBe(binder);
            });

        });
    });

    describe("ObjectDescriptor", function () {
        describe("propertyDescriptors", function () {
            var objectDescriptor = new ObjectDescriptor().initWithName("Person");
            var propertyDescriptor = objectDescriptor.newPropertyDescriptor("foo", 1);
            // it("can add", function () {
            //     objectDescriptor.addPropertyDescriptor(propertyDescriptor);
            //     expect(propertyDescriptor.owner).toBe(objectDescriptor);
            //     expect(objectDescriptor.propertyDescriptorForName("foo")).toBe(propertyDescriptor);
            //     expect(objectDescriptor._ownPropertyDescriptors[0]).toBe(propertyDescriptor);
            //     expect(objectDescriptor.propertyDescriptors[0]).toBe(propertyDescriptor);
            // });

            // it("can remove", function () {
            //     objectDescriptor.removePropertyDescriptor(propertyDescriptor);
            //     expect(propertyDescriptor.owner).toBe(null);
            //     expect(objectDescriptor.propertyDescriptorForName("foo")).toBeNull();
            //     expect(objectDescriptor._ownPropertyDescriptors.length).toBe(0);
            //     expect(objectDescriptor.propertyDescriptors.length).toBe(0);
            // });



            describe("parent propertyDescriptors", function () {
                var parent, parentProperty, 
                    child, childProperty;

                beforeEach(function () {
                    parent = new ObjectDescriptor().initWithName("Person");
                    parentProperty = parent.newPropertyDescriptor("foo", 1);
                    child = new ObjectDescriptor().initWithName("Customer");
                    childProperty = child.newPropertyDescriptor("bar", 1);
                });

                it("can get propertyDescriptor added to parent", function () {
                    child.parent = parent;                    
                    child.addPropertyDescriptor(childProperty);
                    parent.addPropertyDescriptor(parentProperty);
                    expect(child.propertyDescriptorForName("bar")).toBe(childProperty);
                    expect(child.propertyDescriptorForName("foo")).toBe(parentProperty);
                    expect(child._ownPropertyDescriptors.length).toBe(1);
                    expect(child._ownPropertyDescriptors[0]).toBe(childProperty);
                    expect(child.propertyDescriptors.length).toBe(2);
                    expect(child.propertyDescriptors[0]).toBe(childProperty);
                    expect(child.propertyDescriptors[1]).toBe(parentProperty);
                });

                it("can get propertyDescriptor when parent is assigned", function () {
                    child.addPropertyDescriptor(childProperty);
                    parent.addPropertyDescriptor(parentProperty);

                    expect(child.propertyDescriptors.length).toBe(1);
                    
                    child.parent = parent;  

                    expect(child.propertyDescriptorForName("bar")).toBe(childProperty);
                    expect(child.propertyDescriptorForName("foo")).toBe(parentProperty);
                    expect(child._ownPropertyDescriptors.length).toBe(1);
                    expect(child._ownPropertyDescriptors[0]).toBe(childProperty);
                    expect(child.propertyDescriptors.length).toBe(2);
                    expect(child.propertyDescriptors[0]).toBe(childProperty);
                    expect(child.propertyDescriptors[1]).toBe(parentProperty);
                });
            })
            
        });
        describe("associations", function () {

            var personObjectDescriptor = new ObjectDescriptor().initWithName("Person");
            var companyObjectDescriptor = new ObjectDescriptor().initWithName("Company");

            var employerAssociation = personObjectDescriptor.addToManyPropertyDescriptorNamed("employer");
            employerAssociation.valueDescriptor = companyObjectDescriptor;
            var employeesAssociation = companyObjectDescriptor.addToManyPropertyDescriptorNamed("employees");
            employeesAssociation.valueDescriptor = personObjectDescriptor;

            personObjectDescriptor.addPropertyDescriptor(employerAssociation);
            companyObjectDescriptor.addPropertyDescriptor(employeesAssociation);

            it("basic properties should be correct", function () {
                expect(personObjectDescriptor.propertyDescriptorForName("employer")).toBe(employerAssociation);
                expect(companyObjectDescriptor.propertyDescriptorForName("employees")).toBe(employeesAssociation);
            });
            it("target objectDescriptor promise to be resolved", function (done) {
                personObjectDescriptor.propertyDescriptorForName("employer").valueDescriptor.then(function (objectDescriptor) {
                    expect(objectDescriptor).toBeTruthy();
                    expect(objectDescriptor).toBe(companyObjectDescriptor);
                }).finally(function () {
                    done();
                });
            });
            it("target objectDescriptor promise to be resolved", function (done) {
                companyObjectDescriptor.propertyDescriptorForName("employees").valueDescriptor.then(function (objectDescriptor) {
                    expect(objectDescriptor).toBeTruthy();
                    expect(objectDescriptor).toBe(personObjectDescriptor);
                }).finally(function () {
                    done();
                });
            });
        });
        describe("objectDescriptor to instance association", function () {
            var binder, personObjectDescriptor, companyObjectDescriptor;
            beforeEach(function () {
                binder = new Model().initWithNameAndRequire("Model", require);
                personObjectDescriptor = new ObjectDescriptor().initWithName("Person");
                binder.addObjectDescriptor(personObjectDescriptor);
                companyObjectDescriptor = new ObjectDescriptor().initWithName("Company");
                binder.addObjectDescriptor(companyObjectDescriptor);
            });
            it("should be found with the objectDescriptor name", function () {
                expect(binder.objectDescriptorForName("Person")).toBe(personObjectDescriptor);
                expect(binder.objectDescriptorForName("Company")).toBe(companyObjectDescriptor);
            });
        });
        describe("applying a basic objectDescriptor to a prototype", function () {
            var louis, personObjectDescriptor;
            beforeEach(function () {
                var binder = new Model().initWithNameAndRequire("Model", require);
                personObjectDescriptor = new ObjectDescriptor().initWithName("Person");
                personObjectDescriptor.addPropertyDescriptor(personObjectDescriptor.newPropertyDescriptor("name", 1));
                personObjectDescriptor.addPropertyDescriptor(personObjectDescriptor.newPropertyDescriptor("keywords", Infinity));

                binder.addObjectDescriptor(personObjectDescriptor);
                Model.group.addModel(binder);

                louis = personObjectDescriptor.newInstance().init();
            });

            it("should have a objectDescriptor", function () {
                expect(louis.objectDescriptor).toBe(personObjectDescriptor);
            });
            it("should have a the correct properties defined", function () {
                expect(Object.getPrototypeOf(louis).hasOwnProperty("name")).toBeTruthy();
                expect(Object.getPrototypeOf(louis).hasOwnProperty("keywords")).toBeTruthy();
            });
        });

        describe("adding a PropertyDescriptor", function () {
            var circle, shapeObjectDescriptor;
            beforeEach(function () {
                var binder = new Model().initWithNameAndRequire("Model", require);
                shapeObjectDescriptor = new ObjectDescriptor().initWithName("Shape");
                binder.addObjectDescriptor(shapeObjectDescriptor);
                var propertyDescriptor = shapeObjectDescriptor.newPropertyDescriptor("size", 1);
                shapeObjectDescriptor.addPropertyDescriptor(propertyDescriptor);
                propertyDescriptor = shapeObjectDescriptor.newPropertyDescriptor("readOnlyPropertyDescriptor", 1);
                propertyDescriptor.readOnly = true;
                shapeObjectDescriptor.addPropertyDescriptor(propertyDescriptor);
                propertyDescriptor = shapeObjectDescriptor.newPropertyDescriptor("mandatoryPropertyDescriptor", 1);
                propertyDescriptor.mandatory = true;
                shapeObjectDescriptor.addPropertyDescriptor(propertyDescriptor);
                propertyDescriptor = shapeObjectDescriptor.newPropertyDescriptor("denyDelete", 1);
                propertyDescriptor.denyDelete = true;
                shapeObjectDescriptor.addPropertyDescriptor(propertyDescriptor);
                Model.group.addModel(binder);

                circle = shapeObjectDescriptor.newInstance().init();
            });
            describe("normal propertyDescriptor's property", function () {
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
            describe("read only propertyDescriptor's property", function () {
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
            describe("mandatory propertyDescriptor's property", function () {
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
            describe("denyDelete propertyDescriptor's property", function () {
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
            var companyModel = ModelHelper.companyModel(),
                personObjectDescriptor = companyModel.objectDescriptorForName("Person");

            personObjectDescriptor.maxAge = 60;


            it("can serialize", function () {
                var serializedModel = new Serializer().initWithRequire(require).serializeObject(companyModel);
                expect(serializedModel).not.toBeNull();
            });
            it("can deserialize", function (done) {
                var serializedModel = new Serializer().initWithRequire(require).serializeObject(companyModel);
                var deserializer = new Deserializer().init(serializedModel, require).deserializeObject().then(function (deserializedModel) {
                    var metadata = Montage.getInfoForObject(deserializedModel);
                    expect(serializedModel).not.toBeNull();
                    expect(metadata.objectName).toBe("Model");
                    expect(metadata.moduleId).toBe("core/meta/model");
                    var personObjectDescriptor = deserializedModel.objectDescriptorForName("Person");
                    expect(personObjectDescriptor).toBeTruthy();
                    expect(personObjectDescriptor.propertyDescriptorForName("phoneNumbers")).not.toBeNull();
                    expect(personObjectDescriptor.maxAge).toBe(60);
                }, function (err) {
                    fail(err);
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
                var objectDescriptor = ObjectDescriptor.createDefaultObjectDescriptorForObject({});
                expect(typeof objectDescriptor.then).toBe("function");
                objectDescriptor.then(function (objectDescriptor) {
                    expect(ObjectDescriptor.prototype.isPrototypeOf(objectDescriptor)).toBe(true);
                }, function (err) {
                    fail(err);
                }).finally(function () {
                    done();
                });
            });

            it("has the correct module id for the parent", function (done) {
                var ComponentObjectDescriptorTest1 = require("spec/meta/component-object-descriptor-test/component-object-descriptor-test-1.reel").ComponentObjectDescriptorTest1;
                ObjectDescriptor.createDefaultObjectDescriptorForObject(ComponentObjectDescriptorTest1).then(function (objectDescriptor) {
                    var id = objectDescriptor.parent.objectDescriptorInstanceModule.resolve(require);
                    expect(id === "montage/ui/component.meta" || id === "montage/ui/component.mjson").toBeTruthy();
                }, function (err) {
                    fail(err);
                }).finally(function () {
                    done();
                });
            });

        });

        describe("ObjectDescriptor descriptor", function () {
            // Fixme: Spec was already broken before removing constructor compatibility (an unrelated error was raised)
            // Before removing constructor compatibility, it was possible to reproduce this issue by setting a constructor descriptor.
            //it("does not work for objects that aren't in a module", function () {
            //    var Sub = ObjectDescriptor.specialize();
            //    var sub = new Sub();
            //
            //    expect(function () {
            //        var x = sub.objectDescriptor;
            //    }).toThrow();
            //});


            it("uses the correct module ID for objects with no .meta", function () {
                var Sub = ObjectDescriptor.specialize();
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

                expect(sub.objectDescriptorModuleId === "pass.meta" || sub.objectDescriptorModuleId === "pass.mjson").toBeTruthy();
            });

            it("creates an objectDescriptor when the parent has no objectDescriptor", function (done) {
                ObjectDescriptor.objectDescriptor.then(function (objectDescriptor){
                    expect( objectDescriptor.objectDescriptorInstanceModule.id === "core/meta/blueprint.meta" ||
                            objectDescriptor.objectDescriptorInstanceModule.id === "core/meta/object-descriptor.mjson").toBeTruthy();
                }, function (err) {
                    fail(err);
                }).finally(function () {
                    done();
                });
            });
        });

        describe("events", function () {
            var EventDescriptor = require("montage/core/meta/event-descriptor").EventDescriptor;

            var objectDescriptor;
            beforeEach(function () {
                objectDescriptor = new ObjectDescriptor().initWithName("test");
            });

            describe("eventDescriptors", function () {
                it("returns the same array", function () {
                    objectDescriptor.addEventDescriptorNamed("event");
                    var eventDescriptors = objectDescriptor.eventDescriptors;
                    expect(objectDescriptor.eventDescriptors).toBe(eventDescriptors);
                });
            });

            describe("adding", function () {
                var eventDescriptor;
                afterEach(function () {
                    expect(objectDescriptor.eventDescriptors.length).toEqual(1);
                    expect(objectDescriptor.eventDescriptors[0]).toBe(eventDescriptor);
                });

                it("adds an existing objectDescriptor", function () {
                    eventDescriptor = new EventDescriptor().initWithNameAndObjectDescriptor("event");
                    objectDescriptor.addEventDescriptor(eventDescriptor);

                    expect(eventDescriptor.owner).toBe(objectDescriptor);
                    expect(objectDescriptor.eventDescriptorForName("event")).toBe(eventDescriptor);
                });

                it("only adds the objectDescriptor once", function () {
                    eventDescriptor = new EventDescriptor().initWithNameAndObjectDescriptor("event");

                    objectDescriptor.addEventDescriptor(eventDescriptor);
                    objectDescriptor.addEventDescriptor(eventDescriptor);

                    expect(eventDescriptor.owner).toBe(objectDescriptor);
                    expect(objectDescriptor.eventDescriptorForName("event")).toBe(eventDescriptor);
                });

                it("creates a new objectDescriptor with the given name", function () {
                    eventDescriptor = objectDescriptor.addEventDescriptorNamed("event");

                    expect(eventDescriptor.owner).toBe(objectDescriptor);
                    expect(eventDescriptor.name).toEqual("event");
                    expect(objectDescriptor.eventDescriptorForName("event")).toBe(eventDescriptor);
                });
            });

            it("creates a new event objectDescriptor", function () {
                var eventDescriptor = objectDescriptor.newEventDescriptor("event");

                expect(eventDescriptor.name).toEqual("event");
                expect(eventDescriptor.owner).toBe(objectDescriptor);
            });

            it("removes an existing objectDescriptor", function () {
                var eventDescriptor = objectDescriptor.addEventDescriptorNamed("event");
                objectDescriptor.removeEventDescriptor(eventDescriptor);

                expect(eventDescriptor.owner).toBe(null);
                expect(objectDescriptor.eventDescriptorForName("event")).toBe(null);
            });


            it("removes an existing objectDescriptor from it's previous owner", function () {
                var oldObjectDescriptor = new ObjectDescriptor().initWithName("old");

                var eventDescriptor = new EventDescriptor().initWithNameAndObjectDescriptor("event", oldObjectDescriptor);
                objectDescriptor.addEventDescriptor(eventDescriptor);

                expect(eventDescriptor.owner).toBe(objectDescriptor);
                expect(objectDescriptor.eventDescriptorForName("event")).toBe(eventDescriptor);

                expect(oldObjectDescriptor.eventDescriptorForName("event")).toBe(null);
            });

            it("lists event objectDescriptors of the parent", function () {
                var parentObjectDescriptor = new ObjectDescriptor().initWithName("parent");
                objectDescriptor.parent = parentObjectDescriptor;

                var parentEvent = parentObjectDescriptor.addEventDescriptorNamed("parentEvent");
                var event = objectDescriptor.addEventDescriptorNamed("event");

                expect(objectDescriptor.eventDescriptors.length).toEqual(2);
                expect(objectDescriptor.eventDescriptors).toEqual([event, parentEvent]);
            });
        });

        describe("UserInterfaceDescriptor", function () {
            var employee, customer;

            beforeEach(function () {
                employee = new Employee();
                customer = new Customer();
            });

            it("should be required if it exists", function (done) {
                return employee.constructor.objectDescriptor.then(function (objectDescriptor) {
                    return objectDescriptor.userInterfaceDescriptor.then(function (userInterfaceDescriptor) {
                        expect(userInterfaceDescriptor).toBeTruthy();
                        expect(userInterfaceDescriptor.descriptionExpression).toBe("department");
                        expect(userInterfaceDescriptor.inspectorComponentModule.id).toBe("ui/inspectors/employee.reel");

                        return customer.constructor.objectDescriptor.then(function (objectDescriptor) {
                            return objectDescriptor.userInterfaceDescriptor.then(function (userInterfaceDescriptor) {
                                expect(userInterfaceDescriptor).toBeFalsy();
                                done();
                            });
                        });
                    });
                });
            });
        });
    });
});
