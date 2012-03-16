
var CLOCK = require("montage/core/next-tick");

describe("core/next-tick-spec", function () {

    var guard = false;

    it("sets up a handler", function () {
        CLOCK.nextTick(function () {
            guard = true;
        })
    })

    it("should not set the guard until the next tick", function () {
        expect(guard).toBe(false);
    });

    waitsFor(function () {
        return guard;
    })

    it("should set the guard in the next tick", function () {
        expect(guard).toBe(true);
    });

});

