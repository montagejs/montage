
var Bindings = require("../bindings");
var Map = require("collections/map");

describe("items", function () {
    it("should work", function () {

        var object = Bindings.defineBinding({}, "items", {
            "<-": "map.items()"
        });

        expect(object.items).toEqual([]);

        object.map = new Map();
        expect(object.items).toEqual([]);

        object.map.set(0, 'a');
        expect(object.items).toEqual([[0, 'a']]);

        object.map.set(0, 'b');
        expect(object.items).toEqual([[0, 'b']]);

        object.map.set(1, 'a');
        expect(object.items).toEqual([[0, 'b'], [1, 'a']]);

        object.map.delete(0);
        expect(object.items).toEqual([[1, 'a']]);

        Bindings.cancelBindings(object);

        object.map.set(0, 'c');
        expect(object.items).toEqual([[1, 'a']]);

    });
});
