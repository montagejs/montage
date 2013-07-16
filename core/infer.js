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
// that operator AND the project the type of the result.  This can be done
// already with what I have.
// In summary, we could use a registry of operators with accepted argument
// patterns.

// TODO Type.propertyNames, Type.operatorNames

// TODO review error messages for consistency

// TODO review usage of sourceType === nullType for consistency

// TODO consolidate implementations of sufficiently similar inferrence methods
// with higher order functions

// TODO verify existence of argument length checks
// TODO make argument length checks consistently display FRB stringify of given
// syntax

// TODO questions
// 1.   Pierre, if we have a fulfilled promise for a blueprint, it seems that I
// can assume that the transitively reachable blueprints over
// propertyBlueprintForName will all be available synchronously.  Is that the
// case?
// 2.   Afonso, I need a type that encapsulates all the blueprints for a
// serialization so I can look them up by label.  If something already exists,
// let me know.  I presume we have a way of getting the prototypes for each
// object by label, and it would only be a small jump to grab blueprint
// promises for every component and wait for them all.  For "values" by label,
// we might be able to extend Type.of(value) to resolve component references to
// blueprints.

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
                    return new BlueprintType(value.constructor.blueprint);
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

var ValueType = Type.specialize({
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

var NullType = ValueType.specialize({
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

var nullType = NullType.instance = new NullType();

var BooleanType = ValueType.specialize({
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
        value: function NumberType(value) {
            this.super(value);
        }
    }
});

var booleanType = BooleanType.instance = new BooleanType();

var NumberType = ValueType.specialize({
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

var numberType = NumberType.instance = new NumberType();

var StringType = ValueType.specialize({
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
                    throw new TypeError("'toLowerCase' receives no arguments");
                }
                return stringType;
            },
            toUpperCase: function (argTypes, scope) {
                if (argTypes.length) {
                    throw new TypeError("'toUpperCase' receives no arguments");
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
                    throw new Error("'startsWith' must have a string argument");
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
                    throw new Error("'endsWith' must have a string argument");
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
                    throw new Error("'contains' must have a string argument");
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

var stringType = StringType.instance = new StringType();

var DateType = Type.specialize({
    type: {
        value: "date"
    },
    isComparable: {
        value: true
    }
    // TODO
});

var dateType = DateType.instance = new DateType();

var UrlType = Type.specialize({
    // TODO consider specializing StringType
    type: {
        value: "url"
    },
    isComparable: {
        value: true
    }
    // TODO
});

var urlType = UrlType.instance = new UrlType();

// TODO consider the case of a property-blueprint "object" type.
// TODO consider the case of a property-blueprint "enum" type.
// For the purposes of type-inferrence, enumerations would only agree with
// instances of the same enumeration type, and the backing of the enumeration,
// be it integer or string, would be irrelevant.

var TupleType = Type.specialize({
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
                that.argTypes.length === this.argTypes.length &&
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

var RecordType = Type.specialize({
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

var ArrayType = Type.specialize({
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

var nullArrayType = new ArrayType(nullType);

var MapType = Type.specialize({
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

var BlueprintType = Type.specialize({
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
            return (
                that.type === "blueprint" &&
                that.blueprint === this.blueprint
            );
        }
    },
    describe: {
        value: function () {
            // TODO
        }
    },
    /**
     * A blueprint
     */
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
                return new ArrayType(contentType);
            }
        }
    },
}, {
    fromDescription: {
        value: function (description) {
            // TODO
        }
    }
});

/**
 * For the purpose of synchronous type-inferrence, a promise for a blueprint is
 * not useful, so it masquerades as a NullType.  However, it has the additional
 * `then` method which will wait for the blueprint to become available, at
 * which point you can run the inferrence again and get a more useful result.
 * The inferrence engine tries when possible to propagate null types.
 */
var BlueprintPromiseType = Type.specialize({
    type: {
        value: "blueprint-promise"
    },
    isNull: {
        value: true
    }
}, {
    fromDescription: {
        value: function (description) {
            // TODO
        }
    }
});

var inferrenceOperators = {

    literal: function (syntax, scope) {
        return Type.of(syntax.value);
    },

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

    if: function (syntax, scope) {
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
            if (syntax.type in this.inferrenceOperators) {
                return this.inferrenceOperators[syntax.type].call(
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

    inferrenceOperators: {
        value: inferrenceOperators
    }

});

var engine = new Engine();
exports.engine = engine;

exports.infer = function (syntax, scope) {
    return engine.infer(syntax, scope);
};

