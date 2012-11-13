
var O = require("../observers");

describe("makePropertyObserver", function () {

    it("should react to property changes", function () {

        var object = {foo: 10};

        var cancel = O.makePropertyObserver(
            O.makeLiteralObserver(object),
            O.makeLiteralObserver('foo')
        )(function (value) {
            object.bar = value;
        });

        object.foo = 20;
        expect(object.bar).toBe(20);

        cancel();
        object.foo = 30;
        expect(object.bar).toBe(20);

    });

});

