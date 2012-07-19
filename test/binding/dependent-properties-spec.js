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
var ChangeNotification = require("montage/core/change-notification").ChangeNotification;

var Person = Montage.create(Montage, {

    // Not trying to be exhaustive with professional titles/marital distinctions
    // though that would make for a neat example app

    title: {
        dependencies: ["gender"],
        enumerable: false,
        get: function() {

            switch(this.gender) {
                case "male":
                    return "Mr.";
                case "female":
                    return "Mrs.";
                default:
                    return null;
            }

        }
    },

    formalName: {
        dependencies: ["title", "name"],
        get: function() {
            return [this.title, this.name].join(" ").trim();
        }
    },

    name: {
        dependencies: ["firstName", "lastName"],
        enumerable: false,
        get: function() {
            var first = this.firstName ? this.firstName.toCapitalized() : "",
                last = this.lastName ? this.lastName.toCapitalized() : "";

            return first + " " + last;
        }
    },

    gender: {
        enumerable: false,
        value: null
    },

    firstName: {
        enumerable: false,
        value: null
    },

    _lastName: {
        enumerable: false,
        value: null
    },

    lastName: {
        dependencies: ["parent.lastName"],
        enumerable: false,
        get: function() {

            // Certainly not about to delve into naming rules any more touchy than this
            if (this._lastName) {
                // TODO in this case this property is no longer dependent on parent.lastName
                // we probably need a way to programatically add or remove dependencies
                return this._lastName;
            } else if (this.parent) {
                return this.parent.lastName;
            } else {
                return null;
            }
        },
        set: function(value) {
            this._lastName = value;
        }
    },

    parent: {
        enumerable: false,
        value: null
    },

    children: {
        enumerable: false,
        distinct: true,
        value: []
    },

    isParent: {
        dependencies: ["children"],
        enumerable: false,
        get: function() {
            return (this.children.length > 0);
        }
    },

    childrenAtHome: {
        dependencies: ["children.atHome"],
        get: function() {
            return this.children.filter(function(element) {
                return !!element.atHome;
            });
        }
    },

    atHome: {
        enumerable: false,
        value: false
    },

    toString: {
        enumerable: false,
        value: function() {
            return "[Person " + this.name + "]";
        }
    }

});

var Department = Montage.create(Montage, {

    manager: {
        value: null
    }

});

describe("binding/dependent-properties-spec", function() {

    describe("an object with dependent properties", function() {

        var person;

        beforeEach(function() {
            ChangeNotification.__reset__();

            person = Person.create();
        });

        describe("when observed for propertyChanges", function() {

            it("should affect dependent properties concerned with the property of array members", function() {
                var personInformation = {};

                var baby = Person.create(),
                    baby2 = Person.create();

                person.children = [baby, baby2];

                // childrenAtHome depends upon "children.atHome"
                person.addPropertyChangeListener("childrenAtHome.count()", function(change) {
                    personInformation.count = person.getProperty("childrenAtHome.count()");
                })

                baby.atHome = true;
                expect(personInformation.count).toBe(1);

                baby2.atHome = true;
                expect(personInformation.count).toBe(2);

                person.children.pop();
                expect(personInformation.count).toBe(1);
            });

            it("should be dependent on newly added members to an array that is along a dependent property path", function() {
                var personInformation = {};

                var baby = Person.create(),
                    baby2 = Person.create();

                baby.atHome = true;

                // childrenAtHome depends upon "children.atHome"
                person.addPropertyChangeListener("childrenAtHome.count()", function(change) {
                    personInformation.count = person.getProperty("childrenAtHome.count()");
                })

                person.children.push(baby);
                expect(personInformation.count).toBe(1);

                person.children.push(baby2);
                expect(personInformation.count).toBe(1);

                baby2.atHome = true;
                expect(personInformation.count).toBe(2);

            });

            it("TODO must no longer be dependent on removed members of an array that is along a dependent property path", function() {
            });

        });

        describe("involved in bindings", function() {

            describe("when adding dependent properties after a prototype was defined", function() {

                it("should accommodate adding dependencies", function() {

                    Montage.defineProperty(Person, "jobTitle", {
                        enumerable: false,
                        value: null
                    });

                    Montage.defineProperty(Person, "businessCard", {
                        enumerable: false,
                        get: function() {
                            return this.formalName + " - " + this.jobTitle;
                        },
                        set: function() {}
                    });

                    person.firstName = "Alice";
                    person.lastName = "Allman";

                    var personInformation = {};

                    Montage.addDependencyToProperty(Person, "firstName", "businessCard");
                    Montage.addDependencyToProperty(Person, "jobTitle", "businessCard");

                    Object.defineBinding(personInformation, "businessCard", {
                        boundObject: person,
                        boundObjectPropertyPath: "businessCard"
                    });

                    person.firstName = "Al";
                    person.jobTitle = "Software Engineer";

                    expect(personInformation.businessCard).toBe("Al Allman - Software Engineer");
                });

            });

            describe("when removing dependent properties after a prototype was defined", function() {

                it("should remove listeners for the removed dependency if the dependent property is already observed", function() {

                    // Doing this on the person not Person to avoid botching all subsequent tests
                    Montage.defineProperty(person, "name", {
                        enumerable: false,
                        value: "Foo Bar"
                    });

                    person.firstName = "Alice";
                    person.lastName = "Allman";

                    var personInformation = {};

                    Montage.removeDependencyFromProperty(Person, "firstName", "name");
                    Montage.removeDependencyFromProperty(Person, "lastName", "name");

                    Object.defineBinding(personInformation, "name", {
                        boundObject: person,
                        boundObjectPropertyPath: "name"
                    });

                    person.firstName = "Al";

                    expect(person.firstName).toBe("Al");
                    expect(personInformation.name).toBe("Foo Bar");

                    // Tidying up to make sure everything is back to normal
                    Montage.addDependencyToProperty(Person, "firstName", "name");
                    Montage.addDependencyToProperty(Person, "lastName", "name");

                });

            });

            describe("when changes actually happen", function() {

                it("should continue affect the actual property changed, regardless of dependencies", function() {

                    person.firstName = "Alice";
                    person.lastName = "Allman";

                    var personInformation = {};

                    Object.defineBinding(personInformation, "firstName", {
                        boundObject: person,
                        boundObjectPropertyPath: "firstName"
                    });

                    person.firstName = "Al";

                    expect(personInformation.firstName).toBe("Al");
                });

                it("should affect properties dependent on some other independent property", function() {

                    person.firstName = "Alice";
                    person.lastName = "Allman";

                    var personInformation = {};

                    Object.defineBinding(personInformation, "name", {
                        boundObject: person,
                        boundObjectPropertyPath: "name"
                    });

                    person.firstName = "Al";

                    expect(personInformation.name).toBe("Al Allman");
                });

                it("should affect properties dependent on multiple independent property, regardless of which are affected", function() {

                    person.firstName = "Alice";
                    person.lastName = "Allman";

                    var personInformation = {};

                    Object.defineBinding(personInformation, "name", {
                        boundObject: person,
                        boundObjectPropertyPath: "name"
                    });

                    person.firstName = "Al";
                    expect(personInformation.name).toBe("Al Allman");

                    person.lastName = "Allen";
                    expect(personInformation.name).toBe("Al Allen");
                });

                it("should affect an entire chain of dependent keys", function() {
                    person.firstName = "Alice";
                    person.lastName = "Allman";

                    var personInformation = {};

                    Object.defineBinding(personInformation, "formalName", {
                        boundObject: person,
                        boundObjectPropertyPath: "formalName"
                    });

                    // a change in "firstName" affects "name" which affects "formalName"
                    person.firstName = "Al";

                    expect(personInformation.formalName).toBe("Al Allman");
                });

                it("should affect properties dependent upon an array that was mutated", function() {
                    person.firstName = "Alice";

                    var personInformation = {};

                    Object.defineBinding(personInformation, "isParent", {
                        boundObject: person,
                        boundObjectPropertyPath: "isParent",
                        oneway: true
                    });

                    var baby = Person.create();
                    baby.firstName = "Bob";

                    expect(personInformation.isParent).toBe(false);

                    person.children.push(baby);

                    expect(personInformation.isParent).toBe(true);
                });

                it("should affect dependent properties involved along a boundPropertyPath that may go beyond the dependent property path", function() {
                    person.firstName = "Alice";

                    var personInformation = {};

                    Object.defineBinding(personInformation, "count", {
                        boundObject: person,
                        boundObjectPropertyPath: "name.length",
                        oneway: true
                    });

                    person.lastName = "Allman";

                    // 11 characters, 12 including the space…
                    expect(personInformation.count).toBe(12);
                });

                it("should affect dependent properties concerned with the property of array members", function() {
                    var personInformation = {};

                    var baby = Person.create(),
                        baby2 = Person.create();

                    person.children = [baby, baby2];

                    // childrenAtHome depends upon "children.atHome"
                    Object.defineBinding(personInformation, "count", {
                        boundObject: person,
                        boundObjectPropertyPath: "childrenAtHome.count()",
                        oneway: true
                    });

                    expect(personInformation.count).toBe(0);

                    baby.atHome = true;
                    expect(personInformation.count).toBe(1);

                    baby2.atHome = true;
                    expect(personInformation.count).toBe(2);

                    person.children.pop();
                    expect(personInformation.count).toBe(1);
                });

                it("should be dependent on newly added members to an array that is along a dependent property path", function() {
                    var personInformation = {};

                    var baby = Person.create(),
                        baby2 = Person.create();

                    baby.atHome = true;

                    // childrenAtHome depends upon "children.atHome"
                    Object.defineBinding(personInformation, "count", {
                        boundObject: person,
                        boundObjectPropertyPath: "childrenAtHome.count()",
                        oneway: true
                    });

                    expect(personInformation.count).toBe(0);

                    person.children.push(baby);
                    expect(personInformation.count).toBe(1);

                    person.children.push(baby2);
                    expect(personInformation.count).toBe(1);

                    baby2.atHome = true;
                    expect(personInformation.count).toBe(2);

                });

                it("TODO must no longer be dependent on removed members of an array that is along a dependent property path", function() {
                });

            });

            describe("when an object with dependent properties is encountered along a property path", function() {

                var department,
                    personInformation;

                beforeEach(function() {
                    person.firstName = "Alice";
                    person.lastName = "Allman";

                    department = Department.create();
                    personInformation = {};
                });


                it("should correctly react to changes to the dependent property when the bath was fully populated when the binding was defined", function() {
                    department.manager = person;

                    Object.defineBinding(personInformation, "name", {
                        "boundObject": department,
                        "boundObjectPropertyPath": "manager.name",
                        "oneway": true
                    });

                    person.lastName = "Somebody";

                    expect(personInformation.name).toBe("Alice Somebody");
                });

                it("should correctly react to changes to the dependent property when the bath was a dead-end when the binding was defined", function() {
                    Object.defineBinding(personInformation, "name", {
                        "boundObject": department,
                        "boundObjectPropertyPath": "manager.name",
                        "oneway": true
                    });

                    department.manager = person;

                    person.lastName = "Somebody";

                    expect(personInformation.name).toBe("Alice Somebody");
                });

            })

            describe("when an event occurs along the event distribution path for an object with dependent properties", function() {

                it("must not interpret a change event affecting a property on another object as a change at its own dependent property if the properties have the same name", function() {
                    person.firstName = "Alice";
                    person.lastName = "Allman";

                    var child = Person.create();
                    child.firstName = "Bob";
                    child.lastName = "Baggins";
                    child.parentProperty = "parent";
                    child.parent = person;

                    var personInformation = {};
                    var childInformation = {};

                    // These bindings trigger installing listeners for the dependencies for the 'name' property
                    Object.defineBinding(personInformation, "name", {
                        boundObject: person,
                        boundObjectPropertyPath: "name"
                    });

                    Object.defineBinding(childInformation, "name", {
                        boundObject: child,
                        boundObjectPropertyPath: "name"
                    });

                    var personObserver = {
                        handleChange: function(evt) {}
                    }

                    var childObserver = {
                        handleChange: function() {}
                    }

                    spyOn(personObserver, "handleChange").andCallThrough();
                    spyOn(childObserver, "handleChange");

                    person.addPropertyChangeListener("name", personObserver, false);
                    child.addPropertyChangeListener("name", childObserver, false);

                    child.firstName = "Robert";

                    // Parent should be unaffected by the dependency;
                    expect(personObserver.handleChange.callCount).toBe(0);
                    expect(personInformation.name).toBe("Alice Allman");
                    expect(person.name).toBe("Alice Allman");

                    expect(childObserver.handleChange).toHaveBeenCalled();
                    expect(childInformation.name).toBe("Robert Baggins");
                    expect(child.name).toBe("Robert Baggins");

                });

            });

        });

    });

    describe("an object with a circular dependency", function() {

        var Example, example;

        Example = Montage.create(Montage, {

            _foo: {
                value: "foo"
            },

            foo: {
                dependencies: ["baz"],
                get: function() {
                    return "foo (" + this._foo + ") reports baz: " + this._baz;
                },
                set: function(value) {
                    this._foo = value;
                }
            },

            _bar: {
                value: "bar"
            },

            bar: {
                dependencies: ["foo"],
                get: function() {
                    return "bar (" + this._bar + ") reports foo: " + this._foo;
                },
                set: function(value) {
                    this._bar = value;
                }

            },

            _baz: {
                value: "baz"
            },

            baz: {
                dependencies: ["bar"],
                get: function() {
                    return "baz (" + this._baz + ") reports bar: " + this._bar;
                },
                set: function(value) {
                    this._baz = value;
                }
            }

        });

        beforeEach(function() {
            example = Example.create();
        });

        it("should allow installing listeners on properties involved in the cycle without looping infinitely", function() {
            expect(function() {
                example.addPropertyChangeListener("foo", function() {});
                example.addPropertyChangeListener("bar", function() {});
                example.addPropertyChangeListener("baz", function() {});
            }).not.toThrow();
        });

    })

});
