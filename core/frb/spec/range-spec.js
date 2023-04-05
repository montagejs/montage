
var Bindings = require("../bindings");

describe("range", function () {

    it("property.range()", function () {

        var object = Bindings.defineBindings({}, {
            "stack": {"<-": "height.range()"}
        });

        expect(object.stack).toEqual([]);

        object.height = 2;
        expect(object.stack).toEqual([0, 1]);

        object.height = 1;
        expect(object.stack).toEqual([0]);

        object.height = 3;
        expect(object.stack).toEqual([0, 1, 2]);

    });

    it("&range(height)", function () {

        var object = Bindings.defineBindings({}, {
            "stack": {"<-": "&range(height)"}
        });

        expect(object.stack).toEqual([]);

        object.height = 2;
        expect(object.stack).toEqual([0, 1]);

        object.height = 1;
        expect(object.stack).toEqual([0]);

        object.height = 3;
        expect(object.stack).toEqual([0, 1, 2]);

    });

});

