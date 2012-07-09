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

require("montage");

describe("core/extras/object", function () {

    describe("Object", function () {

        it("should have no enumerable properties", function () {
            expect(Object.keys(Object.prototype)).toEqual([]);
        });

        it("should have no enumerable static properties", function () {
            expect(Object.keys(Object)).toEqual([]);
        });

    });

    describe("Object.empty", function () {

        it("should own no properties", function () {
            expect(Object.getOwnPropertyNames(Object.empty)).toEqual([]);
            expect(Object.keys(Object.empty)).toEqual([]);
        });

        it("should have no prototype", function () {
            expect(Object.getPrototypeOf(Object.empty)).toBe(null);
        });

        it("should be immutable", function () {
            "strict mode";
            expect(function () {
                Object.empty.a = 10; // should throw an error in strict mode
                if (Object.empty.a !== 10) {
                    throw new Error("Unchanged");
                }
            }).toThrow();
        });

    });

    describe("Object.isObject", function () {

        [
            ["null is not an object", null, false],
            ["numbers are not objects", 1, false],
            ["undefined is not an object", undefined, false],
            ["arrays are objects", [], true],
            ["object literals are objects", {}, true],
            [
                "pure objects (null prototype) are",
                Object.create(null),
                true
            ]
        ].forEach(function (test) {
            it("should recognize that " + test[0], function () {
                expect(Object.isObject(test[1])).toEqual(test[2]);
            });
        });

    });

    describe("Object.getValueOf", function () {
        var fakeNumber = Object.create({
            valueOf: function () {
                return 10;
            }
        });

        var object = {valueOf: 10};
        var tests = [
            [10, 10, "number"],
            [object, object, "object (identical, with misleading owned property)"],
            [new Number(20), 20, "boxed number"],
            [fakeNumber, 10, "fake number"]
        ];

        tests.forEach(function (test) {
            it(test[2], function () {
                expect(Object.getValueOf(test[0])).toBe(test[1]);
            });
        });

    });

    describe("Object.owns", function () {

        it("should recognized an owned property", function () {
            expect(Object.owns({a: 0}, "a")).toEqual(true);
        });

        it("should distinguish an inherited property", function () {
            expect(Object.owns(Object.prototype, "toString")).toEqual(true);
        });

    });

    describe("Object.has", function () {

        it("should recognized an owned property", function () {
            expect(Object.has({toString: true}, "toString")).toEqual(true);
        });

        it("should recognize an inherited propertry", function () {
            var parent = {"a": 10};
            var child = Object.create(parent);
            expect(Object.has(child, "a")).toEqual(true);
        });

        it("should distinguish a property from the Object prototype", function () {
            expect(Object.has({}, "toString")).toEqual(false);
        });

        it("should recognize a property on a null prototype chain", function () {
            var parent = Object.create(null);
            parent.a = 10;
            var child = Object.create(parent);
            expect(Object.has(child, "a")).toEqual(true);
        });

        it("should recognize a falsy property", function () {
            expect(Object.has({a:0}, "a")).toEqual(true);
        });

        it("should throw an error if the first argument is not an object", function () {
            expect(function () {
                Object.has(10, 10);
            }).toThrow();
        });

        it("should delegate to a prototype method", function () {
            var Type = Object.create(Object.prototype, {
                has: {
                    value: function (key) {
                        return key === "a";
                    }
                }
            });
            var instance = Object.create(Type);
            expect(Object.has(instance, "a")).toEqual(true);
            expect(Object.has(instance, "toString")).toEqual(false);
        });

        it("should not delegate to an owned 'has' method", function () {
            expect(Object.has({has: function () {}}, "has")).toEqual(true);
        });

    });

    describe("Object.get", function () {

        it("should get an owned property from an object literal", function () {
            expect(Object.get({a: 10}, "a")).toEqual(10);
        });

        it("should not get a property from the Object prototype on a literal", function () {
            expect(Object.get({}, "toString")).toEqual(undefined);
        });

        it("should delegate to a prototype method", function () {
            var Type = Object.create(Object.prototype, {
                get: {
                    value: function (key) {
                        if (key === "a")
                            return 10;
                    }
                }
            });
            var instance = Object.create(Type);
            expect(Object.get(instance, "a")).toEqual(10);
        });

        it("should not delegate to an owned 'get' method", function () {
            expect(Object.get({get: 10}, "get")).toEqual(10);
        });

        it("should fallback to a default argument if defined", function () {
            expect(Object.get({}, "toString", 10)).toEqual(10);
        });

        it("should fallback to using an 'undefinedGet' method if present", function () {
            var Type = Object.create(Object.prototype, {
                undefinedGet: {
                    value: function (key) {
                        return [];
                    }
                }
            });
            var instance = Object.create(Type);
            expect(Object.get(instance, "a")).toEqual([]);
        });

        it("should fallback to undefined if no 'undefinedGet' method is present", function () {
            var instance = Object.create(null);
            expect(Object.get(instance, "a")).toEqual(undefined);
        });

    });

    describe("Object.set", function () {

        it("should set a property", function () {
            var object = {};
            Object.set(object, "set", 10);
            expect(Object.get(object, "set")).toEqual(10);
        });

        it("should not confuse a property method and content", function () {
            var object = {};
            Object.set(object, "set", function () {
            });
            Object.set(object, "set", 10);
            expect(Object.get(object, "set")).toEqual(10);
        });

        it("should delegate to a 'set' method", function () {
            var spy = jasmine.createSpy();
            var Type = Object.create(Object.prototype, {
                set: {
                    value: spy
                }
            });
            var instance = Object.create(Type);
            Object.set(instance, "a", 10);
            expect(spy.argsForCall).toEqual([
                ["a", 10]
            ]);
        });

    });

    describe("Object.forEach", function () {

        it("should iterate the owned properties of an object", function () {
            var spy = jasmine.createSpy();
            var object = {a: 10, b: 20, c: 30};
            Object.forEach(object, spy);
            expect(spy.argsForCall).toEqual([
                [10, "a", object],
                [20, "b", object],
                [30, "c", object]
            ]);
        });

        it("should pass a thisp into the callback", function () {
            var thisp = {};
            Object.forEach([1], function (value, key, object) {
                expect(this).toBe(thisp);
                expect(value).toEqual(1);
                expect(key).toEqual("0");
                expect(object).toEqual([1]);
                thisp = null;
            }, thisp);
            expect(thisp).toEqual(null);
        });

    });

    describe("Object.map", function () {

        it("should iterate the owned properties of an object with a context thisp", function () {
            var object = {a: 10, b: 20}
            var result = Object.map(object, function (value, key, o) {
                expect(o).toBe(object);
                return key + this + value;
            }, ": ").join(", ");
            expect(result).toEqual("a: 10, b: 20");
        });

    });

    describe("Object.values", function () {

        it("should produce the values for owned properties", function () {
            expect(Object.values({b: 10, a: 20})).toEqual([10, 20]);
        });

    });

    describe("Object.is", function () {

        var distinctValues = {
            'positive zero': 0,
            'negative zero': -0,
            'positive infinity': 1/0,
            'negative infinity': -1/0,
            'one': 1,
            'two': 2,
            'NaN': NaN,
            'objects': {},
            'other objects': {}
        };

        Object.forEach(distinctValues, function (a, ai) {
            Object.forEach(distinctValues, function (b, bi) {
                if (ai < bi)
                    return;
                var operation = ai === bi ? "recognizes" : "distinguishes";
                it(operation + " " + ai + " and " + bi, function () {
                    expect(Object.is(a, b)).toEqual(ai === bi);
                });
            });
        });

    });

    describe("Object.equals", function () {
        var fakeNumber = Object.create({
            valueOf: function () {
                return 10;
            }
        });
        var equatable = Object.create({
            value: 10,
            equals: function (n) {
                return n === 10 || n.value === 10;
            }
        });

        var objectFromDifferentPrototype = Object.create({});
        objectFromDifferentPrototype.a = 10;

        var fakeArrayType = Object.create(Object.prototype, {
        });

        var fakeArray = Object.create(fakeArrayType);

        var equivalenceClasses = [
            {
                'unboxed number': 10,
                'boxed number': new Number(10),
                'faked number': fakeNumber,
                'equatable': equatable
            },
            {
                'array': [10],
                'other array': [10]
            },
            {
                'nested array': [[10, 20], [30, 40]]
            },
            {
                'object': {a: 10},
                'other object': {a: 10}
            },
            {
                'object from different prototype': objectFromDifferentPrototype
            },
            {
                'now': new Date()
            }
        ];

        // positives:
        // everything should be equal to every other thing in
        // its equivalence class
        equivalenceClasses.forEach(function (equivalenceClass) {
            Object.forEach(equivalenceClass, function (a, ai) {
                equivalenceClass["cloned " + ai] = Object.clone(a);
            });
            // within each pair of class, test exhaustive combinations to cover
            // the commutative property
            Object.forEach(equivalenceClass, function (a, ai) {
                Object.forEach(equivalenceClass, function (b, bi) {
                    it(ai + " equals " + bi, function () {
                        expect(Object.equals(a, b)).toBe(true);
                    });
                });
            });
        });

        // negatives
        // everything from one equivalence class should not equal
        // any other thing from a different equivalence class
        equivalenceClasses.forEach(function (aClass, aClassIndex) {
            equivalenceClasses.forEach(function (bClass, bClassIndex) {
                // only compare each respective class against another once (>),
                // and not for equivalence classes to themselves (==).
                // This cuts the bottom right triangle below the diagonal out
                // of the test matrix of equivalence classes.
                if (aClassIndex >= bClassIndex)
                    return;
                // but within each pair of classes, test exhaustive
                // combinations to cover the commutative property
                Object.forEach(aClass, function (a, ai) {
                    Object.forEach(bClass, function (b, bi) {
                        it(ai + " not equals " + bi, function () {
                            expect(Object.equals(a, b)).toBe(false);
                        });
                    });
                });
            });
        });

    });

    describe("Object.compare", function () {

        var fakeOne = Object.create({
            valueOf: function () {
                return 1;
            }
        });

        var comparable = Object.create({
            create: function (compare) {
                var self = Object.create(this);
                self._compare = compare;
                return self;
            },
            compare: function (other) {
                return this._compare(other);
            }
        });

        var now = new Date();

        var tests = [
            [0, 0, 0],
            [0, 1, -1],
            [1, 0, 1],
            [[10], [10], 0],
            [[10], [20], -10],
            [[100, 10], [100, 0], 10],
            ["a", "b", -1],
            [now, now, 0, "now to itself"],
            [
                comparable.create(function () {
                    return -1;
                }),
                null,
                -1,
                "comparable"
            ],
            [
                null,
                comparable.create(function () {
                    return 1;
                }),
                -1,
                "opposite comparable"
            ],
            [{b: 10}, {a: 0}, 0, "incomparable to another"],
            [new Number(-10), 20, -30, "boxed number to real number"],
            [fakeOne, 0, 1, "fake number to real number"]
        ];

        tests.forEach(function (test) {
            it(
                test[3] ||
                (
                    JSON.stringify(test[0]) + " to " +
                    JSON.stringify(test[1])
                ),
                function () {
                    expect(Object.compare(test[0], test[1])).toEqual(test[2]);
                }
            );
        });

    });

    describe("Object.getPropertyDescriptor", function () {
        var grandparent = Object.create(null);
        var parent = Object.create(grandparent, {
            a: {
                value: 10
            }
        });
        parent.b = 20;
        var child = Object.create(parent, {
            c: {
                value: 30,
                writable: true,
                configurable: true,
                enumerable: true
            }
        });

        it("should get a named property descriptor at the beginning of the prototype chain", function () {
            expect(Object.getPropertyDescriptor(child, "a")).toEqual({
                value: 10,
                writable: false,
                enumerable: false,
                configurable: false
            });
        });

        it("should get a named property descriptor in the middle of the prototype chain", function () {
            expect(Object.getPropertyDescriptor(child, "b")).toEqual({
                value: 20,
                writable: true,
                enumerable: true,
                configurable: true
            });
        });

        it("should get a named property descriptor at the end of the prototype chain", function () {
            expect(Object.getPropertyDescriptor(child, "c")).toEqual({
                value: 30,
                writable: true,
                enumerable: true,
                configurable: true
            });
        });

    });

    describe("Object.getPrototypeAndDescriptorDefiningProperty", function () {
        var grandparent = Object.create(null);
        grandparent.a = 10;
        var parent = Object.create(grandparent);
        var child = Object.create(parent);
        it("should fetch a prototype and descriptor from the beginning of the prototype chain", function () {
            var pair = Object.getPrototypeAndDescriptorDefiningProperty(child, "a");
            expect(pair.prototype).toBe(grandparent);
            expect(pair.propertyDescriptor).toEqual({
                value: 10,
                writable: true,
                enumerable: true,
                configurable: true
            });
        });
    });

    describe("Object.clone", function () {

        var graph = {
            object: {a: 10},
            array: [1, 2, 3],
            string: "hello",
            number: 10,
            nestedObject: {
                a: {a1: 10, a2: 20},
                b: {b1: "a", b2: "c"}
            },
            nestedArray: [
                [1, 2, 3],
                [4, 5, 6]
            ],
            mixedObject: {
                array: [1, 3, 4],
                object: {a: 10, b: 20}
            },
            mixedArray: [
                [],
                {a: 10, b: 20}
            ],
            arrayWithHoles: [],
            clonable: Object.create({
                clone: function () {
                    return this;
                }
            })
        }

        graph.cycle = graph;
        graph.arrayWithHoles[10] = 10;

        graph.typedObject = Object.create(null);
        graph.typedObject.a = 10;
        graph.typedObject.b = 10;

        Object.forEach(graph, function (value, name) {
            it(name + " cloned equals self", function () {
                expect(Object.clone(value)).toEqual(value);
            });
        });

        it("should clone zero levels of depth", function () {
            var clone = Object.clone(graph, 0);
            expect(clone).toBe(graph);
        });

        it("should clone object at one level of depth", function () {
            var clone = Object.clone(graph, 1);
            expect(clone).toEqual(graph);
            expect(clone).toNotBe(graph);
        });

        it("should clone object at two levels of depth", function () {
            var clone = Object.clone(graph, 2);
            expect(clone).toEqual(graph);
            expect(clone.object).toNotBe(graph.object);
            expect(clone.object).toEqual(graph.object);
            expect(clone.nestedObject.a).toBe(graph.nestedObject.a);
        });

        it("should clone array at two levels of depth", function () {
            var clone = Object.clone(graph, 2);
            expect(clone).toEqual(graph);
            expect(clone.array).toNotBe(graph.array);
            expect(clone.array).toEqual(graph.array);
        });

        it("should clone identical values at least once", function () {
            var clone = Object.clone(graph);
            expect(clone.cycle).toNotBe(graph.cycle);
        });

        it("should clone identical values only once", function () {
            var clone = Object.clone(graph);
            expect(clone.cycle).toBe(clone);
        });

        it("should clone clonable", function () {
            var clone = Object.clone(graph);
            expect(clone.clonable).toBe(graph.clonable);
        });

    });

    describe("Object#clone", function () {
        var object = {a: {a1: 10, a2: 20}, b: {b1: 10, b2: 20}};

        it("should clone zero levels", function () {
            expect(object.clone(0)).toBe(object);
        });

        it("should clone one level", function () {
            var clone = object.clone(1);
            expect(clone).toEqual(object);
            expect(clone).toNotBe(object);
            expect(clone.a).toBe(object.a);
        });

        it("should clone two levels", function () {
            var clone = object.clone(2);
            expect(clone).toEqual(object);
            expect(clone).toNotBe(object);
            expect(clone.a).toNotBe(object.a);
        });

        it("should clone with reference cycles", function () {
            var cycle = {};
            cycle.cycle = cycle;
            var clone = cycle.clone();
            expect(clone).toEqual(cycle);
            expect(clone).toNotBe(cycle);
            expect(clone.cycle).toBe(clone);
        });

    });

    describe("Object#wipe", function () {

        it("should wipe all owned properties of the object", function () {
            expect(Object.keys({a: 10}.wipe())).toEqual([]);
        });

    });

});

