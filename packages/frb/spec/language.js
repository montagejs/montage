// these cases are used to test both "parse" and "stringify"
module.exports = [

    {
        path: "",
        syntax: {type: "value"}
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
        path: ".0",
        syntax: {type: "property", args: [
            {type: "value"},
            {type: "literal", value: 0}
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
        path: "[]",
        syntax: {type: "tuple", args: [
        ]}
    },

    {
        path: "[,]",
        syntax: {type: "tuple", args: [
            {type: "value"}
        ]},
        nonCanon: true
    },

    {
        path: "[,,]",
        syntax: {type: "tuple", args: [
            {type: "value"},
            {type: "value"}
        ]},
        nonCanon: true
    },

    {
        path: "[()]",
        syntax: {type: "tuple", args: [
            {type: "value"}
        ]}
    },

    {
        path: "[(), ()]",
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
        path: "()['a']",
        syntax: {type: "get", args: [
            {type: "value"},
            {type: "literal", value: "a"}
        ]}
    },

    {
        path: "x['a']",
        syntax: {type: "get", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "x"}
            ]},
            {type: "literal", value: "a"}
        ]}
    },

    {
        path: "array[array.length - 1]",
        syntax: {type: "get", args: [
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
        path: "array.max()",
        syntax: {type: "max", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "array"}
            ]}
        ]}
    },

    {
        path: ".*",
        syntax: {type: "rangeContent", args: [
            {type: "value"}
        ]}
    },

    {
        path: "()[*]",
        syntax: {type: "mapContent", args: [
            {type: "value"}
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
    }

];
