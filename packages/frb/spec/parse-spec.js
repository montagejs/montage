
var parse = require("../parse");

describe("parse", function () {

    [

        {
            input: "",
            output: {type: "value"}
        },

        {
            input: "a",
            output: {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "a"}
            ]}
        },

        {
            input: "a.b",
            output: {type: "property", args: [
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "a"}
                ]},
                {type: "literal", value: "b"}
            ]}
        },

        {
            input: "[]",
            output: {type: "tuple", args: [
            ]}
        },

        {
            input: "[,]",
            output: {type: "tuple", args: [
                {type: "value"}
            ]}
        },

        {
            input: "[,,]",
            output: {type: "tuple", args: [
                {type: "value"},
                {type: "value"}
            ]}
        },

        {
            input: "[a]",
            output: {type: "tuple", args: [
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "a"}
                ]}
            ]}
        },

        {
            input: "map{}",
            output: {type: "mapBlock", args: [
                {type: "value"},
                {type: "value"}
            ]}
        },

        {
            input: "a.map{}",
            output: {type: "mapBlock", args: [
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "a"}
                ]},
                {type: "value"}
            ]}
        },

        {
            input: "a.map{b}",
            output: {type: "mapBlock", args: [
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
            input: "flatten()",
            output: {type: "flatten", args: [
                {type: "value"}
            ]}
        },

        {
            input: "flatten{}",
            output: {type: "flatten", args: [
                {type: "value"}
            ]}
        },

        {
            input: "a.flatten{}",
            output: {type: "flatten", args: [
                {type: "property", args: [
                    {type: "value"},
                    {type: "literal", value: "a"}
                ]}
            ]}
        },

        {
            input: "a.flatten{b}",
            output: {type: "flatten", args: [
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
            input: "function(0, '\\'')",
            output: {type: "function", args: [
                {type: "value"},
                {type: "literal", value: 0},
                {type: "literal", value: "'"}
            ]}
        },

        {
            input: "$foo",
            output: {type: "property", args: [
                {type: "parameters"},
                {type: "literal", value: "foo"}
            ]}
        },

        {
            input: "{a: 10}",
            output: {type: "record", args: {
                a: {type: "literal", value: 10}
            }}
        },

        {
            input: "2 == 2",
            output: {type: "equals", args: [
                {type: "literal", value: 2},
                {type: "literal", value: 2}
            ]}
        },

        {
            input: "2 != 2",
            output: {type: "not", args: [
                {type: "equals", args: [
                    {type: "literal", value: 2},
                    {type: "literal", value: 2}
                ]}
            ]}
        },

        {
            input: "2 + 2",
            output: {type: "add", args: [
                {type: "literal", value: 2},
                {type: "literal", value: 2}
            ]}
        },

        {
            input: "2 + 2 = 4",
            output: {type: "equals", args: [
                {type: "add", args: [
                    {type: "literal", value: 2},
                    {type: "literal", value: 2}
                ]},
                {type: "literal", value: 4}
            ]}
        },

        {
            input: "!0",
            output: {type: "not", args: [
                {type: "literal", value: 0}
            ]}
        },

        {
            input: "-1",
            output: {type: "neg", args: [
                {type: "literal", value: 1}
            ]}
        },

        {
            input: "2 * 2 + 4",
            output: {type: "add", args: [
                {type: "mul", args: [
                    {type: "literal", value: 2},
                    {type: "literal", value: 2}
                ]},
                {type: "literal", value: 4}
            ]}
        },

        {
            input: "x != a && y != b",
            output: {type: "and", args: [
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
            input: "!(%2)",
            output: {type: "not", args: [
                {type: "mod", args: [
                    {type: "value"},
                    {type: "literal", value: 2}
                ]}
            ]}
        },

        {
            input: "#input",
            output: {type: "element", id: "input"}
        },

        {
            input: "#body.classList.has('darkmode')",
            output: {type: "has", args: [
                {type: "property", args: [
                    {type: "element", id: "body"},
                    {type: "literal", value: "classList"}
                ]},
                {type: "literal", value: "darkmode"}
            ]}
        },

        {
            input: "@owner",
            output: {type: "component", label: "owner"}
        }

    ].forEach(function (test) {
        it("should parse " + JSON.stringify(test.input), function () {
            expect(parse(test.input)).toEqual(test.output);
        });
    })

});

