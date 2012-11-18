// these cases are used ot test evaluation compiler (evaluate-spec.js) and
// observer compiler (for the initial value, evaluate-with-observe-spec.js).
module.exports = [

    {
        path: "10",
        output: 10
    },

    {
        path: "10.1",
        output: 10.1
    },

    {
        path: "-10",
        output: -10
    },

    {
        path: "'a'",
        output: "a"
    },

    {
        path: "'\\''",
        output: "'"
    },

    {
        path: "",
        input: 10,
        output: 10
    },

    {
        path: "a",
        input: {a: 10},
        output: 10
    },

    {
        path: "a.b",
        input: {a: {b: 10}},
        output: 10
    },

    {
        path: "$",
        parameters: 10,
        output: 10
    },

    {
        path: "$a",
        parameters: {a: 10},
        output: 10
    },

    {
        path: "$a.b",
        parameters: {a: {b: 10}},
        output: 10
    },

    {
        path: "#id",
        parameters: {
            document: {
                getElementById: function (id) {
                    return id;
                }
            }
        },
        output: "id"
    },

    {
        path: "#id.value",
        parameters: {
            document: {
                getElementById: function (id) {
                    return {value: id};
                }
            }
        },
        output: "id"
    },

    {
        path: "@label",
        parameters: {
            serialization: {
                getObjectByLabel: function (label) {
                    return label;
                }
            }
        },
        output: "label"
    },

    {
        path: "@label.value",
        parameters: {
            serialization: {
                getObjectByLabel: function (label) {
                    return {value: label};
                }
            }
        },
        output: "label"
    },

    {
        path: '[a, b, c]',
        input: {a: 1, b: 2, c: 3},
        output: [1, 2, 3]
    },

    {
        path: '{a: x, b: y, c: z}',
        input: {x: 1, y: 2, z: 3},
        output: {a: 1, b: 2, c: 3}
    },

    {
        path: "{a: ()[0], b: ()[1]}",
        input: [10, 20],
        output: {a: 10, b: 20}
    },

    {
        path: "scope.{foo: x}",
        input: {scope: {x: 10}},
        output: {foo: 10}
    },

    {
        path: "scope.(a + b)",
        input: {scope: {a: 2, b: 3}},
        output: 5
    },

    {
        path: "scope.(a + b).(() + 2)",
        input: {scope: {a: 2, b: 3}},
        output: 7
    },

    {
        path: "scope.(a + b).(+2)",
        input: {scope: {a: 2, b: 3}},
        output: 2
    },

    {
        path: "scope.[a, b]",
        input: {scope: {a: 2, b: 3}},
        output: [2, 3]
    },

    {
        path: "map{* 2}",
        input: [1, 2, 3],
        output: [2, 4, 6]
    },

    {
        path: "map{* $factor}",
        input: [1, 2, 3],
        parameters: {factor: 2},
        output: [2, 4, 6]
    },

    {
        path: "array.map{* $factor}",
        input: {array: [1, 2, 3]},
        parameters: {factor: 2},
        output: [2, 4, 6]
    },

    {
        path: '[1, 2, 3].map{* $factor}',
        parameters: {factor: 2},
        output: [2, 4, 6]
    },

    {
        path: "array.filter{!(% 2)}",
        input: {array: [1, 2, 3, 4]},
        output: [2, 4]
    },

    {
        path: "sorted{foo}.map{foo}.reversed()",
        input: [{foo: 3}, {foo: 1}, {foo: 2}],
        output: [3, 2, 1]
    },

    {
        path: "map($by)",
        parameters: {by: function (x) {return x.foo}},
        input: [{foo: 1}, {foo: 2}, {foo: 3}],
        output: [1, 2, 3]
    },

    //{
    //    path: "filter($predicate)",
    //    parameters: {predicate: function (x) {return !(x.foo % 2)}},
    //    input: [{foo: 1}, {foo: 2}, {foo: 3}, {foo: 4}],
    //    output: [{foo: 2}, {foo: 4}]
    //},

    //{
    //    path: "sorted($by).map{foo}.reversed()",
    //    parameters: {by: function (x) {return x.foo}},
    //    input: [{foo: 4}, {foo: 1}, {foo: 3}, {foo: 2}],
    //    output: [4, 3, 2, 1]
    //}

    //{
    //    path: "min()",
    //    input: [1, 2, 3],
    //    output: 1
    //},

    //{
    //    path: "max()",
    //    input: [1, 2, 3],
    //    output: 3
    //},

    {
        path: "sum()",
        input: [1, 2, 3],
        output: 6
    },

    {
        path: "average()",
        input: [1, 2, 3],
        output: 2
    },

    {
        path: "flatten()",
        input: [[1], [2, 3], [4]],
        output: [1, 2, 3, 4]
    },

    {
        path: "view($start, $length)",
        input: [1, 2, 3, 4, 5],
        parameters: {start: 2, length: 2},
        output: [3, 4]
    },

    {
        path: "a && b",
        input: {a: true, b: true},
        output: true
    },

    {
        path: "a && b",
        input: {a: false, b: true},
        output: false
    },

    {
        path: "a && b",
        input: {a: true, b: false},
        output: false
    },

    {
        path: "a && b",
        input: {a: false, b: false},
        output: false
    },

    {
        path: "a || b",
        input: {a: true, b: true},
        output: true
    },

    {
        path: "a || b",
        input: {a: false, b: true},
        output: true
    },

    {
        path: "a || b",
        input: {a: true, b: false},
        output: true
    },

    {
        path: "a || b",
        input: {a: false, b: false},
        output: false
    },

    {
        path: ".*",
        input: [1, 2, 3],
        output: [1, 2, 3]
    },

    {
        path: "()[*]",
        input: [1, 2, 3],
        output: [1, 2, 3]
    }

];
