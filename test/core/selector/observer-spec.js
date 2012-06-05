
var Selector = require("montage/core/selector").Selector;
var Promise = require("montage/core/promise").Promise;
var PropertyLanguage = require("montage/core/selector/property-language").PropertyLanguage;
var ObserverSemantics = require("montage/core/selector/observer-semantics").ObserverSemantics;

describe('core/selector/observer-spec', function () {

    var tests = [

        {
            selector: Selector(10),
            values: [
                10
            ]
        },

        {
            selector: Selector.value,
            values: [
                void 0
            ]
        },

        {
            selector: Selector.property('a'),
            object: {a: 10},
            test: function (object, parameters, cancel) {
                object.a = 20;
                cancel();
                object.a = 10;
            },
            values: [
                10,
                20
            ]
        },

        {
            selector: Selector.true,
            values: [
                true
            ]
        },

        {
            selector: Selector.false,
            values: [
                false
            ]
        },

        {
            selector: Selector.equals(10),
            object: 10,
            values: [
                true
            ]
        },

        {
            selector: Selector.property('a').equals(10),
            object: {a: 10},
            test: function (object, parameters, cancel) {
                object.a = 20;
                cancel();
                object.a = 10;
            },
            values: [
                true,
                false
            ]
        },

        {
            selector: Selector.not.value,
            object: false,
            values: [true]
        },

        {
            selector: Selector.parameter('a'),
            parameters: {a: 10},
            test: function (object, parameters, cancel) {
                parameters.a = 20;
                cancel();
                parameters.a = 10;
            },
            values: [
                10,
                20
            ]
        },

        {
            selector: Selector.equals.parameter('a'),
            object: 10,
            parameters: {a: 10},
            test: function (object, parameters, cancel) {
                parameters.a = 20;
                cancel();
                parameters.a = 10;
            },
            values: [
                true,
                false
            ]
        },

        {
            selector: "sum()",
            object: [1, 2, 3],
            test: function (object, parameters, cancel) {
                object.push(4);
                object.pop();
                cancel();
                object.push(4);
            },
            values: [
                6,
                10,
                6
            ]
        },

        {
            selector: "array.sum()",
            object: {array: [1, 2, 3]},
            test: function (object, parameters, cancel) {
                object.array.push(4);
                object.array = [];
                object.array = [1, 2, 3];
                cancel();
                object.array = [];
            },
            values: [
                6,
                10,
                10, // XXX why?
                0,
                6
            ]
        },

        {
            selector: "(a,b).sum()",
            object: {
                a: 10,
                b: 20
            },
            test: function (object, parameters, cancel) {
                object.a = 20;
                cancel();
                object.b = 10;
            },
            values: [30, 40]
        },

        {
            selector: "sum(a)",
            object: [
                {a: 10},
                {a: 20},
                {a: 30}
            ],
            test: function (object, parameters, cancel) {
                // 60
                object.push({a: 40}); // + 40 = 100
                object[0].a = 0; // - 10 = 90
                var last = object.pop(); // - 40 = 50
                cancel();
                last.a = 0;
                object[0].a = 10;
                object.push({a: 20});
            },
            values: [
                60,
                100,
                90,
                50
            ]
        },

        {
            selector: "map(sum())",
            object: [
                [1, 2, 3],
                [10, 20, 30],
                [100, 200, 300]
            ],
            test: function (object, parameters, cancel) {
                object.pop();
                object[0].push(4);
                object[0].pop();
                object[0].pop();
            },
            values: [
                [6, 60, 600],
                [6, 60],
                [10, 60],
                [6, 60],
                [3, 60]
            ]
        },

        {
            selector: "map(any())",
            object: [
                [false, false, false, false],
                [false, true, false, true],
                [true, true, true, true]
            ],
            test: function (object, parameters, cancel) {
                object.push([]);
                object[0].setProperty(0, 1);
                object[1].setProperty(1, 0);
                object[1].setProperty(3, 0);
                cancel();
                object.pop();
                object[0].pop();
            },
            values: [
                [false, true, true],
                [false, true, true, false],
                [true, true, true, false],
                [true, true, true, false],
                [true, false, true, false]
            ]
        },

        {
            selector: Selector.if.property('x').then('a').else('b'),
            object: {x: true},
            test: function (object, parameters, cancel) {
                object.x = false;
                object.x = true;
                cancel();
                object.x = false;
            },
            values: [
                'a',
                'b',
                'a'
            ]
        }
    ];

    tests.forEach(function (test) {
        var representation;
        if (typeof test.selector === "string") {
            representation = test.selector;
            describe(representation, function () {
                it("can be compiled", function () {
                    test.selector = Selector.property(test.selector);
                });
            })
        } else {
            representation = test.selector.representation();
        }
        describe(representation, function () {
            it('can be observed and canceled', function () {
                var spy = jasmine.createSpy();
                var cancel = test.selector.observe(
                    test.object,
                    spy,
                    null,
                    test.parameters
                );
                if (test.test) {
                    test.test(test.object, test.parameters, cancel);
                }
                expect(spy.argsForCall.map(function (args) {
                    return args[0];
                })).toEqual(test.values);
            });
        });
    })

    describe("observe a promise", function () {
        it("should forward in a future turn", function () {
            var observed = Promise.defer();
            var postponed = Promise.defer();
            setTimeout(function () {
                postponed.resolve(10);
            }, 100);
            Selector.value.observe(postponed.promise, function (value) {
                expect(value).toEqual(10);
                observed.resolve();
            });
            return observed.promise.timeout(500);
        });
    });

});

