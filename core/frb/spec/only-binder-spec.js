
//var Bindings = require("..");
var Bindings = require("../bindings");
var Set = require("../../collections/set");

describe("only binder", function () {

    it("should bind arrays", function () {
        var object = Bindings.defineBindings({
            array: [1, 2, 3],
            item: 4
        }, {
            "array.only()": {
                "<-": "item"
            }
        });

        expect(object.array.length).toBe(1);
        expect(object.array[0]).toBe(4);

        object.item = 5;
        expect(object.array.length).toBe(1);
        expect(object.array[0]).toBe(5);
    });

    it("should bind sets", function () {
        var object = Bindings.defineBindings({
            set: new Set([1, 2, 3]),
            item: 4
        }, {
            "set.only()": {
                "<-": "item"
            }
        });

        expect(object.set.length).toBe(1);
        expect(object.set.has(4)).toBe(true);
        expect(object.set.has(1)).toBe(false);

        object.item = 5;
        expect(object.set.has(4)).toBe(false);
        expect(object.set.has(5)).toBe(true);
    });

});
