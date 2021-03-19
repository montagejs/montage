
var Bindings = require("../bindings");
var observeProperty = require("../observers").observeProperty;
var observeKey = require("../observers").observeKey;

describe("overriding observer", function () {

    it("should delegate to an alternate object property", function () {

        var object = {};

        var proxy = {
            object: object,
            observeProperty: function (key, emit, source, parameters, beforeChange) {
                return observeProperty(
                    this.object,
                    "~" + key,
                    emit,
                    source,
                    parameters,
                    beforeChange
                );
            }
        };

        var target = {};

        Bindings.defineBinding(target, "x", {"<-": "x", source: proxy});

        object["~x"] = 10;
        expect(target.x).toBe(10);

    });

    it("should delegate to an alternate map key", function () {

        var array = [1, 2, 3];

        var proxy = {
            observeKey: function (key, emit, source, parameters, beforeChange) {
                return observeKey(array, key, source, parameters, beforeChange);
            }
        };

        var target = Bindings.defineBinding({
            array: array
        }, "first", {"<-": "array[0]"});

        expect(target.first).toBe(1);

        array.shift();
        expect(target.first).toBe(2);

    });

});

