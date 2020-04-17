
var Bindings = require("../bindings");

describe("observe sorted set", function () {
    it("should work", function () {

        var a = {name: 'a', index: 0};
        var b = {name: 'b', index: 0};
        var c = {name: 'c', index: 0};
        var d = {name: 'd', index: 0};

        var array = [a, b, c, d];

        var object = Bindings.defineBindings({
            array: array
        }, {
            "sortedSet": {"<-": "array.sortedSet{index}"}
        });

        expect(object.sortedSet.toArray()).toEqual([d]);

        d.index = 3;
        expect(object.sortedSet.toArray()).toEqual([c, d]);

        c.index = 2;
        expect(object.sortedSet.toArray()).toEqual([b, c, d]);

        b.index = 1;
        expect(object.sortedSet.toArray()).toEqual([a, b, c, d]);

        a.index = 4;
        expect(object.sortedSet.toArray()).toEqual([b, c, d, a]);

        b.index = 4;
        expect(object.sortedSet.toArray()).toEqual([c, d, b]);

    });
});

