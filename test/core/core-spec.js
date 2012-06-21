/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
// TODO [June 20 2011 PJYF] This s temporary implementation of WeakMap to let the browser catch up.
var WeakMap = require("montage/core/shim/weak-map").WeakMap;
var Map = require("montage/core/shim/structures").Map;

describe("core/core-spec", function() {

    describe("inherited object creation and basic properties", function() {
        var A,
            BSubClassOfA,
            a,
            a2,
            b,
            object,
            object2;

        beforeEach(function() {
            A = Montage.create(Montage);
            Object.defineProperty(A, "_montage_metadata", {
                value: {
                    moduleId:"core-spec",
                    objectName:"A",
                    isInstance:false
                },
                enumerable:false
            });

            BSubClassOfA = Montage.create(A);
            Object.defineProperty(BSubClassOfA, "_montage_metadata", {
                value: {
                    moduleId:"core-spec",
                    objectName:"BSubClassOfA",
                    isInstance:false
                },
                enumerable:false
            });

            a = Montage.create(A);
            a2 = Montage.create(A);
            b = Montage.create(BSubClassOfA);
            object = {};
            object2 = {};
        });

        describe("regular objects", function() {

            it("should have a unique uuid defined", function() {
                expect(object.uuid).toBeTruthy();
                expect(object2.uuid).toBeTruthy();
                expect(object.uuid).not.toBe(object2.uuid);
            });

            it("should have a constant uuid", function() {
                expect(object.uuid).toBe(object.uuid);
            });

            it("should have a collection of binding descriptors", function() {
                expect(Object.getPropertyDescriptor(object, "_bindingDescriptors")).toBeTruthy();
            });
        });

        describe("Montage objects", function() {

            describe("getting prototypes uuid", function() {

                it("should have a unique uuid defined", function() {
                    expect(A.uuid).toBeTruthy();
                    expect(BSubClassOfA.uuid).toBeTruthy();
                    expect(A.uuid).not.toEqual(BSubClassOfA.uuid);
                });

                it("shouldn't affect the instances' uuid", function() {
                    expect(a.uuid).toBeTruthy();
                    expect(b.uuid).toBeTruthy();
                    expect(a.uuid).not.toEqual(A.uuid);
                    expect(b.uuid).not.toEqual(BSubClassOfA.uuid);
                });
            });

            it("should have the right prototype chain", function() {
                expect(a).not.toBeNull();
                expect(b).not.toBeNull();
                expect(BSubClassOfA.__proto__).toBe(A);
                expect(a.__proto__).toBe(A);
                expect(b.__proto__).toBe(BSubClassOfA);
            });

            it("should have a unique uuid defined", function() {
                expect(a.uuid).toBeTruthy();
                expect(a2.uuid).toBeTruthy();
                expect(a.uuid).not.toEqual(a2.uuid);

                expect(b.uuid).toBeTruthy();
                expect(a.uuid).not.toEqual(b.uuid);
            });

            it("should have a constant uuid", function() {
                expect(a.uuid).toBe(a.uuid);
                expect(b.uuid).toBe(b.uuid);
            });

            it("should be equal based on uuid", function() {
                expect(a.equals(a2)).toBeFalsy();
                var a3 = Montage.create(Montage);
                a3.__proto__ = null;
                Object.defineProperty(a3, "uuid", {
                    value:a.uuid
                });
                a3.__proto__ = Montage;
                expect(a.equals(a3)).toBeTruthy();
            });

            it("should have a collection of binding descriptors", function() {
                expect(Object.getPropertyDescriptor(Montage, "_bindingDescriptors")).toBeTruthy();
            });

            describe("defineProperty", function() {

                var foo;

                describe("object value", function () {

                    beforeEach(function () {
                        foo = Montage.create();
                    });

                    it("should be enumerable by default", function () {
                        Montage.defineProperty(foo, "objectProperty", {
                            value: {}
                        });
                        expect(Object.getPropertyDescriptor(foo, "objectProperty").enumerable).toBeTruthy();
                    });
                });

                describe("underscore property name object value", function() {

                    beforeEach(function() {
                        foo = Montage.create();
                    });

                    it("should not be enumerable by default", function() {
                        Montage.defineProperty(foo, "_privateObjectProperty", {
                            value: {}
                        });
                        expect(Object.getPropertyDescriptor(foo, "_privateObjectProperty").enumerable).toBeFalsy();
                    });

                    it("should be enumerable if underscore but overridden", function() {
                        Montage.defineProperty(foo, "_privateObjectProperty", {
                            value: {},
                            enumerable:true
                        });
                        expect(Object.getPropertyDescriptor(foo, "_privateObjectProperty").enumerable).toBeTruthy();
                    });
                });

                describe("function value", function() {

                    beforeEach(function() {
                        foo = Montage.create();
                    });

                    it("should be non-enumerable by default", function() {
                        Montage.defineProperty(foo, "objectProperty", {
                            value: function() {

                            }
                        });
                        expect(Object.getPropertyDescriptor(foo, "objectProperty").enumerable).toBeFalsy();
                    });
                });

                describe("getter setter", function() {

                    beforeEach(function() {
                        foo = Montage.create();
                    });

                    it("should be enumerable by default", function() {
                        Montage.defineProperty(foo, "objectProperty", {
                            get: function() {

                            },
                            set: function() {

                            }
                        });
                        expect(Object.getPropertyDescriptor(foo, "objectProperty").enumerable).toBeTruthy();
                    });
                });
            });

        });

        describe("serializable property attribute", function() {
            var A, B;
            var defaultPropertyNamesCount = Montage.getSerializablePropertyNames({}).length;

            beforeEach(function() {
                A = {};
                B = Montage.create(A);
            })

            it("should set a property as serializable", function() {
                Montage.defineProperty(A, "foo", {serializable:true});

                var propertyNames = Montage.getSerializablePropertyNames(A);

                expect(propertyNames.length - defaultPropertyNamesCount).toBe(1);
                expect(propertyNames).toContain("foo");
            });

            it("must not set a property as serializable", function() {
                Montage.defineProperty(A, "foo", {serializable:false});

                var propertyNames = Montage.getSerializablePropertyNames(A);

                expect(propertyNames.length - defaultPropertyNamesCount).toBe(0);
                expect(propertyNames).not.toContain("foo");
            });

            it("should set the serializable attribute in properties as defined", function() {
                Montage.defineProperties(A, {
                    foo: {serializable:false},
                    foz: {serializable:true},
                    bar: {serializable:false},
                    baz: {serializable:true}
                });

                var propertyNames = Montage.getSerializablePropertyNames(A);

                expect(propertyNames.length - defaultPropertyNamesCount).toBe(2);
                expect(propertyNames).not.toContain("foo");
                expect(propertyNames).toContain("foz");
                expect(propertyNames).not.toContain("bar");
                expect(propertyNames).toContain("baz");
            });

            it("should inherit the serializable property attribute", function() {
                Montage.defineProperty(A, "foo", {serializable:true});

                var propertyNames = Montage.getSerializablePropertyNames(B);

                expect(propertyNames.length - defaultPropertyNamesCount).toBe(1);
                expect(propertyNames).toContain("foo");
            });

            it("should override the serializable property attribute", function() {
                Montage.defineProperty(A, "foo", {serializable:false});
                Montage.defineProperty(B, "foo", {serializable:true});

                var propertyNames = Montage.getSerializablePropertyNames(B);

                expect(propertyNames.length - defaultPropertyNamesCount).toBe(1);
                expect(propertyNames).toContain("foo");
            });
        });

        describe("extended property attributes", function() {
            var A, B;

            beforeEach(function() {
                A = {};
                B = Montage.create(A);
            });

            it("should return the boolean attribute values", function() {
                Montage.defineProperties(A, {
                    "foo": {serializable:true, value:null},
                    "bar": {serializable:false, value:null},
                    "baz": {value:null}
                });

                var attributes = Montage.getPropertyAttributes(A, "serializable");

                expect(attributes.foo).toBe(true);
                expect(attributes.bar).toBe(false);
                expect(attributes.baz).toBeUndefined();

                expect(Montage.getPropertyAttribute(A, "foo", "serializable")).toBe(true);
                expect(Montage.getPropertyAttribute(A, "bar", "serializable")).toBe(false);
                expect(Montage.getPropertyAttribute(A, "baz", "serializable")).toBeUndefined();
            });

            it("should return the defined attribute values", function() {
                Montage.defineProperties(A, {
                    "foo": {serializable:"auto", value:null},
                    "bar": {serializable:"reference", value:null},
                    "baz": {serializable:"value", value:null}
                });

                var attributes = Montage.getPropertyAttributes(A, "serializable");

                expect(attributes.foo).toBe("auto");
                expect(attributes.bar).toBe("reference");
                expect(attributes.baz).toBe("value");

                expect(Montage.getPropertyAttribute(A, "foo", "serializable")).toBe("auto");
                expect(Montage.getPropertyAttribute(A, "bar", "serializable")).toBe("reference");
                expect(Montage.getPropertyAttribute(A, "baz", "serializable")).toBe("value");
            });

            it("should return the inherited defined attribute values", function() {
                Montage.defineProperties(A, {
                    "foo": {serializable:"auto", value:null},
                    "bar": {serializable:"value", value:null}
                });
                Montage.defineProperties(B, {
                    "bar": {serializable:"reference", value:null},
                    "baz": {serializable:"value", value:null}
                });

                var attributes = Montage.getPropertyAttributes(B, "serializable");

                expect(attributes.foo).toBe("auto");
                expect(attributes.bar).toBe("reference");
                expect(attributes.baz).toBe("value");

                expect(Montage.getPropertyAttribute(B, "foo", "serializable")).toBe("auto");
                expect(Montage.getPropertyAttribute(B, "bar", "serializable")).toBe("reference");
                expect(Montage.getPropertyAttribute(B, "baz", "serializable")).toBe("value");
            });
        });
    });

    describe("method inheritance calling \"super\"", function() {

        var A = Montage.create(Montage, {
            everywhere: {
                enumerable:false,
                value: function() {
                    return "everywhereA";
                }
            },
            skipped: {
                enumerable:false,
                value: function() {
                    return "skippedA";
                }
            },
            getEverywhere: {
                get: function() {
                    return "everywhereA";
                }
            },
            getSkipped: {
                get: function() {
                    return "skippedA";
                }
            },
            inheritedValue: {
                value: function() {
                    return "valueA";
                }
            },
            valueFromPrototype: {
                value: function() {
                    return "PrototypeValueA";
                }
            }
        }),
            B = Montage.create(A, {
                everywhere: {
                    enumerable:false,
                    value: function() {
                        return "everywhereB";
                    }
                },
                getEverywhere: {
                    get: function() {
                        return "everywhereB";
                    }
                },
                inheritedValue: {
                    value: function() {
                        return Object.getPrototypeOf(B)["inheritedValue"].call(this);
                    }
                },
                valueFromPrototype: {
                    value: function() {
                        return "PrototypeValueB";
                    }
                }
            }),
            C = Montage.create(B, {
                everywhere: {
                    enumerable:false,
                    value: function() {
                        return "everywhereC";
                    }
                },
                skipped: {
                    enumerable:false,
                    value: function() {
                        return "skippedC";
                    }
                },
                getEverywhere: {
                    get: function() {
                        return "everywhereC";
                    }
                },
                getSkipped: {
                    get: function() {
                        return "skippedC";
                    }
                },
                inheritedValue: {
                    value: function() {
                        return Object.getPrototypeOf(C)["inheritedValue"].call(this);
                    }
                },
                valueFromPrototype: {
                    value: function() {
                        return Object.getPrototypeOf(C)["valueFromPrototype"].call(this);
                    }
                }
            }),
            a = Montage.create(A),
            b = Montage.create(B),
            c = Montage.create(C);

        it("should override methods", function() {
            expect(a.everywhere()).toEqual("everywhereA");
            expect(b.everywhere()).toEqual("everywhereB");
            expect(c.everywhere()).toEqual("everywhereC");
            expect(a.skipped()).toEqual("skippedA");
            expect(b.skipped()).toEqual("skippedA");
            expect(c.skipped()).toEqual("skippedC");
        });

        it("should be able to call prototype method and return expected value", function() {
            expect(Object.getPrototypeOf(A)["everywhere"]).toBeUndefined();
            expect(Object.getPrototypeOf(B)["everywhere"].call(b)).toEqual("everywhereA");
            expect(Object.getPrototypeOf(C)["everywhere"].call(c)).toEqual("everywhereB");
            expect(Object.getPrototypeOf(B)["skipped"].call(b)).toEqual("skippedA");
            expect(Object.getPrototypeOf(C)["skipped"].call(c)).toEqual("skippedA");
        });

        it("should be able to get properties from the prototype and return expected value", function() {
            expect(Object.getPropertyDescriptor(Object.getPrototypeOf(B), "getEverywhere").get.call(b)).toEqual("everywhereA");
            expect(Object.getPropertyDescriptor(Object.getPrototypeOf(C), "getEverywhere").get.call(c)).toEqual("everywhereB");
            expect(Object.getPropertyDescriptor(Object.getPrototypeOf(B), "getSkipped").get.call(b)).toEqual("skippedA");
            expect(Object.getPropertyDescriptor(Object.getPrototypeOf(C), "getSkipped").get.call(c)).toEqual("skippedA");
        });

        it("inheritedValue() should call inherited methods", function() {
            expect(b.inheritedValue()).toEqual("valueA");
            expect(c.inheritedValue()).toEqual("valueA");
        });

        it("valueFromPrototype should call parent prototype method", function() {
            expect(C.valueFromPrototype()).toEqual("PrototypeValueB");
        });
    });

    describe("split getter/setter inheritance", function() {
        var A = Montage.create(Montage, {
                getsetEverywhere: {
                    get: function() {
                        return this._everywhere;
                    },
                    set: function(value) {
                        this._everywhere = "setA";
                    }
                },
                getsetSkipped: {
                    get: function() {
                        return this._skipped;
                    },
                    set: function(value) {
                        this._skipped = "setA";
                    }
                },
                _skipped: {
                    value:"A"
                },
                _everywhere: {
                    value:"A"
                }
            }),
            B = Montage.create(A, {
                getsetEverywhere: {
                    get: function() {
                        return this._everywhere;
                    },
                    set: function(value) {
                        this._everywhere = "setB";
                    }
                },
                getsetSkipped: {
                    get: function() {
                        return this._skipped;
                    }
                }

            }),
            C = Montage.create(B, {
                getsetEverywhere: {
                    get: function() {
                        return this._everywhere;
                    },
                    set: function(value) {
                        this._everywhere = "setC";
                    }
                },
                getsetSkipped: {
                    get: function() {
                        return this._skipped;
                    },
                    set: function(value) {
                        this._skipped = "setC";
                    }
                }
            }),
            a = Montage.create(A),
            b = Montage.create(B),
            c = Montage.create(C);

        it("should override methods", function() {
            c.getsetEverywhere = "X";
            expect(c.getsetEverywhere).toEqual("setC");
            b.getsetEverywhere = "X";
            expect(b.getsetEverywhere).toEqual("setB");
            a.getsetEverywhere = "X";
            expect(a.getsetEverywhere).toEqual("setA");
            c.getsetSkipped = "X";
            expect(c.getsetSkipped).toEqual("setC");
            Object.getPropertyDescriptor(Object.getPrototypeOf(B), "getsetSkipped").set.call(b, "X");
            expect(b.getsetSkipped).toEqual("setA");
            a.getsetSkipped = "X";
            expect(a.getsetSkipped).toEqual("setA");
        });

        describe("distinct properties", function() {

            it("must not allow marking a get-only property with as distinct", function() {
                expect(function() {
                    Montage.defineProperty({}, "foo", {
                        distinct: true,
                        get: function() {}
                    })
                }).toThrow();
            });

            it("must not allow marking a set-only property with as distinct", function() {
                expect(function() {
                    Montage.defineProperty({}, "foo", {
                        distinct: true,
                        set: function() {}
                    })
                }).toThrow();
            });

            it("must not allow marking a get-set property with as distinct", function() {
                expect(function() {
                    Montage.defineProperty({}, "foo", {
                        distinct: true,
                        get: function() {},
                        set: function() {}
                    })
                }).toThrow();
            });

            describe("array property", function() {

                var subType = Montage.create(Montage, {
                    collection: {
                        value:[],
                        distinct:true
                    },
                    collectionWithValues: {
                        value:[0, 1, 2],
                        distinct:true
                    }
                });
                var a = Montage.create(subType);
                var b = Montage.create(subType);

                it("should have different collection property values", function() {
                    expect(a.collection !== b.collection).toBeTruthy();
                    expect(a.collectionWithValues !== b.collectionWithValues).toBeTruthy();
                });

                it("should have the same prototype", function() {
                    expect(a.collection.__proto__ === b.collection.__proto__).toBeTruthy();
                    expect(a.collectionWithValues.__proto__ === b.collectionWithValues.__proto__).toBeTruthy();
                });

                it("should have the same default content", function() {
                    expect(a.collectionWithValues[0]).toEqual(0);
                    expect(a.collectionWithValues[1]).toEqual(1);
                    expect(a.collectionWithValues[2]).toEqual(2);
                });

                describe("with deep inheritance", function() {
                    var subSubType = Montage.create(subType);
                    var a = Montage.create(subSubType);
                    var b = Montage.create(subSubType);

                    it("should have different collection property values", function() {
                        expect(a.collection !== b.collection).toBeTruthy();
                    });

                    it("should have the same prototype", function() {
                        expect(a.collection.__proto__ === b.collection.__proto__).toBeTruthy();
                    });

                });

            });

            describe("object property", function() {
                var subType = Montage.create(Montage, {
                    object: {
                        value: {},
                        distinct:true
                    },
                    objectWithValues: {
                        value: {foo:"bar"},
                        distinct:true
                    }
                });
                var a = Montage.create(subType);
                var b = Montage.create(subType);

                it("should have different collection property values", function() {
                    expect(a.object !== b.object).toBeTruthy();
                    expect(a.objectWithValues !== b.objectWithValues).toBeTruthy();
                });

                it("should have the same prototype", function() {
                    expect(a.object.__proto__ === b.object.__proto__).toBeTruthy();
                    expect(a.objectWithValues.__proto__ === b.objectWithValues.__proto__).toBeTruthy();
                });

                it("should have the same default content", function() {
                    expect(a.objectWithValues["foo"]).toEqual("bar");
                });

            });

            describe("WeakMap property", function() {
                var subType = Montage.create(Montage, {
                    object: {
                        value:new WeakMap(),
                        distinct:true
                    }
                });
                var a = Montage.create(subType);
                var b = Montage.create(subType);
                var wm = new WeakMap()

                it("should have different collection property values", function() {
                    expect(a.object !== b.object).toBeTruthy();
                });

                it("should have the same prototype", function() {
                    expect(a.object.__proto__ === b.object.__proto__).toBeTruthy();
                });

                it("should be weak maps", function() {
                    expect(a.object.__proto__ === wm.__proto__).toBeTruthy();
                    expect(b.object.__proto__ === wm.__proto__).toBeTruthy();
                });
            });

            describe("Map property", function() {
                var subType = Montage.create(Montage, {
                    object: {
                        value:new Map(),
                        distinct:true
                    }
                });
                var a = Montage.create(subType);
                var b = Montage.create(subType);
                var wm = new Map()

                it("should have different collection property values", function() {
                    expect(a.object !== b.object).toBeTruthy();
                });

                it("should have the same prototype", function() {
                    expect(a.object.__proto__ === b.object.__proto__).toBeTruthy();
                });

                it("should be weak maps", function() {
                    expect(a.object.__proto__ === wm.__proto__).toBeTruthy();
                    expect(b.object.__proto__ === wm.__proto__).toBeTruthy();
                });
            });

        });

    });

    describe("getting properties", function() {

        it("should return the value at the specified property", function() {
            var foo = {a:42};
            expect(foo.getProperty("a")).toBe(42);
        });

        it("must return undefined if the specified property does not exist", function() {
            var foo = {a:42};
            expect(foo.getProperty("b")).toBeUndefined();
        });

    });

    describe("setting properties", function() {

        it("should set the value at the specified property", function() {
            var foo = {a:42};
            foo.setProperty("a", 22);
            expect(foo.getProperty("a")).toBe(22);
        });

        it("should set the value at the specified property even if that property did not exist", function() {
            var foo = {a:42};
            foo.setProperty("b", 22);
            expect(foo.getProperty("b")).toBe(22);
        });

        it("should set the value at the specified index of an empty array if that array did not contain that index", function() {

            var foo = [];
            foo.setProperty("0", "hello");
            expect(foo.getProperty("0")).toBe("hello");

            foo = [];
            foo.setProperty("1", "hello");
            expect(foo.getProperty("1")).toBe("hello");

            foo = [];
            foo.setProperty("100", "goodbye");
            expect(foo.getProperty("100")).toBe("goodbye");
        });

        it("should set the value at the specified index of an non-empty array if that array did not contain that index", function() {
            var foo = ["original"];
            foo.setProperty("0", "hello");
            expect(foo.getProperty("0")).toBe("hello");

            foo = ["original"];
            foo.setProperty("1", "hello");
            expect(foo.getProperty("1")).toBe("hello");

            foo = ["original"];
            foo.setProperty("100", "goodbye");
            expect(foo.getProperty("100")).toBe("goodbye");
        });

    });

    describe("delegate methods", function() {
        var object,
            delegate;

        beforeEach(function() {
            object = Montage.create(Montage);
            delegate = {};
            object.delegate = delegate;
        });

        it("should call generic delegate method", function() {
            delegate.methodToBeCalled = function() {};
            spyOn(delegate, "methodToBeCalled");
            object.callDelegateMethod("methodToBeCalled");
            expect(delegate.methodToBeCalled).toHaveBeenCalled();
        });

        it("should call delegate method with identifier", function() {
            delegate.aMethodToBeCalled = function() {};
            spyOn(delegate, "aMethodToBeCalled");
            object.identifier = "a";
            object.callDelegateMethod("methodToBeCalled");
            expect(delegate.aMethodToBeCalled).toHaveBeenCalled();
        });

        it("should call generic delegate method even if the object has an identifier", function() {
            delegate.methodToBeCalled = function() {};
            spyOn(delegate, "methodToBeCalled");
            object.identifier = "a";
            object.callDelegateMethod("methodToBeCalled");
            expect(delegate.methodToBeCalled).toHaveBeenCalled();
        });
    });
});
