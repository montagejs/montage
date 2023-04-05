var Bindings = require("../bindings");

describe("view", function () {
    var object;
    beforeEach(function () {
        object = {
            array: [2, 4, 6, 8]
        };
    });

    it("updates", function () {
        Bindings.defineBindings(object, {
            view: {"<-": "array.view(1, 2)"}
        });

        expect(object.view).toEqual([4, 6]);
        object.array.splice(1, 1);
        expect(object.view).toEqual([6, 8]);
    });

    it("accepts 0 for the start", function () {
        Bindings.defineBindings(object, {
            view: {"<-": "array.view(0, 2)"}
        });

        expect(object.view).toEqual([2, 4]);
    });

    it("accepts a length longer than the array", function () {
        Bindings.defineBindings(object, {
            view: {"<-": "array.view(2, 3)"}
        });

        expect(object.view).toEqual([6, 8]);
        object.array.push(10);
        expect(object.view).toEqual([6, 8, 10]);
        object.array.push(12);
        expect(object.view).toEqual([6, 8, 10]);
    });

    it("start defaults to zero", function () {
        Bindings.defineBindings(object, {
            view: {"<-": "array.view(length)"}
        });

        object.length = 3;
        expect(object.view).toEqual([2, 4, 6]);
        object.array.splice(2, object.array.length - 2);
        expect(object.view).toEqual([2, 4]);
        object.array.unshift(0);
        expect(object.view).toEqual([0, 2, 4]);
        object.array.splice(2, 0, 3);
        object.array.splice(1, 0, 1);
        object.length += 1;
        expect(object.view).toEqual([0, 1, 2, 3]);
    });

});

