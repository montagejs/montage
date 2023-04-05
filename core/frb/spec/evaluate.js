
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
        document: {
            getElementById: function (id) {
                return id;
            }
        },
        output: "id"
    },

    {
        path: "#id.value",
        document: {
            getElementById: function (id) {
                return {value: id};
            }
        },
        output: "id"
    },

    {
        path: "@label",
        components: {
            getObjectByLabel: function (label) {
                return label;
            }
        },
        output: "label"
    },

    {
        path: "@label.value",
        components: {
            getObjectByLabel: function (label) {
                return {value: label};
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
        path: "{a: get(0), b: get(1)}",
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
        path: "array.some{== 'a'}",
        input: {array: ['a', 'b', 'c']},
        output: true
    },

    {
        path: "array.some{== 'a'}",
        input: {array: ['b', 'c', 'd']},
        output: false
    },

    {
        path: "array.every{> 0}",
        input: {array: [1, 2, 3]},
        output: true
    },

    {
        path: "array.every{> 0}",
        input: {array: [0, 1, 2, 3]},
        output: false
    },

    {
        path: "sorted{foo}.map{foo}.reversed()",
        input: [{foo: 3}, {foo: 1}, {foo: 2}],
        output: [3, 2, 1]
    },

    {
        path: "sortedSet{foo}.map{foo}.reversed()",
        input: [{foo: 3}, {foo: 1}, {foo: 1}, {foo: 2}],
        output: [3, 2, 1]
    },

    {
        path: "group{score}",
        input: [{score: 1, name: "Josh"}, {score: 1, name: "Ben"}, {score: 2, name: "Alice"}],
        output: [
            [1, [{score: 1, name: "Josh"}, {score: 1, name: "Ben"}]],
            [2, [{score: 2, name: "Alice"}]]
        ]
    },

    {
        path: "groupMap{score}.items()",
        input: [{score: 1, name: "Josh"}, {score: 1, name: "Ben"}, {score: 2, name: "Alice"}],
        output: [
            [1, [{score: 1, name: "Josh"}, {score: 1, name: "Ben"}]],
            [2, [{score: 2, name: "Alice"}]]
        ]
    },

    {
        path: "max{x}",
        input: [{x: 0}, {x: 2}, {x: 1}],
        output: {x: 2}
    },

    {
        path: "min{x}",
        input: [{x: 0}, {x: 2}, {x: 1}],
        output: {x: 0}
    },

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
        path: "last()",
        input: [1, 2, 3],
        output: 3
    },

    {
        path: "last()",
        input: [],
        output: null
    },

    {
        path: "flatten()",
        input: [[1], [2, 3], [4]],
        output: [1, 2, 3, 4]
    },

    {
        path: "&concat([1, 2, 3], [4, 5, 6])",
        output: [1, 2, 3, 4, 5, 6]
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
        path: "rangeContent()",
        input: [1, 2, 3],
        output: [1, 2, 3]
    },

    {
        path: "mapContent()",
        input: [1, 2, 3],
        output: [1, 2, 3]
    },

    {
        path: "? 1 : 2",
        input: true,
        output: 1
    },

    {
        path: "? 1 : 2",
        input: false,
        output: 2
    },

    {
        path: "x ?? 10",
        input: {x: 20},
        output: 20
    },

    {
        path: "x ?? 10",
        input: {x: null},
        output: 10
    },

    {
        path: "x ?? 10",
        input: {x: undefined},
        output: 10
    },

    {
        path: "x ?? 10",
        input: null,
        output: 10
    },

    {
        path: "x ?? 10",
        input: undefined,
        output: 10
    },

    {
        path: "x ?? y",
        input: {y: 20},
        output: 20
    },

    {
        path: "x ?? y ?? 10",
        input: {y: 20},
        output: 20
    },

    {
        path: "x.defined()",
        input: null,
        output: false
    },

    {
        path: "x.defined()",
        input: {x: 10},
        output: true
    },

    {
        path: "x.defined()",
        input: {x: undefined},
        output: false
    },

    {
        path: "x.defined() && x",
        input: {x: null},
        output: false
    },

    {
        path: "x.defined() && x",
        input: {x: false},
        output: false
    },

    {
        path: "x.defined() && x",
        input: {x: true},
        output: true
    },

    {
        path: "!x",
        input: null,
        output: true
    },

    {
        path: "!!x",
        input: null,
        output: false
    },

    {
        path: "&range(())",
        input: 3,
        output: [0, 1, 2]
    },

    {
        path: "3.range()",
        input: null,
        output: [0, 1, 2]
    },

    {
        path: "x.startsWith(y)",
        input: {
            x: "|.!",
            y: "|."
        },
        output: true
    },

    {
        path: "x.startsWith(y)",
        input: {
            x: "|.!",
            y: ".!"
        },
        output: false
    },

    {
        path: "x.startsWith(y)",
        input: {
            x: undefined,
            y: undefined
        },
        output: undefined
    },

    {
        path: "x.startsWith(y)",
        input: {
            x: "",
            y: undefined
        },
        output: undefined
    },

    {
        path: "x.startsWith(y)",
        input: {
            x: undefined,
            y: ""
        },
        output: undefined
    },

    {
        path: "x.endsWith(y)",
        input: {
            x: "|.!",
            y: "|.!"
        },
        output: true
    },

    {
        path: "x.endsWith(y)",
        input: {
            x: "|.!",
            y: "|."
        },
        output: false
    },

    {
        path: "x.endsWith(y)",
        input: {
            x: undefined,
            y: undefined
        },
        output: undefined
    },

    {
        path: "x.endsWith(y)",
        input: {
            x: "",
            y: undefined
        },
        output: undefined
    },

    {
        path: "x.endsWith(y)",
        input: {
            x: undefined,
            y: ""
        },
        output: undefined
    },

    {
        path: "x.contains(y)",
        input: {
            x: undefined,
            y: undefined
        },
        output: undefined
    },

    {
        path: "x.contains(y)",
        input: {
            x: "",
            y: undefined
        },
        output: undefined
    },

    {
        path: "x.contains(y)",
        input: {
            x: undefined,
            y: ""
        },
        output: undefined
    },

    {
        path: "&contains(x, y)",
        input: {
            x: "?!^*",
            y: "^"
        },
        output: true
    },

    {
        path: "join()",
        input: ['a', 'b', 'c'],
        output: 'abc'
    },

    {
        path: "join()",
        input: null,
        output: undefined
    },

    {
        path: "split()",
        input: "abc",
        output: ['a', 'b', 'c']
    },

    {
        path: "split(', ')",
        input: "a, b, c",
        output: ['a', 'b', 'c']
    },

    {
        path: "split()",
        input: null,
        output: undefined
    },

    {
        path: "toString()",
        input: "Hello, World!",
        output: "Hello, World!"
    },

    {
        path: "toString()",
        input: 10,
        output: "10"
    },

    {
        path: "toString()",
        input: null,
        output: null
    },

    {
        path: "toString()",
        input: {a: 10},
        output: null
    },

    {
        path: "toMap().entriesArray()",
        input: {a: 10, b: 20},
        output: [['a', 10], ['b', 20]]
    },

    {
        path: "toMap().entriesArray()",
        input: [['a', 10], ['b', 20]],
        output: [['a', 10], ['b', 20]]
    },

    {
        path: "toMap().toMap().entriesArray()",
        input: {a: 10, b: 20},
        output: [['a', 10], ['b', 20]]
    },

    {
        path: "1 <=> 2",
        input: null,
        output: -1
    },

    {
        path: "3 <=> 1",
        input: null,
        output: 2
    },

    {
        path: "2 <=> 2",
        input: null,
        output: 0
    },

    {
        path: "path('')",
        input: 1,
        output: 1
    },

    {
        path: "path(path)",
        input: {x: 2, y: 3, path: "x + y"},
        output: 5
    },

    {
        path: "foo.path($path)",
        input: {foo: {a: 10}},
        parameters: {path: "a"},
        output: 10
    },

    {
        path: "path('(]')",
        input: "i should not be",
        output: void 0
    },

    {
        path: "path(())",
        input: "(]",
        output: void 0
    },

    {
        path: "path(())",
        input: "(",
        output: void 0
    },

    {
        path: "property(property)",
        input: {
            a: 10,
            property: "a"
        },
        output: 10
    },

    {
        path: "path(path)",
        input: {
            a: {b: 10},
            path: "a.b"
        },
        output: 10
    },

    {
        path: "borks('borkish')",
        input: {
            borks: function (borky) {
                return borky == "borkish";
            }
        },
        output: true
    },

    {
        path: "isAdmin ? 'admin' : 'user'",
        input: {},
        output: undefined
    },

    {
        path: "isAdmin ? 'admin' : 'user'",
        input: {isAdmin: true},
        output: 'admin'
    },

    {
        path: "isAdmin ? 'admin' : 'user'",
        input: {isAdmin: false},
        output: 'user'
    }

];
