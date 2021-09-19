
var Bindings = require("../bindings");

describe("defined binding", function () {

    it("should bind defined", function () {
        var object = Bindings.defineBindings({
        }, {
            "defined": {
                "<->": "property.defined()"
            }
        });
        expect(object.property).toBe(undefined);

        object.property = 10;
        expect(object.property).toBe(10);
        expect(object.defined).toBe(true);

        object.defined = false;
        expect(object.property).toBe(undefined);
    });

});

describe("isUndefined binding", function () {

    it("should bind isUndefined", function () {
        var object = Bindings.defineBindings({
        }, {
            "isUndefined": {
                "<->": "property.isUndefined()"
            }
        });
        expect(object.property).toBe(undefined);

        object.property = 10;
        expect(object.property).toBe(10);
        expect(object.isUndefined).toBe(false);

        object.isUndefined = true;
        expect(object.property).toBe(undefined);
    });

});
