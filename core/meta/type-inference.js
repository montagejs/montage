/**
 * This is a type inferrence engine and auto-completion suggester that consumes
 * an FRB expression and descriptions of the types in scope and makes a
 * best-effort guess of the type of the expression as a whole, and throws
 * helpful exceptions if there is an obvious type error.  TODO Type objects
 * provide suggestions for available properties and functions and methods that
 * operate on that type.
 *
 * This module exports a type hierarchy for type descriptions.  This model
 * provides ways to express primitive types in JavaScript, plus types described
 * by Montage blueprints.  The types can be marshalled to a JSON format with
 * `type.describe()`, and from JSON with `Type.fromDescription(json)`, with
 * high fidelity except for types backed by blueprints.  Of course, type
 * hierarchies can also be serialized with the Montage serializer.  As such,
 * the JSON type descriptions are only useful for testing and debugging.
 *
 * The engine reuses the FRB `Scope` object to carry type information (as
 * opposed to values, its normal job) that exists in scope for an FRB
 * expression.  So, the `values` and `parameters` properties correspond to
 * `Type` instances describing the value and parameters in scope.
 *
 * ```javascript
 * var Scope = require("frb/scope");
 * var valueType = Type.of([1, 2, 3]);
 * var scope = new Scope(valueType);
 * var result = TypeInference.infer("length", scope);
 * expect(result.describe()).toEqual({type: "number"});
 * ```
 *
 * ## Types
 *
 * Types facilitate a notion of "agreement". If a type "A" has a strict subset
 * of the structure described by type "B", "A" agrees with "B".  This is not
 * necessarily commutative.
 *
 * The type inferrer distinguishes arrays from tuples and records from objects.
 * A tuple has a fixed length and the type of the values at each index may be
 * different.  For example, enumeration produces entries with a number at index
 * 0 and a value from the content of the input at index 1.  A record is similar
 * in that it has a fixed structure.  Blueprints provide more advanced,
 * explicit type information of objects.  The type inferrence engine has no way
 * to model objects used as maps and FRB has little use for such objects since
 * we cannot synchronously observe the creation or deletion of properties.  As
 * such, explict map types, including the `Dict` type from Collections, suffice
 * and are modeled by `MapType` here.
 *
 * The `NullType` has multiple interpretations.  It can either signify that the
 * expression might yield the literal value `null` or `undefined`, but it also
 * signifies that the expression might yield a value of *any* type and the
 * signature of that type is simply unknown.
 *
 * The `Type.of` constructor-method makes a best-effort at inferring the types
 * of values, including instances of Montage objects that have blueprints.  Two
 * particular caveats: the types of arrays and objects are ambiguous.  If
 * `Type.of` encouters an array, it describes its type as being a fixed-length
 * tuple with the types of the values at respective positions, which may be
 * homogenous or heterogenous.  This is fine for the purpose of type-inference
 * because the type of a homogenous tuple "agrees with" the type of an
 * `ArrayType`, which is inherently homogenous.  An object that has no
 * blueprint is presumed to have a `RecordType` with the types of its
 * respective owned properties.  Records are compatible with any object,
 * including objects described by blueprints, as long as the types of the
 * properties are consistent.
 *
 * The `BlueprintType` is a thin layer around a blueprint that translates
 * property and association blueprints into types recognized by the inferrence
 * engine.  The `BlueprintPromiseType` stands for any object that has a
 * blueprint that has not yet been loaded.  As such, it behaves like `NullType`
 * for the purpose of type inference, but has a `blueprintPromise` property so
 * you can wait for it to load and try again for a more complete result.
 *
 * @module
 */

require("collections/shim");

var Montage = require("core/core").Montage;
var parse = require("frb/parse");
var stringify = require("frb/stringify");
var Scope = require("frb/scope");

// TODO For auto-completion, we need the following:
// 1.   Given an operator name, we need to be able to suggest types for all of
// its arguments, and constrain those options based on already-known argument
// types.
// 2.   Given a type, assuming that this will become the type of the first
// argument of another expression, we need to be able to suggest:
// 2.a. operator names
// 2.b. property names and tuple indexes
// 2.c. whether arbitrary indexes are allowed (for arrays) (already done)
// 3.   Given an operator name and the types of all its arguments, we need to
// be able to determine whether this combination of argument types is valid for
// that operator AND then project the type of the result.  This can be done
// already with what is here.
// In summary, we could use a registry of operators with accepted argument
// patterns.

// TODO Look into increasing the reliability of traversing properties through
// blueprints and association blueprints asynchronously.  Regardless of where
// it occurs in the inference engine, if a necessary blueprint was not
// synchronously available, the type returned by `infer` should provide a
// promise or method that will wait for all necessary blueprints to load.

// TODO Type.propertyNames, Type.operatorNames

// TODO review error messages for consistency

// TODO consolidate implementations of sufficiently similar inference methods
// with higher order functions

// TODO verify existence of argument length checks
// TODO make argument length checks consistently display FRB stringify of given
// syntax

// TODO infer the types of components by label.  Afonso points us in the
// direction of `core/serialization/serialization`, which should allow us to
// find the module identifier and exported name for the component having a
// given label, and then we can attempt to get the blueprint property of its
// constructor.

// TODO specs that reveal argument length checks

// TODO Heap type. It’s not array-like, but it is an acceptable input for min
// and max.

var Type = exports.Type = Montage.specialize({
    type: {
        value: null,
        enumerable: true
    },
    describe: {
        value: function () {
            return {type: this.type};
        }
    },
    agreesWith: {
        value: function (that) {
            return (
                this.type === "null" ||
                that.type === "null" ||
                that.type === this.type
            );
        }
    },
    propertyTypes: {
        value: {}
    },
    getPropertyType: {
        value: function (name) {
            if (name in this.propertyTypes) {
                return this.propertyTypes[name];
            } else {
                return nullType;
            }
        }
    },
    inferenceMethods: {
        value: {}
    },
    hasMethod: {
        value: function (name) {
            return name in this.inferenceMethods;
        }
    },
    inferMethodResultType: {
        value: function (name, argTypes, scope, engine) {
            return this.inferenceMethods[name].call(
                engine,
                argTypes,
                scope
            );
        }
    }
}, {
    types: {
        value: {}
    },
    specialize: {
        value: function (prototypeProperties, constructorProperties) {
            var constructor = this.super(prototypeProperties, constructorProperties);
            if (constructor.prototype.hasOwnProperty("type")) {
                this.types[constructor.prototype.type] = constructor;
            }
            return constructor;
        }
    },
    fromDescription: {
        value: function (description) {
            if (!description) {
                return nullType.instance;
            }
            if (description.type in this.types) {
                return this.types[description.type].fromDescription(
                    description
                );
            } else {
                throw new Error(
                    "Cannot deserialize type from description: " +
                    description.type
                );
            }
        }
    },
    of: {
        value: function (value) {
            // TODO maybe extract types from collections
            if (value == null) {
                return nullType;
            } else if (typeof value === "number") {
                return new NumberType(value);
            } else if (typeof value === "boolean") {
                return new BooleanType(value);
            } else if (typeof value === "string") {
                return new StringType(value);
            } else if (Array.isArray(value)) {
                return new TupleType(value.map(this.of, this));
            } else if (typeof value === "object") {
                if (value.constructor.blueprint) {
                    var blueprintPromise = value.constructor.blueprint;
                    if (blueprintPromise.isFulfilled()) {
                        return new BlueprintType(
                            blueprintPromise.inspect().value
                        );
                    } else {
                        return new BlueprintPromiseType(
                            blueprintPromise
                        );
                    }
                } else {
                    var argTypes = {};
                    for (var name in value) {
                        argTypes[name] = this.of(value[name]);
                    }
                    return new RecordType(argTypes);
                }
            } else {
                return nullType;
            }
        }
    }
});

exports.types = Type.types;

var ValueType = exports.ValueType = Type.specialize({
    constructor: {
        value: function ValueType(value) {
            this.super();
            this.value = value;
        }
    },
    describe: {
        value: function () {
            if (this.value == null) {
                return {type: this.type};
            } else {
                return {type: this.type, value: this.value};
            }
        }
    },
}, {
    fromDescription: {
        value: function (description) {
            return new this(description.value);
        }
    }
});

/*
 * The `NullType` (and its singleton, `nullType` have a dual purpose.  For one,
 * it is the concrete type for the values `null` and `undefined`.  However, it
 * also stands for the type of any expression that has an *unknown* type.  It
 * represents values that could be anything.  A type description is
 * restrictive; each criterion narrows the domain of values that satisfy the
 * type.  The null type has no restrictions and is conceptually the type
 * that captures values of all types.
 */
var NullType = exports.NullType = ValueType.specialize({
    type: {
        value: "null",
        enumerable: true
    },
    isNull: {
        value: true
    },
    isBooleAlike: {
        value: true
    },
    agreesWith: {
        value: function (that) {
            return true;
        }
    },
    constructor: {
        value: function NullType() {
            this.super();
        }
    }
});

var nullType = exports.nullType = NullType.instance = new NullType();

var BooleanType = exports.BooleanType = ValueType.specialize({
    type: {
        value: "boolean",
        enumerable: true
    },
    isBooleAlike: {
        value: true
    },
    isComparable: {
        value: true
    },
    agreesWith: {
        value: function (that) {
            return that.isBooleAlike;
        }
    },
    constructor: {
        value: function BooleanType(value) {
            this.super(value);
        }
    }
});

var booleanType = exports.booleanType = BooleanType.instance = new BooleanType();

var NumberType = exports.NumberType = ValueType.specialize({
    type: {
        value: "number",
        enumerable: true
    },
    isBooleAlike: {
        value: true
    },
    isComparable: {
        value: true
    },
    constructor: {
        value: function NumberType(value) {
            this.super(value);
        }
    }
});

var numberType = exports.numberType = NumberType.instance = new NumberType();

var StringType = exports.StringType = ValueType.specialize({
    type: {
        value: "string",
        enumerable: true
    },
    isString: {
        value: true
    },
    isBooleAlike: {
        value: true
    },
    isComparable: {
        value: true
    },
    inferenceMethods: {
        value: {
            toLowerCase: function (argTypes, scope) {
                if (argTypes.length) {
                    throw new TypeError(
                        "'toLowerCase' receives no arguments. " +
                        "Got: " + argTypes.length
                    );
                }
                return stringType;
            },
            toUpperCase: function (argTypes, scope) {
                if (argTypes.length) {
                    throw new TypeError(
                        "'toUpperCase' receives no arguments. " +
                        "Got: " + argTypes.length
                    );
                }
                return stringType;
            },
            startsWith: function (argTypes, scope) {
                if (argTypes.length !== 1) {
                    throw new TypeError(
                        "'startsWith' takes only one argument. Got: " +
                        argTypes.length
                    );
                }
                var otherType = this.infer(argTypes[0], scope);
                if (!stringType.agreesWith(otherType)) {
                    throw new Error(
                        "'startsWith' must have a string argument. " +
                        "Got: " + JSON.stringify(stringType.describe())
                    );
                }
                return booleanType;
            },
            endsWith: function (argTypes, scope) {
                if (argTypes.length !== 1) {
                    throw new TypeError(
                        "'endsWith' takes only one argument. Got: " +
                        argTypes.length
                    );
                }
                var otherType = this.infer(argTypes[0], scope);
                if (!stringType.agreesWith(otherType)) {
                    throw new Error(
                        "'endsWith' must have a string argument. " +
                        "Got: " + JSON.stringify(stringType.describe())
                    );
                }
                return booleanType;
            },
            contains: function (argTypes, scope) {
                if (argTypes.length !== 1) {
                    throw new TypeError(
                        "'contains' takes only one argument. Got: " +
                        argTypes.length
                    );
                }
                var otherType = this.infer(argTypes[0], scope);
                if (!stringType.agreesWith(otherType)) {
                    throw new Error(
                        "'contains' must have a string argument. " +
                        "Got: " + JSON.stringify(stringType.describe())
                    );
                }
                return booleanType;
            }
        }
    },
    constructor: {
        value: function StringType(value) {
            this.super(value);
        }
    }
});

var stringType = exports.stringType = StringType.instance = new StringType();

var DateType = exports.DateType = Type.specialize({
    type: {
        value: "date"
    },
    isComparable: {
        value: true
    }
    // TODO
});

var dateType = exports.dateType = DateType.instance = new DateType();

var UrlType = exports.UrlType = Type.specialize({
    // TODO consider specializing StringType
    type: {
        value: "url"
    },
    isComparable: {
        value: true
    }
    // TODO
});

var urlType = exports.urlType = UrlType.instance = new UrlType();

// TODO consider the case of a property-blueprint "object" type.
// TODO consider the case of a property-blueprint "enum" type.
// For the purposes of type-inference, enumerations would only agree with
// instances of the same enumeration type, and the backing of the enumeration,
// be it integer or string, would be irrelevant.

var TupleType = exports.TupleType = Type.specialize({
    type: {
        value: "tuple",
        enumerable: true
    },
    isTuple: {
        value: true
    },
    isArrayLike: {
        value: true
    },
    isComparable: {
        value: true
    },
    constructor: {
        value: function TupleType(argTypes) {
            this.argTypes = argTypes;
        }
    },
    describe: {
        value: function () {
            return {type: "tuple", argTypes: this.argTypes.map(function (argType) {
                return argType.describe();
            })};
        }
    },
    agreesWith: {
        value: function (that) {
            return (
                that.isNull ||
                that.isTuple &&
                this.argTypes.length <= that.argTypes.length &&
                this.argTypes.every(function (argType, index) {
                    return argType.agreesWith(that.argTypes[index]);
                }) ||
                that.isArray &&
                this.contentType.type !== "null" &&
                that.contentType.type !== "null" &&
                this.contentType.agreesWith(that.contentType)
            );
        }
    },
    getPropertyType: {
        value: function (name) {
            if (typeof name === "number" && name < this.argTypes.length) {
                return this.argTypes[name];
            } else if (name === "length") {
                return new NumberType(this.argTypes.length);
            } else {
                return nullType;
            }
        }
    },
    _contentType: {
        value: null
    },
    contentType: {
        get: function () {
            if (!this._contentType) {
                var contentType = nullType;
                this._contentType = this.argTypes.reduce(function (prevalent, argType) {
                    if (prevalent.isNull) {
                        return prevalent;
                    } else if (prevalent.agreesWith(argType)) {
                        return prevalent;
                    } else {
                        return nullType;
                    }
                });
            }
            return this._contentType;
        }
    }
}, {
    fromDescription: {
        value: function (description) {
            return new this(description.argTypes.map(
                Type.fromDescription,
                Type
            ));
        }
    }
});

var RecordType = exports.RecordType = Type.specialize({
    type: {
        value: "record",
        enumerable: true
    },
    constructor: {
        value: function RecordType(argTypes) {
            this.argTypes = argTypes;
        }
    },
    describe: {
        value: function () {
            var argTypes = {};
            for (var name in this.argTypes) {
                argTypes[name] = this.argTypes[name].describe();
            }
            return {type: "record", argTypes: argTypes};
        }
    },
    agreesWith: {
        value: function (that) {
            return (
                that.isNull ||
                Object.map(this.argTypes, function (argType, name) {
                    return argType.agreesWith(that.getPropertyType(name))
                }).every(Boolean)
            );
        }
    },
    getPropertyType: {
        value: function (name) {
            if (name in this.argTypes) {
                return this.argTypes[name];
            } else {
                return nullType;
            }
        }
    }
}, {
    fromDescription: {
        value: function (description) {
            var argTypes = {};
            for (var name in description.argTypes) {
                argTypes[name] = Type.fromDescription(description.argTypes[name]);
            }
            return new this(argTypes);
        }
    }
});

var ArrayType = exports.ArrayType = Type.specialize({
    type: {
        value: "array",
        enumerable: true
    },
    isArray: {
        value: true
    },
    isArrayLike: {
        value: true
    },
    isComparable: {
        value: true
    },
    constructor: {
        value: function ArrayType(contentType) {
            this.contentType = contentType;
        }
    },
    describe: {
        value: function () {
            return {
                type: "array",
                contentType: this.contentType.describe()
            };
        }
    },
    agreesWith: {
        value: function (that) {
            return (
                that.isNull ||
                that.isArrayLike &&
                this.contentType.type !== "null" &&
                that.contentType.type !== "null" &&
                this.contentType.agreesWith(that.contentType)
            );
        }
    },
    getPropertyType: {
        value: function (key) {
            if (typeof key === "number") {
                return this.contentType;
            } else if (key === "length") {
                return numberType;
            } else {
                return nullType;
            }
        }
    }
}, {
    fromDescription: {
        value: function (description) {
            return new this(Type.fromDescription(description.contentType));
        }
    }
});

var nullArrayType = exports.nullArrayType = new ArrayType(nullType);

var MapType = exports.MapType = Type.specialize({
    type: {
        value: "map"
    },
    isMapAlike: {
        value: true
    },
    constructor: {
        value: function (keyType, valueType) {
            this.keyType = keyType;
            this.valueType = valueType;
        }
    },
    describe: {
        value: function () {
            return {
                type: "map",
                keyType: this.keyType.describe(),
                valueType: this.valueType.describe()
            };
        }
    },
    agreesWith: {
        value: function (that) {
            return (
                that.isNull ||
                that.isMapAlike &&
                this.keyType.agreesWith(that.keyType) &&
                this.valueType.agreesWith(that.valueType)
            );
        }
    }
}, {
    fromDescription: {
        value: function (description) {
            return new this(
                Type.fromDescription(description.keyType),
                Type.fromDescription(description.valueType)
            );
        }
    }
});

var BlueprintType = exports.BlueprintType = Type.specialize({
    type: {
        value: "blueprint"
    },
    constructor: {
        value: function (blueprint) {
            this.blueprint = blueprint;
        }
    },
    isComparable: {
        get: function () {
            // TODO
        }
    },
    agreesWith: {
        value: function (that) {
            // TODO walk the prototype chain
            return (
                that.type === "blueprint" &&
                that.blueprint === this.blueprint
            );
        }
    },
    describe: {
        value: function () {
            return {
                type: "blueprint",
                name: this.blueprint.name
            };
        }
    },
    getPropertyType: {
        value: function (name) {
            var propertyBlueprint = this.blueprint.propertyBlueprintForName(name);
            if (!propertyBlueprint) {
                return nullType;
            }
            var contentType;
            if (propertyBlueprint.isAssociationBlueprint) {
                var blueprintPromise = propertyBlueprint.targetBlueprint;
                if (blueprintPromise.isFulfilled()) {
                    contentType = new BlueprintType(blueprint.inspect().value)
                } else {
                    contentType = new BlueprintPromiseType(blueprintPromise);
                }
            } else {
                contentType = Type.types[propertyBlueprint.valueType] || nullType;
            }
            if (propertyBlueprint.cardinality === 1) {
                return contentType;
            } else { // finite or infinite
                // TODO respect collectionType
                return new ArrayType(contentType);
            }
        }
    },
}, {
    fromDescription: {
        value: function (description) {
            throw new Error(
                "Blueprints do not provide enough information in " +
                "their description to be reconstituted."
            );
        }
    }
});

/**
 * For the purpose of synchronous type-inference, a promise for a blueprint is
 * not useful, so it masquerades as a NullType.  However, it has the additional
 * `then` method which will wait for the blueprint to become available, at
 * which point you can run the inference again and get a more useful result.
 * The inference engine tries when possible to propagate null types.
 */
var BlueprintPromiseType = exports.BlueprintPromiseType = Type.specialize({
    type: {
        value: "blueprint-promise"
    },
    isNull: {
        value: true
    },
    constructor: {
        value: function (blueprintPromise) {
            this.blueprintPromise = blueprintPromise;
        }
    }
}, {
    fromDescription: {
        value: function (description) {
            throw new Error(
                "Blueprint promises do not provide enough information in " +
                "their description to be reconstituted."
            );
        }
    }
});

var inferenceOperators = {

    // 10
    // {type: 'literal', value: 10} -> syntax
    // {type: 'number', value: 10} -> type
    literal: function (syntax, scope) {
        return Type.of(syntax.value);
    },

    // this
    // {type: "value"} -> syntax
    // scope.value -> type
    // scope: {value, parent, parameters, components, elements}
    value: function (syntax, scope) {
        return scope.value || nullType;
    },

    parameters: function (syntax, scope) {
        return scope.parameters || nullType;
    },

    element: function (syntax, scope) {
        if (!scope.document) {
            return nullType;
        }
        // TODO document and perhaps even implement such a document type
        // inspection primitive based perhaps on markup details.
        return scope.document.getElementTypeById(syntax.id);
    },

    component: function (syntax, scope) {
        if (!scope.components) {
            return nullType;
        }
        // TODO components.getBlueprintByLabel is fiction
        return scope.components.getBlueprintTypeByLabel(scope);
    },

    // [1, 2]
    // {type: "tuple", args: [
    //     {type: "literal", value: 1},
    //     {type: "literal", value: 2}
    // ]} -> syntax
    // {type: "tuple", argTypes: [
    //     {type: "number", value: 1},
    //     {type: "number", value: 2}
    // ]} -> type
    tuple: function (syntax, scope) {
        return new TupleType(syntax.args.map(function (arg) {
            return this.infer(arg, scope);
        }, this));
    },

    record: function (syntax, scope) {
        var argTypes = {};
        for (var name in syntax.args) {
            argTypes[name] = this.infer(syntax.args[name], scope);
        }
        return new RecordType(argTypes);
    },

    // foo
    // this['foo']
    // {type: "property", args: [
    //     {type: "value"},
    //     {type: "literal", value: "foo"}
    // ]}
    property: function (syntax, scope) {
        if (!syntax.args.length === 2) {
            throw new Error("Property expression must have two arguments");
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (right.value === void 0) {
            return nullType;
        } else {
            return left.getPropertyType(right.value);
        }
    },

    get: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error("'get' expression must have two arguments");
        }
        var mapType = this.infer(syntax.args[0], scope);
        if (mapType.isNull) {
            return mapType;
        }
        if (!mapType.isMapAlike) {
            throw new Error(
                "'get' expression must have a map for its first " +
                "argument. Got: " + JSON.stringify(left)
            );
        }
        var keyType = this.infer(syntax.args[1], scope);
        if (!keyType.agreesWith(mapType.keyType)) {
            throw new TypeError(
                "The key of a 'get' expression must agree with the " +
                "type of the map"
            );
        }
        return mapType.valueType;
    },

    rangeContent: function (syntax, scope) {
        if (syntax.args.length !== 1) {
            throw new Error("'rangeContent' must have exactly 1 argument'");
        }
        var collectionType = this.infer(syntax.args[0], scope);
        if (collectionType.isNull) {
            return nullArrayType;
        }
        if (!collectionType.isArrayLike) {
            throw new TypeError(
                "'rangeContent' must have a ranged collection as its " +
                "first argument. Got: " + JSON.stringify(collectionType)
            );
        }
        return collectionType;
    },

    mapContent: function (syntax, scope) {
        if (syntax.args.length !== 1) {
            throw new Error("'mapContent' must have exactly 1 argument'");
        }
        var mapType = this.infer(syntax.args[0], scope);
        if (mapType.isNull) {
            return new MapType(nullType, nullType);
        }
        if (!mapType.isMapAlike) {
            throw new Error(
                "'mapContent' expression must have a map for its first " +
                "argument. Got: " + JSON.stringify(left)
            );
        }
        return mapType;
    },

    view: function (syntax, scope) {
        if (syntax.args.length !== 3) {
            throw new Error("'view' must have exactly 3 arguments");
        }
        var collectionType = this.infer(syntax.args[0], scope);
        var startType = this.infer(syntax.args[1], scope);
        var lengthType = this.infer(syntax.args[2], scope);
        if (collectionType.isNull) {
            collectionType = nullArrayType;
        } else if (!collectionType.isArrayLike) {
            throw new Error(
                "'view' expression must have an array-like for its " +
                "first arguments. Got: " + JSON.stringify(collecitonType)
            );
        }
        if (!numberType.agreesWith(startType)) {
            throw new TypeError(
                "'view' expression must have a number for its " +
                "'start' argument (2). Got: " + JSON.stringify(startType)
            );
        }
        if (!numberType.agreesWith(lengthType)) {
            throw new TypeError(
                "'view' expression must have a number for its " +
                "'length' argument (2). Got: " + JSON.stringify(lengthType)
            );
        }
        return collectionType;
    },

    mapBlock: function (syntax, scope) {
        var sourceType = this.infer(syntax.args[0], scope);
        if (sourceType.isNull) {
            return nullArrayType;
        }
        if (!sourceType.isArrayLike) {
            throw new TypeError(
                "'map' block requires an array-like input collection.  " +
                "Got: " + sourceType.type
            );
        }
        return new ArrayType(this.infer(
            syntax.args[1],
            Scope.nest(scope, sourceType.contentType)
        ));
    },

    filterBlock: function (syntax, scope) {
        var sourceType = this.infer(syntax.args[0], scope);
        if (sourceType.isNull) {
            return nullArrayType;
        }
        if (!sourceType.isArrayLike) {
            throw new TypeError(
                "The source of a filter block must be array-like. Got: " +
                JSON.stringify(sourceType.describe())
            );
        }
        var blockType = this.infer(
            syntax.args[1],
            Scope.nest(scope, sourceType.contentType)
        );
        if (!booleanType.agreesWith(blockType)) {
            throw new TypeError();
        }
        return new ArrayType(sourceType.contentType);
    },

    someBlock: function (syntax, scope) {
        var sourceType = this.infer(syntax.args[0], scope);
        if (sourceType.isNull) {
            return booleanType;
        }
        if (!sourceType.isArrayLike) {
            throw new TypeError(
                "The source of a some block must be array-like. Got: " +
                JSON.stringify(sourceType.describe())
            );
        }
        var blockType = this.infer(
            syntax.args[1],
            Scope.nest(scope, sourceType.contentType)
        );
        if (!booleanType.agreesWith(blockType)) {
            throw new TypeError(
                "A some block must be coercible to boolean. Got: " +
                JSON.stringify(blockType.describe())
            );
        }
        return booleanType;
    },

    everyBlock: function (syntax, scope) {
        var sourceType = this.infer(syntax.args[0], scope);
        if (sourceType.isNull) {
            return booleanType;
        }
        if (!sourceType.isArrayLike) {
            throw new TypeError(
                "The source of an every block must be array-like. Got: " +
                JSON.stringify(sourceType.describe())
            );
        }
        var blockType = this.infer(
            syntax.args[1],
            Scope.nest(scope, sourceType.contentType)
        );
        if (!booleanType.agreesWith(blockType)) {
            throw new TypeError(
                "An every block must be coercible to boolean. Got: " +
                JSON.stringify(blockType.describe())
            );
        }
        return booleanType;
    },

    sortedBlock: function (syntax, scope) {
        var sourceType = this.infer(syntax.args[0], scope);
        if (sourceType.isNull) {
            return nullArrayType;
        }
        if (!sourceType.isArrayLike) {
            throw new TypeError(
                "The source of a sorted block must be array-like. Got: " +
                JSON.stringify(sourceType.describe())
            );
        }
        var blockType = this.infer(
            syntax.args[1],
            Scope.nest(scope, sourceType.contentType)
        );
        if (!blockType.isNull && !blockType.isComparable) {
            throw new Error(
                "A sorted block must produce comparable values. Got: " +
                JSON.stringify(blockType.describe())
            );
        }
        return sourceType;
    },

    groupBlock: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "A 'group' block must have exactly two arguments. Got: " +
                stringify(syntax)
            );
        }
        var sourceType = this.infer(syntax.args[0], scope);
        if (sourceType.isNull) {
            return new ArrayType(new TupleType([
                numberType,
                sourceType
            ]));
        }
        if (!sourceType.isArrayLike) {
            throw new TypeError(
                "A 'group' block must receive an array-like. Got: " +
                JSON.stringify(sourceType.describe())
            );
        }
        return new ArrayType(new TupleType([
            sourceType.contentType,
            sourceType
        ]));
    },

    groupMapBlock: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "A 'groupMap' block must have exactly two arguments. Got: " +
                stringify(syntax)
            );
        }
        var sourceType = this.infer(syntax.args[0], scope);
        if (sourceType.isNull) {
            return new MapType(nullType, sourceType);
        }
        if (!sourceType.isArrayLike) {
            throw new TypeError(
                "groupMap block must receive an array-like. Got: " +
                JSON.stringify(sourceType.describe())
            );
        }
        return new MapType(sourceType.contentType, sourceType);
    },

    minBlock: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "A 'min' block must have exactly two arguments. Got: " +
                stringify(syntax)
            );
        }
        var sourceType = this.infer(syntax.args[0], scope);
        if (sourceType.isNull) {
            return nullType;
        }
        if (!sourceType.isArrayLike && !sourceType.isHeap) {
            throw new TypeError(
                "A 'min' block must receive an array-like or heap " +
                "argument. Got: " +
                JSON.stringify(sourceType.describe())
            );
        }
        var blockType = this.infer(
            syntax.args[1],
            Scope.nest(scope, sourceType.contentType)
        );
        if (!blockType.isComparable) {
            throw new TypeError(
                "A 'min' block must operate on comparable content. Got: " +
                JSON.stringify(blockType.describe())
            );
        }
        return sourceType.contentType;
    },

    maxBlock: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "A 'max' block must have exactly two arguments. Got: " +
                stringify(syntax)
            );
        }
        var sourceType = this.infer(syntax.args[0], scope);
        if (sourceType.isNull) {
            return nullType;
        }
        if (!sourceType.isArrayLike) {
            throw new TypeError(
                "A 'max' block must receive an array-like argument. Got: " +
                JSON.stringify(sourceType.describe())
            );
        }
        var blockType = this.infer(syntax.args[1], Scope.nest(scope, sourceType.contentType));
        if (!blockType.isComparable) {
            throw new TypeError(
                "A 'max' block must operate on comparable content. Got: " +
                JSON.stringify(blockType.describe())
            );
        }
        return sourceType.contentType;
    },

    parent: function (syntax, scope) {
        return this.infer(
            syntax.args[0],
            scope.parent || new Scope({type: "null"})
        );
    },

    "with": function (syntax, scope) {
        return this.infer(
            syntax.args[1],
            Scope.nest(scope, this.infer(syntax.args[0], scope))
        );
    },

    "if": function (syntax, scope) {
        var condition = this.infer(syntax.args[0], scope);
        if (!booleanType.agreesWith(condition)) {
            throw new TypeError(
                "The type of the condition of an 'if' (?:) expression " +
                "must be boolean, or coercible to boolean. Got: " +
                JSON.stringify(condition)
            );
        }
        var consequent = this.infer(syntax.args[1], scope);
        var alternate = this.infer(syntax.args[2], scope);
        if (!consequent.agreesWith(alternate)) {
            throw new TypeError(
                "Can't infer type of 'if' (?:) block where consequent " +
                "and alternate expressions do not agree: " +
                JSON.stringify(consequent.type) + " " +
                JSON.stringify(alternate.type)
            );
        }
        return consequent;
    },

    not: function (syntax, scope) {
        if (syntax.args.length !== 1) {
            throw new Error(
                "A 'not' (!) expression must receive exactly one argument"
            );
        }
        var argType = this.infer(syntax.args[0], scope);
        if (!argType.isBooleAlike) {
            throw new TypeError(
                "A 'not' (!) argument must be coercible to boolean. " +
                "Got: " + JSON.stringify(argType.describe())
            );
        }
        return booleanType;
    },

    and: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "An 'and' (&&) expression must have two arguments"
            );
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (!booleanType.agreesWith(left)) {
            throw new TypeError(
                "Left argument of 'and' (&&) expression " +
                "must be coercible to boolean. Got: " +
                JSON.stringify(left.describe())
            );
        }
        if (!booleanType.agreesWith(right)) {
            throw new TypeError(
                "Right argument of 'and' (&&) expression " +
                "must be coercible to boolean. Got: " +
                JSON.stringify(right.describe())
            );
        }
        return booleanType;
    },

    or: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "An 'or' (||) expression must have two arguments"
            );
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (!booleanType.agreesWith(left)) {
            throw new TypeError(
                "Left argument of 'or' (||) expression " +
                "must be coercible to boolean. Got: " +
                JSON.stringify(left.describe())
            );
        }
        if (!booleanType.agreesWith(right)) {
            throw new TypeError(
                "Right argument of 'or' (||) expression " +
                "must be coercible to boolean. Got: " +
                JSON.stringify(right.describe())
            );
        }
        return booleanType;
    },

    "default": function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "A 'default' (??) expression must have two arguments"
            );
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (!left.agreesWith(right)) {
            throw new Error(
                "The types of the left and right arguments of a " +
                "'default' (??) expression must agree. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        return left;
    },

    defined: function () {
        return booleanType;
    },

    path: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "A 'path' expression must have two arguments. Got: " +
                syntax.args.length
            );
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (!right.isString || right.value == null) {
            return nullType;
        }
        return this.infer(right.value, Scope.nest(left));
    },

    toNumber: function (syntax, scope) {
        if (syntax.args.length !== 1) {
            throw new Error(
                "'toNumber' must have exactly one argument. Got: " +
                syntax.args.length
            );
        }
        var arg = this.infer(syntax.args[0], scope);
        if (!(arg instanceof ValueType)) {
            throw new TypeError(
                "For a toNumber expression, the argument must be a scalar value. Got: " +
                JSON.stringify(arg.describe())
            );
        }
        return numberType;
    },

    toString: function (syntax, scope) {
        if (syntax.args.length !== 1) {
            throw new Error(
                "'toString' must have exactly one argument. Got: " +
                syntax.args.length
            );
        }
        var argType = this.infer(syntax.args[0], scope);
        if (argType.type === "string") {
            return argType;
        }
        if (!(argType instanceof ValueType)) {
            throw new TypeError(
                "For a toString expression, the argument must be a scalar value. Got: " +
                JSON.stringify(argType.describe())
            );
        }
        return stringType;
    },

    neg: function (syntax, scope) {
        if (syntax.args.length !== 1) {
            throw new Error(
                "A negation expression must have exactly one argument. Got: " +
                syntax.args.length
            );
        }
        var arg = this.infer(syntax.args[0], scope);
        if (!numberType.agreesWith(arg)) {
            throw new TypeError(
                "For a negation expression, the argument must be a number . Got: " +
                JSON.stringify(arg.describe())
            );
        }
        return numberType;
    },

    pow: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "A power expression must have two arguments. Got: " +
                syntax.args.length
            );
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (!left.agreesWith(right) || !numberType.agreesWith(left)) {
            throw new TypeError(
                "For a power expression both arguments must be numbers. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        return numberType;
    },

    log: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "A logarithim expression must have two arguments. Got: " +
                syntax.args.length
            );
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (!left.agreesWith(right) || !numberType.agreesWith(left)) {
            throw new TypeError(
                "For a logarithm, both arguments must be numbers. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        return numberType;
    },

    root: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "A 'root' (//) expression must have two arguments. Got: " +
                syntax.args.length
            );
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (!left.agreesWith(right) || !numberType.agreesWith(left)) {
            throw new TypeError(
                "For 'root' (//), both arguments must be numbers. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        return numberType;
    },

    mul: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "A 'mul' (*) expression must have two arguments. Got: " +
                syntax.args.length
            );
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (!left.agreesWith(right) || !numberType.agreesWith(left)) {
            throw new TypeError(
                "For multiplication, both arguments must be numbers. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        return numberType;
    },

    div: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "A 'div' (/) expression must have two arguments. Got: " +
                syntax.args.length
            );
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (!left.agreesWith(right) || !numberType.agreesWith(left)) {
            throw new TypeError(
                "For division, both arguments must be numbers. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        return numberType;
    },

    mod: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "A 'mod' (%) expression must have two arguments. Got: " +
                syntax.args.length
            );
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (!left.agreesWith(right) || !numberType.agreesWith(left)) {
            throw new TypeError(
                "For modulo, both arguments must be numbers. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        return numberType;
    },

    rem: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "A 'rem' expression must have two arguments. Got: " +
                syntax.args.length
            );
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (!left.agreesWith(right) || !numberType.agreesWith(left)) {
            throw new TypeError(
                "For remainder, both arguments must be numbers. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        return numberType;
    },

    add: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "An 'add' (+) expression must have two arguments. Got: " +
                syntax.args.length
            );
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (!left.agreesWith(right)) {
            throw new TypeError(
                "In addition, both arguments must agree. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        if (left.type !== "string" && left.type !== "number") {
            throw new TypeError(
                "Addition only operates on strings and numbers. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        return numberType;
    },

    sub: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "A 'sub' (-) expression must have two arguments. Got: " +
                syntax.args.length
            );
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (!left.agreesWith(right) || !numberType.agreesWith(left)) {
            throw new TypeError(
                "For subtraction, both arguments must be numbers. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        return numberType;
    },

    lt: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "A 'lt' (<) expression must have two arguments. Got: " +
                syntax.args.length
            );
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (!left.agreesWith(right)) {
            throw new TypeError(
                "For 'lt' (<) arguments must agree. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        if (!left.isComparable) {
            throw new TypeError(
                "For 'lt' (<) arguments must be comparable. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        return booleanType;
    },

    gt: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "A 'gt' (>) expression must have two arguments. Got: " +
                syntax.args.length
            );
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (!left.agreesWith(right)) {
            throw new TypeError(
                "For 'gt' (>) arguments must agree. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        if (!left.isComparable) {
            throw new TypeError(
                "For 'gt' (>) arguments must be comparable. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        return booleanType;
    },

    le: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "A 'le' (<=) expression must have two arguments. Got: " +
                syntax.args.length
            );
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (!left.agreesWith(right)) {
            throw new TypeError(
                "For 'le' (<=) arguments must agree. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        if (!left.isComparable) {
            throw new TypeError(
                "For 'le' (<=) arguments must be comparable. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        return booleanType;
    },

    ge: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "A 'ge' (>=) expression must have two arguments. Got: " +
                syntax.args.length
            );
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (!left.agreesWith(right)) {
            throw new TypeError(
                "For 'ge' (>=) arguments must agree. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        if (!left.isComparable) {
            throw new TypeError(
                "For 'ge' (>=) arguments must be comparable. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        return booleanType;
    },

    equals: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "An 'equals' (==) expression must have two arguments. Got: " +
                syntax.args.length
            );
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (!left.agreesWith(right)) {
            throw new TypeError(
                "For 'equals' (==) arguments must agree. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        if (!left.isComparable) {
            throw new TypeError(
                "For 'equals' (==) arguments must be comparable. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        return booleanType;
    },

    compare: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "A 'compare' expression must have two arguments. Got: " +
                syntax.args.length
            );
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (!left.agreesWith(right)) {
            throw new TypeError(
                "For 'compare' arguments must agree. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        if (!left.isComparable) {
            throw new TypeError(
                "For 'compare' arguments must be comparable. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        return numberType;
    },

    join: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "A 'join' expression must have two arguments. Got: " +
                syntax.args.length
            );
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (!left.isArrayLike) {
            throw new Error(
                "For a 'join' expression, the first argument must be array-like. Got: " +
                JSON.stringify(left.describe())
            );
        }
        if (!stringType.agreesWith(left.contentType)) {
            throw new Error(
                "For a 'join' expression, the first argument must contain strings. Got: " +
                JSON.stringify(left.contentType.describe())
            );
        }
        if (!stringType.agreesWith(right)) {
            throw new TypeError(
                "For a 'join' expression, the second argument must be a string. Got: " +
                JSON.stringify(right.describe())
            );
        }
        return stringType;
    },

    split: function (syntax, scope) {
        if (syntax.args.length !== 2) {
            throw new Error(
                "A 'join' expression must have two arguments. Got: " +
                syntax.args.length
            );
        }
        var left = this.infer(syntax.args[0], scope);
        var right = this.infer(syntax.args[1], scope);
        if (!stringType.agreesWith(left) || !stringType.agreesWith(right)) {
            throw new Error(
                "For a 'split' expression, both arguments must be strings. Got: " +
                JSON.stringify(left.describe()) + " and " +
                JSON.stringify(right.describe())
            );
        }
        return new ArrayType(stringType);
    },

    range: function (syntax, scope) {
        if (syntax.args.length !== 1) {
            throw new Error(
                "A 'range' expression must have exactly one argument. Got: " +
                syntax.args.length
            );
        }
        var arg = this.infer(syntax.args[0], scope);
        if (!numberType.agreesWith(arg)) {
            throw new TypeError(
                "A 'range' expression must have a number for its argument. Got: " +
                JSON.stringify(arg.describe())
            );
        }
        return new ArrayType(numberType);
    }

};

var Engine = exports.Engine = Montage.specialize({

    constructor: {
        value: function InferrenceEngine() {
            this.super();
        }
    },

    infer: {
        value: function (syntax, scope) {
            if (typeof syntax === "string") {
                syntax = parse(syntax);
            }
            if (syntax.type in this.inferenceOperators) {
                return this.inferenceOperators[syntax.type].call(
                    this,
                    syntax,
                    scope
                );
            }
            if (syntax.args.length > 0) {
                var contextType = this.infer(syntax.args[0], scope);
                var restArgs = syntax.args.slice(1);
                if (contextType.hasMethod(syntax.type)) {
                    return contextType.inferMethodResultType(
                        syntax.type,
                        restArgs,
                        scope,
                        this
                    );
                }
            }
            throw new Error("Can't infer type from " + stringify(syntax));
        }
    },

    inferenceOperators: {
        value: inferenceOperators
    }

});

var engine = new Engine();
exports.engine = engine;

exports.infer = function (syntax, scope) {
    return engine.infer(syntax, scope);
};

