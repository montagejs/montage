var observe = require("../observe");

describe("observe", function () {

    it("should observe a property", function () {
        var spy = jasmine.createSpy();
        var object = {};

        var cancel = observe(object, "a", spy);
        expect(spy.argsForCall).toEqual([]);

        object.a = 10;
        expect(spy.argsForCall).toEqual([
            [10, 'a', object]
        ]);

        cancel();
        object.a = 20;
        expect(spy.argsForCall).toEqual([
            [10, 'a', object]
        ]);

    });

    it("should observe a property before it changes", function () {
        var spy = jasmine.createSpy();
        var object = {};
        var cancel = observe(object, 'a', {
            change: function (value) {
                expect(value).toBe(10);
                spy();
            },
            beforeChange: true
        });
        object.a = 10;
        object.a = 20;
        expect(spy).toHaveBeenCalled();
    });

    it("should observe incremental changes", function () {
        var spy = jasmine.createSpy();
        var object = {};
        var cancel = observe(object, 'array', {
            change: function (array) {
                spy(array.slice());
            },
            contentChange: true
        });
        object.array = [];
        object.array.push(10);
        object.array.pop();
        object.array = [];
        cancel();
        object.array = [10];
        expect(spy.argsForCall).toEqual([
            [[]],
            [[10]],
            [[]],
            [[]]
        ]);
    });

    it("should observe content changes", function () {
        var spy = jasmine.createSpy();
        var object = {};
        var cancel = observe(object, 'array', {
            contentChange: function (plus, minus, index) {
                spy(plus, minus, index);
            },
        });
        object.array = [];
        object.array.push(10);
        object.array.pop();
        object.array = [];
        cancel();
        object.array = [10];
        expect(spy.argsForCall).toEqual([
            //[[], [], 0],
            [[10], [], 0],
            [[], [10], 0]
            //[[]]
        ]);
    });

    it("should pass content-less values through content-change-observer", function () {
        var spy = jasmine.createSpy();
        var object = {};
        var cancel = observe(object, 'array', {
            change: function (array) {
                spy(array);
            },
            contentChange: true
        });
        object.array = 10;
        expect(spy.argsForCall).toEqual([
            [10]
        ]);
    });

    it("should observe a range property before its content changes", function () {
        var spy = jasmine.createSpy();
        var originalArray = [10];
        var object = {
            a: originalArray
        };

        observe(object, 'a', {
            change: function (value) {
                expect(value).toBe(originalArray);
                expect(value.length).toBe(1);
                spy();
            },
            beforeChange: true,
            contentChange: true
        });

        originalArray.push(20);

        expect(spy).toHaveBeenCalled();
    });

    it("should observe a range property after its content changes", function () {
        var spy = jasmine.createSpy();
        var originalArray = [10];
        var object = {
            a: originalArray
        };

        observe(object, 'a', {
            change: spy,
            contentChange: true
        });

        originalArray.push(20);

        var updatedArray = spy.mostRecentCall.args[0];
        expect(updatedArray).toEqual(originalArray);
        expect(updatedArray.length).toBe(2);

    });
});
