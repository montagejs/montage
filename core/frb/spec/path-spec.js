var Bindings = require("../bindings");

describe("path", function () {

    it("should do evil", function () {

        var object = Bindings.defineBindings({}, {
            "result": {"<-": "path(path)"}
        });

        expect(object.result).toBe();

        object.path = "x + 2";
        expect(object.result).toBe();

        object.x = 2;
        expect(object.result).toBe(4);

    });

    it("should do evil iteratively", function () {

        var object = {};
        Bindings.defineBindings(object, {
            "result": {"<-": "source.map{path($path)}"}
        }, object);

        object.source = [1, 2, 3];
        object.path = "*2";
        expect(object.result).toEqual([2, 4, 6]);

    });

});

