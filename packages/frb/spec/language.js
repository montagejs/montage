
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
        path: "*",
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
