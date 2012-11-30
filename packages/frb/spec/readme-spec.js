
var Bindings = require("../bindings");
var bind = require("../bind");
var observe = require("../observe");
var Frb = require("..");

Error.stackTraceLimit = 100;

describe("Tutorial", function () {

    it("Introduction", function () {
        // mock
        var document = {body: {innerHTML: ""}};

        // example starts here
        var model = {content: "Hello, World!"};
        var cancelBinding = bind(document, "body.innerHTML", {
            "<-": "content",
            "source": model
        });

        // continued
        model.content = "Farewell.";
        expect(document.body.innerHTML).toBe("Farewell.");

        // continued
        cancelBinding();
        model.content = "Hello again!"; // doesn't take
        expect(document.body.innerHTML).toBe("Farewell.");
    });

    it("Two-way Bindings", function () {
        // exapmle begins here

        var object = {};
        var cancel = bind(object, "foo", {
            "<->": "bar"
        });

        // <-
        object.bar = 10;
        expect(object.foo).toBe(10);

        // ->
        object.foo = 20;
        expect(object.bar).toBe(20);
    });

    it("Right-to-left", function () {
        var object = {foo: 10, bar: 20};
        var cancel = bind(object, "foo", {
            "<->": "bar"
        });
        expect(object.foo).toBe(20);
        expect(object.bar).toBe(20);
    });

    it("Property chains", function () {
        var foo = {a: {b: 10}};
        var bar = {a: {b: 10}};
        var cancel = bind(foo, "a.b", {
            "<->": "a.b",
            source: bar
        });
        // <-
        bar.a.b = 20;
        expect(foo.a.b).toBe(20);
        // ->
        foo.a.b = 30;
        expect(bar.a.b).toBe(30);

    // "Structure changes"
        var a = foo.a;
        expect(a.b).toBe(30); // from before

        //foo.a = {b: 40}; // orphan a and replace
        foo.a = {}; // orphan
        foo.a.b = 40; // replace
        // ->
        expect(bar.a.b).toBe(40); // updated

        bar.a.b = 50;
        // <-
        expect(foo.a.b).toBe(50); // new one updated
        expect(a.b).toBe(30); // from before it was orphaned
    });

    it("Sum", function () {
        var object = {array: [1, 2, 3]};
        bind(object, "sum", {"<-": "array.sum()"});
        expect(object.sum).toEqual(6);
    });

    it("Average", function () {
        var object = {array: [1, 2, 3]};
        bind(object, "average", {"<-": "array.average()"});
        expect(object.average).toEqual(2);
    });

    it("Map", function () {
        var object = {objects: [
            {number: 10},
            {number: 20},
            {number: 30}
        ]};
        bind(object, "numbers", {"<-": "objects.map{number}"});
        expect(object.numbers).toEqual([10, 20, 30]);
        object.objects.push({number: 40});
        expect(object.numbers).toEqual([10, 20, 30, 40]);
    });

    it("Filter", function () {
        var object = {numbers: [1, 2, 3, 4, 5, 6]};
        bind(object, "evens", {"<-": "numbers.filter{!(%2)}"});
        expect(object.evens).toEqual([2, 4, 6]);
        object.numbers.push(7, 8);
        object.numbers.shift();
        object.numbers.shift();
        expect(object.evens).toEqual([4, 6, 8]);
    });

    it("Some", function () {
        var object = Bindings.defineBindings({
            options: [
                {checked: true},
                {checked: false},
                {checked: false}
            ]
        }, {
            anyChecked: {
                "<-": "options.some{checked}"
            }
        });
        expect(object.anyChecked).toBe(true);
    });

    it("Every", function () {
        var object = Bindings.defineBindings({
            options: [
                {checked: true},
                {checked: false},
                {checked: false}
            ]
        }, {
            allChecked: {
                "<-": "options.every{checked}"
            }
        });
        expect(object.allChecked).toBe(false);
    });

    it("Sorted", function () {
        var object = {numbers: [5, 2, 7, 3, 8, 1, 6, 4]};
        bind(object, "sorted", {"<-": "numbers.sorted{}"});
        expect(object.sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it("Sorted (by property)", function () {
        var object = {arrays: [[1, 2, 3], [1, 2], [], [1, 2, 3, 4], [1]]};
        bind(object, "sorted", {"<-": "arrays.sorted{-length}"});
        expect(object.sorted.map(function (array) {
            return array.slice(); // to clone
        })).toEqual([
            [1, 2, 3, 4],
            [1, 2, 3],
            [1, 2],
            [1],
            []
        ]);

        // Continued...
        object.arrays[0].push(4, 5);
        expect(object.sorted.map(function (array) {
            return array.slice(); // to clone
        })).toEqual([
            [1, 2, 3, 4, 5], // new
            [1, 2, 3, 4],
            // old
            [1, 2],
            [1],
            []
        ]);
    });

    it("View", function () {
        var SortedSet = require("collections/sorted-set");
        var controller = {
            index: SortedSet([1, 2, 3, 4, 5, 6, 7, 8]),
            start: 2,
            length: 4
        };
        var cancel = bind(controller, "view", {
            "<-": "index.view(start, length)"
        });

        expect(controller.view).toEqual([3, 4, 5, 6]);

        // change the window length
        controller.length = 3;
        expect(controller.view).toEqual([3, 4, 5]);

        // change the window position
        controller.start = 5;
        expect(controller.view).toEqual([6, 7, 8]);

        // add content behind the window
        controller.index.add(0);
        expect(controller.view).toEqual([5, 6, 7]);
    });

    it("Enumerate", function () {
        var object = {letters: ['a', 'b', 'c', 'd']};
        bind(object, "lettersAtEvenIndicies", {
            "<-": "letters.enumerate().filter{!(.0 % 2)}.map{.1}"
        });
        expect(object.lettersAtEvenIndicies).toEqual(['a', 'c']);
        object.letters.shift();
        expect(object.lettersAtEvenIndicies).toEqual(['b', 'd']);
    });

    it("Flatten", function () {
        var arrays = [[1, 2, 3], [4, 5, 6]];
        var object = {};
        bind(object, "flat", {
            "<-": "flatten()",
            source: arrays
        });
        expect(object.flat).toEqual([1, 2, 3, 4, 5, 6]);

        // Continued...
        arrays.push([7, 8, 9]);
        arrays[0].unshift(0);
        expect(object.flat).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

        // Continued...
        var flat = object.flat;
        arrays.splice(0, arrays.length);
        expect(object.flat).toBe(flat); // === same object
    });

    it("Reversed", function () {
        var object = {forward: [1, 2, 3]};
        bind(object, "backward", {
            "<->": "forward.reversed()"
        });
        expect(object.backward.slice()).toEqual([3, 2, 1]);
        object.forward.push(4);
        expect(object.forward.slice()).toEqual([1, 2, 3, 4]);
        expect(object.backward.slice()).toEqual([4, 3, 2, 1]);

        // Continued...
        object.backward.pop();
        expect(object.backward.slice()).toEqual([4, 3, 2]);
        expect(object.forward.slice()).toEqual([2, 3, 4]);
    });

    it("Has", function () {
        var object = {
            haystack: [1, 2, 3],
            needle: 3
        };
        bind(object, "hasNeedle", {"<-": "haystack.has(needle)"});
        expect(object.hasNeedle).toBe(true);
        object.haystack.pop(); // 3 comes off
        expect(object.hasNeedle).toBe(false);

        // Continued from above...
        object.needle = 2;
        expect(object.hasNeedle).toBe(true);

        // Continued from above...
        var Set = require("collections/set");
        object.haystack = new Set([1, 2, 3]);
        expect(object.hasNeedle).toBe(true);
    });

    it("Has (DOM)", function () {
        // mock
        var document = {body: {classList: []}};

        // example begins here
        var model = {darkMode: false};
        bind(document.body, "classList.has('dark')", {
            "<-": "darkMode",
            source: model
        });
    });

    it("Get", function () {
        var object = {
            array: [1, 2, 3],
            second: null
        };
        var cancel = bind(object, "second", {
            "<->": "array[1]"
        });
        expect(object.array.slice()).toEqual([1, 2, 3]);
        expect(object.second).toBe(2);

        object.array.shift();
        expect(object.array.slice()).toEqual([2, 3]);
        expect(object.second).toBe(3);

        object.second = 4;
        expect(object.array.slice()).toEqual([2, 4]);

        cancel();
        object.array.shift();
        expect(object.second).toBe(4); // still
    });

    it("Get (Map)", function () {
        var Map = require("collections/map");
        var a = {id: 0}, b = {id: 1};
        var object = {
            source: Map([[a, 10], [b, 20]]),
            key: null,
            selected: null
        };

        var cancel = bind(object, "selected", {
            "<-": "source[key]"
        });
        expect(object.selected).toBe(undefined);

        object.key = a;
        expect(object.selected).toBe(10);

        object.key = b;
        expect(object.selected).toBe(20);

        object.source.set(b, 30);
        expect(object.selected).toBe(30);

        var SortedMap = require("collections/sorted-map");
        object.source = SortedMap();
        expect(object.selected).toBe(undefined);

        object.source.set(b, 40);
        expect(object.selected).toBe(40);

        cancel();
        object.key = a; // no effect
        expect(object.selected).toBe(40);
    });

    it("Get (all content)", function () {
        var Map = require("collections/map");
        var object = {
            a: Map({a: 10}),
            b: Map()
        };
        var cancel = bind(object, "a[*]", {"<->": "b[*]"});
        expect(object.a.toObject()).toEqual({});
        expect(object.b.toObject()).toEqual({});

        object.a.set('a', 10);
        expect(object.a.toObject()).toEqual({a: 10});
        expect(object.b.toObject()).toEqual({a: 10});

        object.b.set('b', 20);
        expect(object.a.toObject()).toEqual({a: 10, b: 20});
        expect(object.b.toObject()).toEqual({a: 10, b: 20});
    });

    it("Array Content", function () {
        var object = {
            array: [1, 2, 3]
        };
        Bindings.defineBindings(object, {
            first: {"<-": "array.0"},
            second: {"<-": "array[1]"}
        });
        expect(object.first).toBe(1);
        expect(object.second).toBe(2);

        // ...continued
        var array = [1, 2, 3];
        var object = {};
        Bindings.defineBindings(object, {
            first: {
                "<-": ".0",
                source: array
            },
            second: {
                "<-": "()[1]",
                source: array
            }
        });
        expect(object.first).toBe(1);
        expect(object.second).toBe(2);

        // ... continued
        var object = {
            array: [1, 2, 3],
            index: 0
        };
        Bindings.defineBinding(object, "last", {
            "<-": "array[array.length - 1]"
        });
        expect(object.last).toBe(3);

        object.array.pop();
        expect(object.last).toBe(2);

        // ... continued
        var SortedSet = require("collections/sorted-set");
        var object = {
            set: SortedSet(),
            array: []
        };
        Bindings.defineBindings(object, {
            "array.*": {"<-": "set"}
        });
        object.set.addEach([5, 2, 6, 1, 4, 3]);
        expect(object.array).toEqual([1, 2, 3, 4, 5, 6]);

        // ... continued
        var Map = require("collections/map");
        var object = {
            map: Map(),
            array: []
        };
        Bindings.defineBinding(object, "map[*]", {
            "<-": "array"
        });
        object.array.push(1, 2, 3);
        expect(object.map.toObject()).toEqual({
            0: 1,
            1: 2,
            2: 3
        });
    });

    it("Equals", function () {
        var fruit = {apples: 1, oranges: 2};
        bind(fruit, "equal", {"<-": "apples == oranges"});
        expect(fruit.equal).toBe(false);
        fruit.oranges = 1;
        expect(fruit.equal).toBe(true);
    });

    it("Equals (Model)", function () {
        var component = {
            orangeElement: {checked: false},
            appleElement: {checked: true}
        };
        Bindings.defineBindings(component, {
            "orangeElement.checked": {"<->": "fruit = 'orange'"},
            "appleElement.checked": {"<->": "fruit = 'apple'"},
        });

        component.orangeElement.checked = true;
        expect(component.fruit).toEqual("orange");

        component.appleElement.checked = true;
        expect(component.fruit).toEqual("apple");
    });

    // No tests for Value section

    it("With", function () {
        var object = {
            context: {a: 10, b: 20}
        };
        Bindings.defineBinding(object, "sum", {
            "<-": "context.(a + b)"
        });
        expect(object.sum).toBe(30);

        Bindings.cancelBinding(object, "sum");
        object.context.a = 20;
        expect(object.sum).toBe(30); // unchanged
    });

    it("With (tuple)", function () {
        var object = {
            context: {a: 10, b: 20}
        };
        Bindings.defineBindings(object, {
            "duple": {"<-": "context.[a, b]"},
            "pair": {"<-": "context.{key: a, value: b}"}
        });
        expect(object.duple).toEqual([10, 20]);
        expect(object.pair).toEqual({key: 10, value: 20});

        Bindings.cancelBindings(object);
    });

    it("Operators", function () {
        var object = {height: 10};
        bind(object, "heightPx", {"<-": "height + 'px'"});
        expect(object.heightPx).toEqual("10px");

        // ... continued
        var object = {
            number: null,
            string: null,
        };
        Bindings.defineBinding(object, "+number", {
            "<-": "string"
        });
        object.string = '10';
        expect(object.number).toBe(10);
    });

    it("Algebra", function () {
        var caesar = {toBe: false};
        bind(caesar, "notToBe", {"<->": "!toBe"});
        expect(caesar.toBe).toEqual(false);
        expect(caesar.notToBe).toEqual(true);

        caesar.notToBe = false;
        expect(caesar.toBe).toEqual(true);
    });

    it("Literals", function () {
        var object = {};
        bind(object, "greeting", {"<-": "'Hello, World!'"});
        expect(object.greeting).toBe("Hello, World!");

        // Continued from above...
        bind(object, 'four', {"<-": "2 + 2"});
    });

    it("Tuples", function () {
        var object = {array: [[1, 2, 3], [4, 5]]};
        bind(object, "summary", {"<-": "array.map{[length, sum()]}"});
        expect(object.summary).toEqual([
            [3, 6],
            [2, 9]
        ]);
    });

    it("Records", function () {
        var object = {array: [[1, 2, 3], [4, 5]]};
        bind(object, "summary", {
            "<-": "array.map{{length: length, sum: sum()}}"
        });
        expect(object.summary).toEqual([
            {length: 3, sum: 6},
            {length: 2, sum: 9}
        ]);
    });

    it("Parameters", function () {
        var object = {a: 10, b: 20, c: 30};
        bind(object, "foo", {
            "<-": "[$a, $b, $c]",
            parameters: object
        });
        expect(object.foo).toEqual([10, 20, 30]);
        // continued...
        object.a = 0;
        object.b = 1;
        object.c = 2;
        expect(object.foo).toEqual([0, 1, 2]);
        // continued...
        var object = {};
        bind(object, "ten", {"<-": "$", parameters: 10});
        expect(object.ten).toEqual(10);
    });

    it("Observers", function () {
        var results = [];
        var object = {foo: {bar: 10}};
        var cancel = observe(object, "foo.bar", function (value) {
            results.push(value);
        });

        object.foo.bar = 10;
        expect(results).toEqual([10]);

        object.foo.bar = 20;
        expect(results).toEqual([10, 20]);
    });

    it("Observers (beforeChange)", function () {
        var results = [];
        var object = {foo: {bar: 10}};
        var cancel = observe(object, "foo.bar", {
            change: function (value) {
                results.push(value);
            },
            beforeChange: true
        });

        expect(results).toEqual([10]);

        object.foo.bar = 20;
        expect(results).toEqual([10, 10]);

        object.foo.bar = 30;
        expect(results).toEqual([10, 10, 20]);
    });

    it("Observers (contentChange true)", function () {
        var lastResult;
        var array = [[1, 2, 3], [4, 5, 6]];
        observe(array, "map{sum()}", {
            change: function (sums) {
                lastResult = sums.slice();
                // 1. [6, 15]
                // 2. [6, 15, 0]
                // 3. [10, 15, 0]
            },
            contentChange: true
        });

        expect(lastResult).toEqual([6, 15]);

        array.push([0]);
        expect(lastResult).toEqual([6, 15, 0]);

        array[0].push(4);
        expect(lastResult).toEqual([10, 15, 0]);
    });

    it("Nested Observers", function () {
        var i = 0;
        var array = [[1, 2, 3], [4, 5, 6]];
        var cancel = observe(array, "map{sum()}", function (array) {
            function rangeChange() {
                if (i === 0) {
                    expect(array.slice()).toEqual([6, 15]);
                } else if (i === 1) {
                    expect(array.slice()).toEqual([6, 15, 0]);
                } else if (i === 2) {
                    expect(array.slice()).toEqual([10, 15, 0]);
                }
                i++;
            }
            rangeChange();
            array.addRangeChangeListener(rangeChange);
            return function cancelRangeChange() {
                array.removeRangeChangeListener(rangeChange);
            };
        });
        array.push([0]);
        array[0].push(4);
        cancel();
    });

    it("Nested Observers (property observers)", function () {
        var object = {foo: {bar: 10}};
        var cancel = observe(object, "foo", function (foo) {
            return observe(foo, "bar", function (bar) {
                expect(bar).toBe(10);
            });
        });
    });

    it("Bindings", function () {
        var target = Bindings.defineBindings({}, {
            "fahrenheit": {"<->": "celsius * 1.8 + 32"},
            "celsius": {"<->": "kelvin - 272.15"}
        });
        target.celsius = 0;
        expect(target.fahrenheit).toEqual(32);
        expect(target.kelvin).toEqual(272.15);
    });

    it("Binding Descriptors", function () {
        // mock
        var document = {body: {classList: []}};

        // example begins here
        var object = Bindings.defineBindings({
            darkMode: false,
            document: document
        }, {
            "document.body.classList.has('dark')": {
                "<-": "darkMode"
            }
        });

        // Continued from above...
        var bindings = Bindings.getBindings(object);
        var descriptor = Bindings.getBinding(object, "document.body.classList.has('dark')");
        Bindings.cancelBinding(object, "document.body.classList.has('dark')");
        Bindings.cancelBindings(object);
        expect(Object.keys(bindings)).toEqual([]);
    });

    it("Converters (convert, revert)", function () {
        var object = Bindings.defineBindings({
            a: 10
        }, {
            b: {
                "<->": "a",
                convert: function (a) {
                    return a * 2;
                },
                revert: function (b) {
                    return b / 2;
                }
            }
        });
        expect(object.b).toEqual(20);

        object.b = 10;
        expect(object.a).toEqual(5);
    });

    it("Converters (converter)", function () {
        var object = Bindings.defineBindings({
            a: 10
        }, {
            b: {
                "<->": "a",
                converter: {
                    factor: 2,
                    convert: function (a) {
                        return a * this.factor;
                    },
                    revert: function (b) {
                        return b / this.factor;
                    }
                }
            }
        });
        expect(object.b).toEqual(20);

        object.b = 10;
        expect(object.a).toEqual(5);
    });

    it("Computed Properties", function () {
        // mock
        var window = {location: {}};
        var QS = {stringify: function () {}};

        // example begins here...
        Bindings.defineBindings({
            window: window,
            form: {
                q: "",
                charset: "utf-8"
            }
        }, {
            "queryString": {
                args: ["form.q", "form.charset"],
                compute: function (q, charset) {
                    return "?" + QS.stringify({
                        q: q,
                        charset: charset
                    });
                }
            },
            "window.location.search": {
                "<-": "queryString"
            }
        });
    });

});


describe("declarations", function () {
    it("should work", function () {

        // create an object
        var object = Bindings.defineBindings({ // prototype
            // simple properties
            foo: 0,
            graph: [
                {numbers: [1,2,3]},
                {numbers: [4,5,6]}
            ]
        }, {
            // extended property descriptors
            bar: {"<->": "foo", enumerable: false},
            numbers: {"<-": "graph.map{numbers}.flatten()"},
            sum: {"<-": "numbers.sum()"},
            reversed: {"<-": "numbers.reversed()"}
        });

        expect(object.bar).toEqual(object.foo);
        object.bar = 10;
        expect(object.bar).toEqual(object.foo);
        expect.foo = 20;
        expect(object.bar).toEqual(object.foo);

        // note that the identity of the bound numbers array never
        // changes, because all of the changes to that array are
        // incrementally updated
        var numbers = object.numbers;

        // first computation
        expect(object.sum).toEqual(21);

        // adds an element to graph,
        // which pushes [7, 8, 9] to "graph.map{numbers}",
        // which splices [7, 8, 9] to the end of
        //  "graph.map{numbers}.flatten()",
        // which increments "sum()" by [7, 8, 9].sum()
        object.graph.push({numbers: [7, 8, 9]});
        expect(object.sum).toEqual(45);

        // splices [1] to the beginning of [1, 2, 3],
        // which splices [1] to the beginning of "...flatten()"
        // which increments "sum()" by [1].sum()
        object.graph[0].numbers.unshift(1);
        expect(object.sum).toEqual(46);

        // cancels the entire observer hierarchy, then attaches
        //  listeners to the new one.  updates the sum.
        object.graph = [{numbers: [1,2,3]}];
        expect(object.sum).toEqual(6);

        expect(object.reversed).toEqual([3, 2, 1]);

        expect(object.numbers).toBe(numbers) // still the same object

        Frb.cancelBindings(object); // cancels all bindings on this object and
        // their transitive observers and event listeners as deep as
        // they go

    });
});

describe("Bindings", function () {

    it("Bindings", function () {
        var target = Bindings.defineBindings({}, {
            "fahrenheit": {"<->": "celsius * 1.8 + 32"},
            "celsius": {"<->": "kelvin - 272.15"}
        });
        target.celsius = 0;
        expect(target.fahrenheit).toEqual(32);
        expect(target.kelvin).toEqual(272.15);
    });

    it("Binding Descriptors", function () {
        var document = {body: {classList: []}};

        var object = Bindings.defineBindings({
            darkMode: false,
            document: document
        }, {
            "document.body.classList.has('dark')": {
                "<-": "darkMode"
            }
        });

        // continued
        Bindings.cancelBindings(object);
        expect(Bindings.getBindings(object)).toEqual({});
    });

    it("Converters", function () {
        Bindings.defineBindings({
            a: 10
        }, {
            b: {
                "<-": "a",
                convert: function (a) {
                    return a * 2;
                },
                revert: function (b) {
                    return a / 2;
                }
            }
        });

        // continue
        Bindings.defineBindings({
            a: 10
        }, {
            b: {
                "<-": "a",
                converter: {
                    factor: 2,
                    convert: function (a) {
                        return a * this.factor;
                    },
                    revert: function (b) {
                        return a / this.factor;
                    }
                }
            }
        });
    });

    it("Computed Properties", function () {
        /*
        // preamble
        var window = {location: {search: ""}};

        Bindings.defineBindings({
            window: window,
            form: {
                q: "",
                charset: "utf-8"
            }
        }, {
            queryString: {
                args: ["form.q", "form.charset"],
                compute: function (q, charset) {
                    return "?" + QS.stringify({
                        q: q,
                        charset: charset
                    });
                }
            },
            "window.location.search": {
                "<-": "queryString"
            }
        });
        */
    });

    it("Bind", function () {

        var bind = require("../bind");

        var source = [{numbers: [1,2,3]}, {numbers: [4,5,6]}];
        var target = {};
        var cancel = bind(target, "summary", {
            "<-": "map{[numbers.sum(), numbers.average()]}",
            source: source
        });

        expect(target.summary).toEqual([
            [6, 2],
            [15, 5]
        ]);

        cancel();

    });

    it("Evaluate (compile)", function () {
        var parse = require("../parse");
        var compile = require("../compile-evaluator");

        // example begins here...
        var syntax = parse("a.b");
        var evaluate = compile(syntax);
        var c = evaluate({a: {b: 10}})
        expect(c).toBe(10);
    });

    it("Evaluate", function () {
        var evaluate = require("../evaluate");

        // example begins here...
        var c = evaluate("a.b", {a: {b: 10}})
        expect(c).toBe(10);
    });

    it("Stringify", function () {
        var stringify = require("../stringify");

        // example begins here...
        var syntax = {type: "and", args: [
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "a"}
            ]},
            {type: "property", args: [
                {type: "value"},
                {type: "literal", value: "b"}
            ]}
        ]};

        var path = stringify(syntax);
        expect(path).toBe("a && b");
    });

});

describe("Reference", function () {

    it("Observe", function () {
        var observe = require("../observe");

        // begin
        var source = [1, 2, 3];
        var sum;
        var cancel = observe(source, "sum()", function (newSum) {
            sum = newSum;
        });

        expect(sum).toBe(6);

        source.push(4);
        expect(sum).toBe(10);

        source.unshift(0); // no change
        expect(sum).toBe(10);

        cancel();
        source.splice(0, source.length); // would change
        expect(sum).toBe(10);

    });

    it("Observe (descriptors)", function () {
        var observe = require("../observe");

        // begin
        var object = {};
        var cancel = observe(object, "array", {
            change: function (value) {
                // may return a cancel function for a nested observer
            },
            parameters: {},
            beforeChange: false,
            contentChange: true
        });

        object.array = []; // emits []
        object.array.push(10); // emits [10]
    });

    it("Compute", function () {
        var compute = require("../compute");

        var source = {operands: [10, 20]};
        var target = {};
        var cancel = compute(target, "sum", {
            source: source,
            args: ["operands.0", "operands.1"],
            compute: function (a, b) {
                return a + b;
            }
        });

        expect(target.sum).toEqual(30);

        source.operands.set(1, 30);
        expect(target.sum).toEqual(40);
    });

});

