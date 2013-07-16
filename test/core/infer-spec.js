
var Scope = require("montage/frb/scope");
var Infer = require("montage/core/infer");
var infer = Infer.infer;
var engine = Infer.engine;
var Type = Infer.Type;
var types = Infer.types;

var specs = [

    // literals
    {
        path: "null",
        type: {type: "null"}
    },
    {
        path: "true",
        type: {type: "boolean", value: true}
    },
    {
        path: "false",
        type: {type: "boolean", value: false}
    },
    {
        path: "10",
        type: {type: "number", value: 10}
    },
    {
        path: "'a'",
        type: {type: "string", value: "a"}
    },
    {
        path: "[1, 2, 3]",
        type: {type: "tuple", argTypes: [
            {type: "number", value: 1},
            {type: "number", value: 2},
            {type: "number", value: 3}
        ]}
    },
    {
        path: "{a: 10, b: '20'}",
        type: {type: "record", argTypes: {
            a: {type: "number", value: 10},
            b: {type: "string", value: "20"}
        }}
    },

    // values
    {
        path: "",
        type: {type: "number"},
        value: {type: "number"}
    },
    {
        path: "this",
        type: {type: "number"},
        value: {type: "number"}
    },

    // parameters
    {
        path: "$",
        type: {type: "number"},
        parameters: {type: "number"}
    },
    {
        path: "$a",
        type: {type: "null"},
        parameters: {type: "number"}
    },
    {
        path: "$a",
        type: {type: "string"},
        parameters: {type: "record", argTypes: {
            a: {type: "string"}
        }}
    },

    // element
    {
        path: "#button",
        type: {type: "null"}
    },

    // component
    {
        path: "@button",
        type: {type: "null"}
    },
    // TODO component with serialization / component sheet provided

    // tuple
    {
        path: "[a, b]",
        type: {type: "tuple", argTypes: [
            {type: "number"},
            {type: "number"}
        ]},
        value: {type: "record", argTypes: {
            a: {type: "number"},
            b: {type: "number"}
        }}
    },

    // record
    {
        path: "{a: .0, b: .1}",
        type: {type: "record", argTypes: {
            a: {type: "string"},
            b: {type: "string"}
        }},
        value: {type: "array", contentType: {type: "string"}}
    },

    // property
    {
        path: "a",
        type: {type: "string"},
        value: {type: "record", argTypes: {
            a: {type: "string"}
        }}
    },
    {
        path: "b",
        type: {type: "null"},
        value: {type: "record", argTypes: {}}
    },
    {
        path: "length",
        type: {type: "number"},
        value: {type: "array", contentType: {type: "null"}}
    },
    {
        path: ".0",
        type: {type: "string"},
        value: {type: "array", contentType: {type: "string"}}
    },
    {
        path: "length",
        type: {type: "number", value: 2},
        value: {type: "tuple", argTypes: [
            {type: "string"},
            {type: "number"}
        ]}
    },
    {
        path: ".0",
        type: {type: "string"},
        value: {type: "tuple", argTypes: [
            {type: "string"},
            {type: "number"}
        ]}
    },
    {
        path: ".1",
        type: {type: "number"},
        value: {type: "tuple", argTypes: [
            {type: "string"},
            {type: "number"}
        ]}
    },
    {
        path: ".2",
        type: {type: "null"},
        value: {type: "tuple", argTypes: [
            {type: "string"},
            {type: "number"}
        ]}
    },

    // get
    {
        path: "get('a')",
        type: {type: "number"},
        value: {type: "map",
            keyType: {type: "string"},
            valueType: {type: "number"}
        }
    },
    {
        path: "get('a')",
        type: {type: "null"},
        value: {type: "null"}
    },
    {
        path: "get('a')",
        value: {type: "string"},
        error: true // because the value is not a map
    },
    {
        path: "get('a')",
        value: {type: "map",
            keyType: {type: "number"},
            valueType: {type: "number"}
        },
        error: true // because key type does not match
    },

    // rangeContent
    {
        path: "rangeContent()",
        type: {type: "array", contentType: {type: "number"}},
        value: {type: "array", contentType: {type: "number"}}
    },
    {
        path: "rangeContent()",
        type: {type: "array", contentType: {type: "null"}},
        value: {type: "null"}
    },
    {
        path: "rangeContent()",
        value: {type: "string"},
        error: true
    },

    // mapContent
    {
        path: "mapContent()",
        type: {type: "map", keyType: {type: "number"}, valueType: {type: "string"}},
        value: {type: "map", keyType: {type: "number"}, valueType: {type: "string"}}
    },
    {
        path: "mapContent()",
        type: {type: "map", keyType: {type: "null"}, valueType: {type: "null"}},
        value: {type: "null"}
    },
    {
        path: "mapContent()",
        value: {type: "string"},
        error: true
    },

    // view
    {
        path: "collection.view(start, length)",
        type: {type: "array", contentType: {type: "string"}},
        value: {type: "record", argTypes: {
            collection: {type: "array", contentType: {type: "string"}},
            start: {type: "number"},
            length: {type: "number"}
        }}
    },
    {
        path: "collection.view(start, length)",
        type: {type: "array", contentType: {type: "null"}},
        value: {type: "record", argTypes: {
            collection: {type: "null"},
            start: {type: "number"},
            length: {type: "number"}
        }}
    },
    {
        path: "collection.view(start, length)",
        value: {type: "record", argTypes: {
            collection: {type: "null"},
            start: {type: "string"},
            length: {type: "number"}
        }},
        error: true // because start is not a number
    },
    {
        path: "collection.view(start, length)",
        value: {type: "record", argTypes: {
            collection: {type: "null"},
            start: {type: "number"},
            length: {type: "string"}
        }},
        error: true // because length is not a number
    },

    // mapBlock
    {
        path: "map{a}",
        type: {type: "array", contentType: {type: "number"}},
        value: {type: "array", contentType: {type: "record", argTypes: {
            a: {type: "number"}
        }}}
    },
    {
        path: "map{this+2}",
        type: {type: "array", contentType: {type: "number"}},
        value: {type: "tuple", argTypes: [
            {type: "number"},
            {type: "number"}
        ]}
    },
    {
        path: "map{}",
        type: {type: "array", contentType: {type: "null"}}, // because the tuple is irregular
        value: {type: "tuple", argTypes: [
            {type: "number"},
            {type: "string"}
        ]}
    },
    {
        path: "map{}",
        type: {type: "array", contentType: {type: "null"}},
        value: {type: "null"}
    },
    {
        path: "map{}",
        value: {type: "string"},
        error: true // because the input is not array-like
    },

    // filterBlock
    {
        path: "filter{include}",
        type: {type: "array", contentType: {type: "record", argTypes: {
            include: {type: "boolean"}
        }}},
        value: {type: "array", contentType: {type: "record", argTypes: {
            include: {type: "boolean"}
        }}}
    },
    {
        path: "filter{n % 2}",
        type: {type: "array", contentType: {type: "record", argTypes: {
            n: {type: "number"}
        }}},
        value: {type: "array", contentType: {type: "record", argTypes: {
            n: {type: "number"}
        }}}
    },
    {
        path: "filter{}",
        type: {type: "array", contentType: {type: "boolean"}},
        value: {type: "tuple", argTypes: [
            {type: "boolean"},
            {type: "boolean"},
            {type: "boolean"}
        ]}
    },
    {
        path: "filter{n % 2}",
        type: {type: "array", contentType: {type: "null"}},
        value: {type: "null"}
    },

    // some
    {
        path: "some{this > 2}",
        value: {type: "array", contentType: {type: "number"}},
        type: {type: "boolean"}
    },
    {
        path: "some{this > 2}",
        value: {type: "null"},
        type: {type: "boolean"}
    },
    {
        path: "some{this > 2}",
        value: {type: "string"},
        error: true // because string is not a valid source
    },
    {
        path: "some{}",
        value: {type: "array", contentType: {type: "record", argTypes: {
            a: {type: "number"}
        }}},
        error: true // because records are not valid predicates
    },

    // every
    {
        path: "every{this > 2}",
        type: {type: "boolean"},
        value: {type: "array", contentType: {type: "number"}}
    },
    {
        path: "every{this > 2}",
        type: {type: "boolean"},
        value: {type: "null"}
    },
    {
        path: "every{this > 2}",
        value: {type: "string"},
        error: true // because string is not a valid source
    },
    {
        path: "every{}",
        value: {type: "array", contentType: {type: "record", argTypes: {
            a: {type: "number"}
        }}},
        error: true // because records are not valid predicates
    },

    // sorted
    {
        path: "sorted{}",
        type: {type: "array", contentType: {type: "number"}},
        value: {type: "array", contentType: {type: "number"}}
    },
    {
        path: "sorted{}",
        type: {type: "array", contentType: {type: "null"}},
        value: {type: "null"}
    },
    {
        path: "sorted{}",
        value: {type: "number"},
        error: true // because source is not array-like
    },
    {
        path: "sorted{a}",
        value: {type: "array", contentType: {type: "record", argTypes: {
            a: {type: "number"}
        }}},
        type: {type: "array", contentType: {type: "record", argTypes: {
            a: {type: "number"}
        }}}
    },
    {
        path: "sorted{b}",
        value: {type: "array", contentType: {type: "record", argTypes: {
            a: {type: "number"}
        }}},
        type: {type: "array", contentType: {type: "record", argTypes: {
            a: {type: "number"}
        }}}
    },
    {
        path: "sorted{}",
        value: {type: "array", contentType: {type: "record", argTypes: {
            a: {type: "number"}
        }}},
        error: true // because records are not comparable
    },

    // group
    {
        path: "group{this % 2 == 0}",
        value: {type: "array", contentType: {type: "number"}},
        type: {type: "array", contentType: {type: "tuple", argTypes: [
            {type: "number"},
            {type: "array", contentType: {type: "number"}}
        ]}}
    },
    {
        path: "group{}",
        value: {type: "null"},
        type: {type: "array", contentType: {type: "tuple", argTypes: [
            {type: "number"},
            {type: "null"}
        ]}}
    },
    {
        path: "group{}",
        value: {type: "number"},
        error: true
    },

    // groupMap
    {
        path: "groupMap{this % 2 == 0}",
        value: {type: "array", contentType: {type: "number"}},
        type: {
            type: "map",
            keyType: {type: "number"},
            valueType: {type: "array", contentType: {
                type: "number"
            }}
        }
    },
    {
        path: "groupMap{}",
        value: {type: "null"},
        type: {
            type: "map",
            keyType: {type: "null"},
            valueType: {type: "null"}
        }
    },
    {
        path: "groupMap{}",
        value: {type: "number"},
        error: true
    },

    // min
    {
        path: "min{}",
        value: {type: "array", contentType: {type: "number"}},
        type: {type: "number"}
    },
    {
        path: "min{size}",
        value: {type: "array", contentType: {type: "record", argTypes: {
            size: {type: "number"}
        }}},
        type: {type: "record", argTypes: {
            size: {type: "number"}
        }}
    },
    {
        path: "min{length}",
        value: {type: "array", contentType: {type: "array", contentType: {type: "string"}}},
        type: {type: "array", contentType: {type: "string"}}
    },
    {
        path: "min{width}",
        value: {type: "array", contentType: {type: "array", contentType: {type: "string"}}},
        error: true // because null property is incomparable
    },
    {
        path: "min{}",
        value: {type: "null"},
        type: {type: "null"}
    },

    // max
    {
        path: "max{}",
        value: {type: "array", contentType: {type: "number"}},
        type: {type: "number"}
    },
    {
        path: "max{size}",
        value: {type: "array", contentType: {type: "record", argTypes: {
            size: {type: "number"}
        }}},
        type: {type: "record", argTypes: {
            size: {type: "number"}
        }}
    },
    {
        path: "max{length}",
        value: {type: "array", contentType: {type: "array", contentType: {type: "string"}}},
        type: {type: "array", contentType: {type: "string"}}
    },
    {
        path: "max{width}",
        value: {type: "array", contentType: {type: "array", contentType: {type: "string"}}},
        error: true // because null property is incomparable
    },
    {
        path: "max{}",
        value: {type: "null"},
        type: {type: "null"}
    },

    // TODO parent

    // with
    {
        path: "child.(this + 2)",
        value: {type: "record", argTypes: {
            child: {type: "number"}
        }},
        type: {type: "number"}
    },

    // if
    {
        path: "a ? b : c",
        value: {type: "record", argTypes: {
            a: {type: "boolean"},
            b: {type: "string"},
            c: {type: "string"}
        }},
        type: {type: "string"}
    },
    {
        path: "a ? b : c",
        value: {type: "record", argTypes: {
            a: {type: "record", argTypes: {}},
            b: {type: "string"},
            c: {type: "string"}
        }},
        error: true // because condition is not boolean
    },
    {
        path: "a ? b : c",
        value: {type: "record", argTypes: {
            a: {type: "boolean"},
            b: {type: "string"},
            c: {type: "number"}
        }},
        error: true // because consequent and alternate do not agree
    },

    // not
    {
        path: "!",
        value: {type: "boolean"},
        type: {type: "boolean"}
    },
    {
        path: "!",
        value: {type: "null"},
        type: {type: "boolean"}
    },
    {
        path: "!",
        value: {type: "record", argTypes: {}},
        error: true // because the argument is not boolean
    },

    // and
    {
        path: "true && false",
        type: {type: "boolean"}
    },
    {
        path: "true && null",
        type: {type: "boolean"}
    },
    {
        path: "null && null",
        type: {type: "boolean"}
    },
    {
        path: "1 && 2",
        type: {type: "boolean"}
    },
    {
        path: "{} && {}",
        error: true
    },

    // or
    {
        path: "true || false",
        type: {type: "boolean"}
    },
    {
        path: "true || null",
        type: {type: "boolean"}
    },
    {
        path: "null || null",
        type: {type: "boolean"}
    },
    {
        path: "1 || 2",
        type: {type: "boolean"}
    },
    {
        path: "{} || {}",
        error: true
    },

    // default
    {
        path: "{a: 10} ?? {a: 10, b: 20}",
        type: Type.of({a: 10}).describe()
    },

    // defined
    {
        path: "defined()",
        type: {type: "boolean"}
    },

    {
        path: "a.path(b)",
        value: {type: "record", argTypes: {
            a: {type: "string"},
            b: {type: "string"}
        }},
        type: {type: "null"}
    },
    {
        path: "path('10')",
        type: {type: "number", value: 10}
    },

    // TODO toArray / asArray

    // toNumber
    {
        path: "+'a'",
        type: {type: "number"}
    },
    {
        path: "+{}",
        error: true
    },

    // toString
    {
        path: "'a'.toString()",
        type: {type: "string", value: "a"}
    },
    {
        path: "1.toString()",
        type: {type: "string"}
    },
    {
        path: "{}.toString()",
        error: true
    },

    // neg
    {
        path: "-(-2)",
        type: {type: "number"}
    },
    {
        path: "-{}",
        error: true
    },

    // equals
    {
        path: "1 == 2",
        type: {type: "boolean"}
    },
    {
        path: "{} == {}",
        error: true // must be comparable
    },
    {
        path: "'a' == 1",
        error: true // must agree
    },

    // compare
    {
        path: "1 <=> 2",
        type: {type: "number"}
    },
    {
        path: "{} <=> {}",
        error: true // must be comparable
    },
    {
        path: "'a' <=> 1",
        error: true // must agree
    },

    // join
    {
        path: "join(', ')",
        value: {type: "array", contentType: {type: "string"}},
        type: {type: "string"}
    },
    {
        path: "['a', 'b', 'c'].join(', ')",
        type: {type: "string"}
    },
    {
        path: "join(', ')",
        value: {type: "string"},
        error: true // input must be array-like of strings
    },
    {
        path: "['1', '2', '3'].join(1)",
        error: true // delimiter must be string
    },

    // split
    {
        path: "'a, b, c'.split(', ')",
        type: {type: "array", contentType: {type: "string"}}
    },
    {
        path: "split(1)",
        value: {type: "string"},
        error: true // delimiter must be string
    },
    {
        path: "split(', ')",
        value: {type: "array", contentType: {type: "string"}},
        error: true // input must be string
    },

    // toUpperCase
    {
        path: "toUpperCase()",
        value: {type: "string"},
        type: {type: "string"}
    },
    {
        path: "toUpperCase()",
        value: {type: "number"},
        error: true
    },

    // toLowerCase
    {
        path: "toLowerCase()",
        value: {type: "string"},
        type: {type: "string"}
    },
    {
        path: "toLowerCase()",
        value: {type: "number"},
        error: true
    },

    // startsWith
    {
        path: "'ab'.startsWith('a')",
        type: {type: "boolean"}
    },
    {
        path: "1.startsWith('1')",
        error: true
    },
    {
        path: "'1'.startsWith(1)",
        error: true
    },

    // endsWith
    {
        path: "'ab'.endsWith('a')",
        type: {type: "boolean"}
    },
    {
        path: "1.endsWith('1')",
        error: true
    },
    {
        path: "'1'.endsWith(1)",
        error: true
    },

    // contains
    {
        path: "'ab'.contains('a')",
        type: {type: "boolean"}
    },
    {
        path: "1.contains('1')",
        error: true
    },
    {
        path: "'1'.contains(1)",
        error: true
    },

    // range
    {
        path: "range()",
        value: {type: "number"},
        type: {type: "array", contentType: {type: "number"}}
    },
    {
        path: "range('a')",
        error: true
    }

];

// these exercise all of the boolean comparison operators
var compareSpecs = [
    {
        path: "a > b", // for example. these paths are overridden for each operator
        type: {type: "boolean"},
        value: {type: "record", argTypes: {
            a: {type: "number"},
            b: {type: "number"}
        }}
    },
    {
        path: "a > b",
        value: {type: "record", argTypes: {
            a: {type: "number"},
            b: {type: "string"}
        }},
        error: true // because a and b do not agree
    },
    // tuple and array
    {
        path: "a > b",
        type: {type: "boolean"},
        value: {type: "record", argTypes: {
            a: {type: "tuple", argTypes: [
                {type: "number"},
                {type: "number"}
            ]},
            b: {type: "array", contentType: {type: "number"}}
        }}
    },
    // array and tuple
    {
        path: "a > b",
        type: {type: "boolean"},
        value: {type: "record", argTypes: {
            a: {type: "array", contentType: {type: "number"}},
            b: {type: "tuple", argTypes: [
                {type: "number"},
                {type: "number"}
            ]}
        }}
    },
    {
        path: "a > b",
        value: {type: "record", argTypes: {
            a: {type: "tuple", argTypes: [
                {type: "number"},
                {type: "string"}
            ]},
            b: {type: "array", contentType: {type: "number"}}
        }},
        error: true // because a is heterogenous
    },
    {
        path: "a > b",
        value: {type: "record", argTypes: {
            a: {type: "array", contentType: {type: "number"}},
            b: {type: "tuple", argTypes: [
                {type: "number"},
                {type: "string"}
            ]}
        }},
        error: true // because b is heterogenous
    },
    {
        path: "a > b",
        value: {type: "record", argTypes: {
            a: {type: "map"}, // incompleteness not salient
            b: {type: "map"},
        }},
        error: true // because a and b are incomparable
    },
];

["<", ">", "<=", ">="].forEach(function (operator) {
    specs.push.apply(specs, compareSpecs.clone().map(function (spec) {
        spec.path = "a " + operator + " b";
        return spec;
    }));
});

var numericSpecs = [
    {
        path: "2 operator 2",
        type: {type: "number"}
    },
    {
        path: "{} operator 2",
        error: true
    },
    {
        path: "2 operator {}",
        error: true
    }
];

["+", "-", "*", "/", "%", "rem", "**", "//", "%%"].forEach(function (operator) {
    specs.push.apply(specs, numericSpecs.clone().map(function (spec) {
        spec.path = spec.path.replace("operator", operator);
        return spec;
    }));
});

describe("core/infer-spec", function () {

    describe("registration", function () {
        it("should contain all declared types", function () {
            expect(Object.keys(types)).toEqual([
                "null",
                "boolean",
                "number",
                "string",
                "date",
                "url",
                "tuple",
                "record",
                "array",
                "map",
                "blueprint",
                "blueprint-promise"
            ]);
        });
    });

    describe("of", function () {

        it("describes a number", function () {
            expect(Type.of(10).describe()).toEqual({
                type: "number",
                value: 10
            });
        });

        it("describes a boolean", function () {
            expect(Type.of(false).describe()).toEqual({
                type: "boolean",
                value: false
            });
        });

        it("describes a string", function () {
            expect(Type.of("hi").describe()).toEqual({
                type: "string",
                value: "hi"
            });
        });

        it("describes a record", function () {
            expect(Type.of({
                a: 10,
                b: 20
            }).describe()).toEqual({
                type: "record",
                argTypes: {
                    a: {type: "number", value: 10},
                    b: {type: "number", value: 20}
                }
            });
        });

        it("describes a tuple", function () {
            expect(Type.of([10, "b"]).describe()).toEqual({
                type: "tuple",
                argTypes: [
                    {type: "number", value: 10},
                    {type: "string", value: "b"}
                ]
            });
        });

    });

    describe("describe", function () {

        it("should describe a heterogenous array", function () {
            expect(new types.array(types["null"].instance).describe()).toEqual({
                type: "array",
                contentType: {
                    type: "null"
                }
            });
        });

        it("should describe a homogenous map", function () {
            expect(
                new types.map(
                    types.string.instance,
                    types.number.instance
                ).describe()
            ).toEqual({
                type: "map",
                keyType: {type: "string"},
                valueType: {type: "number"}
            });
        });

    });

    describe("inferrence", function () {
        specs.forEach(function (spec) {
            if (!spec.error) {
                it(JSON.stringify(spec), function () {
                    var scope = new Scope(Type.fromDescription(spec.value));
                    scope.parameters = Type.fromDescription(spec.parameters);
                    var type = infer(spec.path, scope);
                    expect(JSON.stringify(type.describe()))
                        .toEqual(JSON.stringify(spec.type));
                });
            } else {
                it(JSON.stringify(spec), function () {
                    var scope = new Scope(Type.fromDescription(spec.value));
                    scope.parameters = Type.fromDescription(spec.parameters);
                    expect(function () {
                        infer(spec.path, scope);
                    }).toThrow();
                });
            }
        });
    });

});

