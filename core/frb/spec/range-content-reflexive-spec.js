
var Bindings = require("../bindings");

Error.stackTraceLimit = Infinity;

describe("as array bindings", function () {

    it("should propagate an array even with falsy source", function () {
        var object = Bindings.defineBindings({
        }, {
            foo: {"<-": "bar.asArray()"}
        });
        expect(object.foo).toEqual([]);
    });

});

describe("one way range content bindings", function () {

    it("should propagate", function () {
        var object = Bindings.defineBindings({
            yang: ['a', 'b', 'c']
        }, {
            yin: {"<-": "yang.rangeContent()"}
        });
        expect(object.yin).toEqual(['a', 'b', 'c']);
    });

    it("should propagate array to left from falsy source", function () {
        var object = Bindings.defineBindings({
        }, {
            "foo.rangeContent()": {"<-": "bar.rangeContent()"}
        });
        expect(object.foo).toEqual([]);
        expect(object.foo).not.toBe(object.bar);
    });

});

describe("two way bindings with range content on both sides", function () {

    it("should propagate array to left from falsy source", function () {
        var object = Bindings.defineBindings({
        }, {
            "foo.rangeContent()": {"<-": "bar.rangeContent()"}
        });
        expect(object.foo).toEqual([]);
        expect(object.foo).not.toBe(object.bar);
    });

    it("should propagate array to right from falsy source", function () {
        var object = Bindings.defineBindings({
        }, {
            "foo.rangeContent()": {"<->": "bar.rangeContent()"}
        });
        expect(object.bar.slice()).toEqual([]);
        expect(object.bar).not.toBe(object.foo);
    });

    it("should propagate content change from left to right", function () {
        var object = Bindings.defineBindings({
        }, {
            "foo.rangeContent()": {"<->": "bar.rangeContent()"}
        });
        object.foo.push(1);
        expect(object.bar.slice()).toEqual([1]);
    });

    it("should propagate content change from left to right", function () {
        var object = Bindings.defineBindings({
            foo: [],
            bar: []
        }, {
            "foo.rangeContent()": {"<->": "bar.rangeContent()"}
        });
        object.foo.push(1);
        expect(object.bar.slice()).toEqual([1]);
    });

    it("should propagate content change from right to left", function () {
        var object = Bindings.defineBindings({
            bar: []
        }, {
            "foo.rangeContent()": {"<-": "bar.rangeContent()"}
        });
        object.bar.push(1);
        expect(object.foo.slice()).toEqual([1]);
    });

    it("right to left should propagate on assignment", function () {

        var object = Bindings.defineBindings({
        }, {
            "yin.rangeContent()": {"<->": "yang.rangeContent()"}
        });

        object.yang = [1];
        expect(object.yin).toEqual([1]);

    });

    // FIXME
    xit("left to right should propagate on assignment", function () {

        var object = Bindings.defineBindings({
        }, {
            "yin.rangeContent()": {"<->": "yang.rangeContent()"}
        });

        object.yin = [1];
        expect(object.yang.slice()).toEqual([1]);

    });

    // FIXME
    xit("left to right should propagate on assignment overriding initial value", function () {

        var object = Bindings.defineBindings({
            yin: []
        }, {
            "yin.rangeContent()": {"<->": "yang.rangeContent()"}
        });

        object.yin = [1];
        expect(object.yang.slice()).toEqual([1]);

    });

    // FIXME
    xit("left to right should propagate on assignment overriding initial values on both sides", function () {

        var object = Bindings.defineBindings({
            yin: [],
            yang: []
        }, {
            "yin.rangeContent()": {"<->": "yang.rangeContent()"}
        });

        object.yin = [1];
        expect(object.yang.slice()).toEqual([1]);

    });

    it("range content changes should propagate left to right", function () {

        var object = Bindings.defineBindings({
            yin: [],
            yang: []
        }, {
            "yin.rangeContent()": {"<->": "yang.rangeContent()"}
        });

        object.yin.push(1);
        expect(object.yang.slice()).toEqual([1]);

    });

    it("range content changes should propagate right to left", function () {

        var object = Bindings.defineBindings({
            yin: [],
            yang: []
        }, {
            "yin.rangeContent()": {"<->": "yang.rangeContent()"}
        });

        object.yang.push(1);
        expect(object.yin.slice()).toEqual([1]);
    });

    it("right to left should precede left to right", function () {

        var object = Bindings.defineBindings({
            yin: [],
            yang: [1, 2, 3]
        }, {
            "yin.rangeContent()": {"<->": "yang.rangeContent()"}
        });

        expect(object.yin.slice()).toEqual([1, 2, 3]);

        object.yang = ['a', 'b', 'c'];
        expect(object.yin.slice()).toEqual(['a', 'b', 'c']);

    });

});

