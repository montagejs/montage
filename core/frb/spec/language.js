// these cases are used to test both "parse" and "stringify"
module.exports = [

    {
        path: "",
        syntax: {type: "value"}
    },

    {
        path: "this",
        syntax: {type: "value"},
        nonCanon: true
    },

    {
        path: "1",
        syntax: {type: "literal", value: 1}
    },

    {
        path: "1.2",
        syntax: {type: "literal", value: 1.2}
    },

    {
        path: "true",
        syntax: {type: "literal", value: true}
    },

    {
        path: "false",
        syntax: {type: "literal", value: false}
    },

    {
        path: "null",
        syntax: {type: "literal", value: null}
    },

    {
        path: "'\"'",
        syntax: {type: "literal", value: "\""}
    },

    {
        path: "'\\''",
        syntax: {type: "literal", value: "'"}
    },

    {
        path: "\"\\\"\"",
        syntax: {type: "literal", value: "\""},
        nonCanon: true
    },

    {
        path: "\"'\"",
        syntax: {type: "literal", value: "'"},
        nonCanon: true
    },

    {
        path: "a",
        syntax: {type: "property", args: [
            {type: "value"},
            {type: "literal", value: "a"}
        ]}
    },

    {
        path: "a.b",
        syntax: {type: "property", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "a"}
            ]},
            {type: "literal", value: "b"}
        ]}
    },

    {
        path: "a[b]",
        syntax: {type: "property", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "a"}
            ]},
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "b"}
            ]}
        ]}
    },

    {
        path: "this[b]",
        syntax: {type: "property", args: [
            {type: "value"},
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "b"}
            ]}
        ]}
    },

    {
        path: "get(key)",
        syntax: {type: "get", args: [
            {type: "value"},
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "key"}
            ]}
        ]}
    },

    {
        path: ".0",
        syntax: {type: "property", args: [
            {type: "value"},
            {type: "literal", value: 0}
        ]}
    },

    {
        path: "a.0.b",
        syntax: {type: "property", args: [
            {type: "property", args: [
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "a"}
                ]},
                {type: "literal", value: 0}
            ]},
            {type: "literal", value: "b"}
        ]}
    },

    {
        path: "(a + b).x",
        syntax: {type: "property", args: [
            {type: "add", args: [
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "a"}
                ]},
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "b"}
                ]}
            ]},
            {type: "literal", value: "x"}
        ]}
    },

    {
        path: "1 + 2 + 3",
        syntax: {type: "add", args: [
            {type: "add", args: [
                {type: "literal", value: 1},
                {type: "literal", value: 2}
            ]},
            {type: "literal", value: 3}
        ]}
    },

    {
        path: "1 + (2 + 3)",
        syntax: {type: "add", args: [
            {type: "literal", value: 1},
            {type: "add", args: [
                {type: "literal", value: 2},
                {type: "literal", value: 3}
            ]}
        ]},
        nonCanon: true
    },

    {
        path: "!a",
        syntax: {type: "not", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "a"}
            ]}
        ]}
    },

    {
        path: "!!a",
        syntax: {type: "not", args: [
            {type: "not", args: [
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "a"}
                ]}
            ]}
        ]}
    },

    {
        path: "!(a && b)",
        syntax: {type: "not", args: [
            {type: "and", args: [
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "a"}
                ]},
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "b"}
                ]}
            ]}
        ]}
    },

    {
        path: "a.[b, c]",
        syntax: {type: "with", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "a"},
            ]},
            {type: "tuple", args: [
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "b"},
                ]},
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "c"},
                ]}
            ]}
        ]}
    },

    {
        path: "a.{foo: x}",
        syntax: {type: "with", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "a"},
            ]},
            {type: "record", args: {
                foo: {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "x"}
                ]}
            }}
        ]}
    },

    {
        path: "a.(b + c)",
        syntax: {type: "with", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "a"},
            ]},
            {type: "add", args: [
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "b"},
                ]},
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "c"},
                ]}
            ]}
        ]}
    },

    {
        path: "a.('a')",
        syntax: {type: "with", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "a"},
            ]},
            {type: "literal", value: "a"}
        ]}
    },

    {
        path: "^a",
        syntax: {type: "parent", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "a"}
            ]}
        ]}
    },

    {
        path: "^a.foo(bar)",
        syntax: {type: "foo", args: [
            {type: "parent", args: [
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "a"}
                ]}
            ]},
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "bar"}
            ]}
        ]}
    },

    {
        path: "[]",
        syntax: {type: "tuple", args: [
        ]}
    },

    {
        path: "[,]",
        syntax: {type: "tuple", args: [
            {type: "value"},
            {type: "value"}
        ]},
        nonCanon: true
    },

    {
        path: "[,,]",
        syntax: {type: "tuple", args: [
            {type: "value"},
            {type: "value"},
            {type: "value"}
        ]},
        nonCanon: true
    },

    {
        path: "[this]",
        syntax: {type: "tuple", args: [
            {type: "value"}
        ]}
    },

    {
        path: "[this, this]",
        syntax: {type: "tuple", args: [
            {type: "value"},
            {type: "value"}
        ]}
    },

    {
        path: "[a]",
        syntax: {type: "tuple", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "a"}
            ]}
        ]}
    },

    {
        path: "map{}",
        syntax: {type: "mapBlock", args: [
            {type: "value"},
            {type: "value"}
        ]}
    },

    {
        path: "a.map{}",
        syntax: {type: "mapBlock", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "a"}
            ]},
            {type: "value"}
        ]}
    },

    {
        path: "a.map{b}",
        syntax: {type: "mapBlock", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "a"}
            ]},
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "b"}
            ]}
        ]}
    },

    {
        path: "map{* $factor}",
        syntax: {type: "mapBlock", args: [
            {type: "value"},
            {type: "mul", args: [
                {type: "value"},
                {type: "property", args: [
                    {type: "parameters"},
                    {type: "literal", value: "factor"}
                ]}
            ]}
        ]}
    },

    {
        path: "filter{}",
        syntax: {type: "filterBlock", args: [
            {type: "value"},
            {type: "value"}
        ]}
    },

    {
        path: "some{}",
        syntax: {type: "someBlock", args: [
            {type: "value"},
            {type: "value"}
        ]}
    },

    {
        path: "every{}",
        syntax: {type: "everyBlock", args: [
            {type: "value"},
            {type: "value"}
        ]}
    },

    {
        path: "sorted{}",
        syntax: {type: "sortedBlock", args: [
            {type: "value"},
            {type: "value"}
        ]}
    },

    {
        path: "sortedSet{}",
        syntax: {type: "sortedSetBlock", args: [
            {type: "value"},
            {type: "value"}
        ]}
    },

    {
        path: "flatten()",
        syntax: {type: "flatten", args: [
            {type: "value"}
        ]}
    },

    {
        path: "flatten{}",
        syntax: {type: "flatten", args: [
            {type: "value"}
        ]},
        nonCanon: true
    },

    {
        path: "a.flatten{}",
        syntax: {type: "flatten", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "a"}
            ]}
        ]},
        nonCanon: true
    },

    {
        path: "a.flatten{b}",
        syntax: {type: "flatten", args: [
            {type: "mapBlock", args: [
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "a"}
                ]},
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "b"}
                ]}
            ]}
        ]}
    },

    {
        path: "function(0, '\\'')",
        syntax: {type: "function", args: [
            {type: "value"},
            {type: "literal", value: 0},
            {type: "literal", value: "'"}
        ]}
    },

    {
        path: "$foo",
        syntax: {type: "property", args: [
            {type: "parameters"},
            {type: "literal", value: "foo"}
        ]}
    },

    {
        path: "{a: 10}",
        syntax: {type: "record", args: {
            a: {type: "literal", value: 10}
        }}
    },

    {
        path: "{a: 10, b: 20}",
        syntax: {type: "record", args: {
            a: {type: "literal", value: 10},
            b: {type: "literal", value: 20}
        }}
    },

    {
        path: "2 == 2",
        syntax: {type: "equals", args: [
            {type: "literal", value: 2},
            {type: "literal", value: 2}
        ]}
    },

    {
        path: "2 != 2",
        syntax: {type: "not", args: [
            {type: "equals", args: [
                {type: "literal", value: 2},
                {type: "literal", value: 2}
            ]}
        ]}
    },

    {
        path: "2 + 2",
        syntax: {type: "add", args: [
            {type: "literal", value: 2},
            {type: "literal", value: 2}
        ]}
    },

    {
        path: "2 + 2 == 4",
        syntax: {type: "equals", args: [
            {type: "add", args: [
                {type: "literal", value: 2},
                {type: "literal", value: 2}
            ]},
            {type: "literal", value: 4}
        ]}
    },

    {
        path: "!0",
        syntax: {type: "not", args: [
            {type: "literal", value: 0}
        ]}
    },

    {
        path: "-1",
        syntax: {type: "neg", args: [
            {type: "literal", value: 1}
        ]}
    },

    {
        path: "2 * 2 + 4",
        syntax: {type: "add", args: [
            {type: "mul", args: [
                {type: "literal", value: 2},
                {type: "literal", value: 2}
            ]},
            {type: "literal", value: 4}
        ]}
    },

    {
        path: "2 * (2 + 4)",
        syntax: {type: "mul", args: [
            {type: "literal", value: 2},
            {type: "add", args: [
                {type: "literal", value: 2},
                {type: "literal", value: 4}
            ]}
        ]}
    },

    {
        path: "x != a && y != b",
        syntax: {type: "and", args: [
            {type: "not", args: [
                {type: "equals", args: [
                    {type: "property", args: [
                        {type: "value"},
                        {type: "literal", value: "x"}
                    ]},
                    {type: "property", args: [
                        {type: "value"},
                        {type: "literal", value: "a"}
                    ]}
                ]},
            ]},
            {type: "not", args: [
                {type: "equals", args: [
                    {type: "property", args: [
                        {type: "value"},
                        {type: "literal", value: "y"}
                    ]},
                    {type: "property", args: [
                        {type: "value"},
                        {type: "literal", value: "b"}
                    ]}
                ]}
            ]}
        ]}
    },

    {
        path: "!(% 2)",
        syntax: {type: "not", args: [
            {type: "mod", args: [
                {type: "value"},
                {type: "literal", value: 2}
            ]}
        ]}
    },

    {
        path: "a || b && c",
        syntax: {type: "or", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "a"}
            ]},
            {type: "and", args: [
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "b"}
                ]},
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "c"}
                ]}
            ]}
        ]}
    },

    {
        path: "this[a]",
        syntax: {type: "property", args: [
            {type: "value"},
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "a"}
            ]}
        ]}
    },

    {
        path: "this['~' + a]",
        syntax: {type: "property", args: [
            {type: "value"},
            {type: "add", args: [
                {type: "literal", value: "~"},
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "a"}
                ]}
            ]}
        ]}
    },

    {
        path: "this['a']",
        syntax: {type: "property", args: [
            {type: "value"},
            {type: "literal", value: "a"}
        ]},
        nonCanon: true
    },

    {
        path: "x['!']",
        syntax: {type: "property", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "x"}
            ]},
            {type: "literal", value: "!"}
        ]}
    },

    {
        path: "x['a']",
        syntax: {type: "property", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "x"}
            ]},
            {type: "literal", value: "a"}
        ]},
        nonCanon: true
    },

    {
        path: "array[array.length - 1]",
        syntax: {type: "property", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "array"}
            ]},
            {type: "sub", args: [
                {type: "property", args: [
                    {type: "property", args: [
                        {type: "value"},
                        {type: "literal", value: "array"}
                    ]},
                    {type: "literal", value: "length"}
                ]},
                {type: "literal", value: 1}
            ]}
        ]}
    },

    {
        path: "*",
        syntax: {type: "mul", args: [
            {type: "value"},
            {type: "value"}
        ]}
    },

    {
        path: "**",
        syntax: {type: "pow", args: [
            {type: "value"},
            {type: "value"}
        ]}
    },

    {
        path: "//",
        syntax: {type: "root", args: [
            {type: "value"},
            {type: "value"}
        ]}
    },

    {
        path: "%%",
        syntax: {type: "log", args: [
            {type: "value"},
            {type: "value"}
        ]}
    },

    {
        path: "n rem 2",
        syntax: {type: "rem", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "n"}
            ]},
            {type: "literal", value: 2}
        ]}
    },

    {
        path: "min()",
        syntax: {type: "min", args: [
            {type: "value"}
        ]}
    },

    {
        path: "min{x}",
        syntax: {type: "minBlock", args: [
            {type: "value"},
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "x"}
            ]}
        ]}
    },

    {
        path: "array.max()",
        syntax: {type: "max", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "array"}
            ]}
        ]}
    },

    {
        path: "#id",
        syntax: {type: "element", id: "id"}
    },

    {
        path: "#body.classList.has('darkmode')",
        syntax: {type: "has", args: [
            {type: "property", args: [
                {type: "element", id: "body"},
                {type: "literal", value: "classList"}
            ]},
            {type: "literal", value: "darkmode"}
        ]}
    },

    {
        path: "@owner",
        syntax: {type: "component", label: "owner"}
    },

    {
        path: "x ? a : b",
        syntax: {type: "if", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "x"}
            ]},
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "a"}
            ]},
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "b"}
            ]}
        ]}
    },

    {
        path: "x ? a : y ? b : c",
        syntax: {type: "if", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "x"}
            ]},
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "a"}
            ]},
            {type: "if", args: [
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "y"}
                ]},
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "b"}
                ]},
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "c"}
                ]}
            ]}
        ]}
    },

    {
        path: "x ? y ? a : b : z ? c : d",
        syntax: {type: "if", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "x"}
            ]},
            {type: "if", args: [
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "y"}
                ]},
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "a"}
                ]},
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "b"}
                ]}
            ]},
            {type: "if", args: [
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "z"}
                ]},
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "c"}
                ]},
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "d"}
                ]}
            ]}
        ]}
    },

    {
        path: "(x ? a : b) ? c : d",
        syntax: {type: "if", args: [
            {type: "if", args: [
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "x"}
                ]},
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "a"}
                ]},
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "b"}
                ]}
            ]},
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "c"}
            ]},
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "d"}
            ]}
        ]}
    },

    {
        path: "x ?? 10",
        syntax: {type: "default", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "x"}
            ]},
            {type: "literal", value: 10}
        ]}
    },

    {
        path: "!x ?? 10",
        syntax: {type: "default", args: [
            {type: "not", args: [
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "x"}
                ]},
            ]},
            {type: "literal", value: 10}
        ]}
    },

    {
        path: "x ?? 10 + 10",
        syntax: {type: "add", args: [
            {type: "default", args: [
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "x"}
                ]},
                {type: "literal", value: 10}
            ]},
            {type: "literal", value: 10}
        ]}
    },

    {
        path: "x ?? y ?? 10",
        syntax: {type: "default", args: [
            {type: "default", args: [
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "x"}
                ]},
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "y"}
                ]}
            ]},
            {type: "literal", value: 10}
        ]}
    },

    {
        path: '&range(10, 20, 1)',
        syntax: {type: "range", args: [
            {type: "literal", value: 10},
            {type: "literal", value: 20},
            {type: "literal", value: 1}
        ], inline: true}
    },

    {
        path: "1 <=> 2",
        syntax: {type: "compare", args: [
            {type: "literal", value: 1},
            {type: "literal", value: 2}
        ]}
    },

    {
        path: "group{}",
        syntax: {type: "groupBlock", args: [
            {type: "value"},
            {type: "value"}
        ]}
    },

    {
        path: "groupMap{}",
        syntax: {type: "groupMapBlock", args: [
            {type: "value"},
            {type: "value"}
        ]}
    },

    {
        path: "()",
        syntax: {type: "value"},
        nonCanon: true
    },

    {
        path: "path(this)",
        syntax: {type: "path", args: [
            {type: "value"},
            {type: "value"}
        ]}
    },

    {
        path: "path(this, this)",
        syntax: {type: "path", args: [
            {type: "value"},
            {type: "value"},
            {type: "value"}
        ]}
    },

    // Extended component sheet syntax

    {
        path: "\n@foo < 'module' Module {\n}\n\n",
        syntax: {type: "sheet", blocks: [
            {type: "block",
                label: "foo",
                module: "module",
                exports: {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "Module"},
                ]},
                connection: "prototype",
                statements: []
            }
        ]},
        options: {
            startRule: "sheet"
        }
    },

    {
        path: "\n@foo : 'module' {\n}\n\n",
        syntax: {type: "sheet", blocks: [
            {type: "block",
                label: "foo",
                module: "module",
                connection: "object",
                statements: []
            }
        ]},
        options: {
            startRule: "sheet"
        }
    },

    {
        path: "\n@foo {\n    a <-> b;\n}\n\n",
        syntax: {type: "sheet", blocks: [
            {type: "block", label: "foo", statements: [
                {type: "bind2", args: [
                    {type: "property", args: [
                        {type: "value"},
                        {type: "literal", value: "a"}
                    ]},
                    {type: "property", args: [
                        {type: "value"},
                        {type: "literal", value: "b"}
                    ]}
                ]}
            ]}
        ]},
        options: {
            startRule: "sheet"
        }
    },

    {
        path: "\n@foo {\n    a <-> b, converter: @converter;\n}\n\n",
        syntax: {type: "sheet", blocks: [
            {type: "block", label: "foo", statements: [
                {type: "bind2", args: [
                    {type: "property", args: [
                        {type: "value"},
                        {type: "literal", value: "a"}
                    ]},
                    {type: "property", args: [
                        {type: "value"},
                        {type: "literal", value: "b"}
                    ]}
                ], descriptor: {
                    converter: {type: "component", label: "converter"}
                }}
            ]}
        ]},
        options: {
            startRule: "sheet"
        }
    },

    {
        path: "\n@foo {\n    a: 10;\n}\n\n",
        syntax: {type: "sheet", blocks: [
            {type: "block", label: "foo", statements: [
                {type: "assign", args: [
                    {type: "property", args: [
                        {type: "value"},
                        {type: "literal", value: "a"}
                    ]},
                    {type: "literal", value: 10}
                ]}
            ]}
        ]},
        options: {
            startRule: "sheet"
        }
    },

    {
        path: "\n@foo {\n    on action -> @foo;\n}\n\n",
        syntax: {type: "sheet", blocks: [
            {type: "block", label: "foo", statements: [
                {
                    type: "event",
                    event: "action",
                    when: "on",
                    listener: {type: "component", label: "foo"}
                }
            ]}
        ]},
        options: {
            startRule: "sheet"
        }
    },

    {
        path: "@foo:thingy",
        syntax: { type: "component", label: "foo:thingy" }
    },

    // Invalid syntax

    {
        path: "(",
        invalid: "Expected end of input but \"(\" found."
    },

    {
        path: ")",
        invalid: "Expected end of input but \")\" found."
    },

    {
        path: "[",
        invalid: "Expected end of input but \"[\" found."
    },

    {
        path: "]",
        invalid: "Expected end of input but \"]\" found."
    },

    {
        path: "#",
        invalid: "Expected end of input but \"#\" found."
    }

];
