
var Bindings = require("../bindings");

describe("logic bindings", function () {

    describe("and bindings", function () {

        it("one way, true to false", function () {
            var object = Bindings.defineBindings({}, {
                "a && b": {"<-": "c"}
            });
            expect(object.a).toBe(undefined);
            expect(object.b).toBe(undefined);
            expect(object.c).toBe(undefined);

            object.c = true;
            expect(object.a).toBe(true);
            expect(object.b).toBe(true);
            expect(object.c).toBe(true);

            object.c = false;
            expect(object.a).toBe(false);
            expect(object.b).toBe(true);
            expect(object.c).toBe(false);
        });

        it("one way, false to true", function () {
            var object = Bindings.defineBindings({}, {
                "a && b": {"<-": "c"}
            });
            expect(object.a).toBe(undefined);
            expect(object.b).toBe(undefined);
            expect(object.c).toBe(undefined);

            object.c = false;
            expect(object.a).toBe(undefined);
            expect(object.b).toBe(undefined);
            expect(object.c).toBe(false);

            object.c = true;
            expect(object.a).toBe(true);
            expect(object.b).toBe(true);
            expect(object.c).toBe(true);
        });

        it("two-way, a, b, c", function () {
            var object = Bindings.defineBindings({}, {
                "a && b": {"<->": "c"}
            });
            expect(object.a).toBe(undefined);
            expect(object.b).toBe(undefined);
            expect(object.c).toBe(undefined);

            object.a = true;
            expect(object.a).toBe(true);
            expect(object.b).toBe(undefined);
            expect(object.c).toBe(undefined);

            object.b = true;
            expect(object.a).toBe(true);
            expect(object.b).toBe(true);
            expect(object.c).toBe(true);

            object.c = false;
            expect(object.a).toBe(false);
            expect(object.b).toBe(true);
            expect(object.c).toBe(false);

            object.a = true;
            expect(object.a).toBe(true);
            expect(object.b).toBe(true);
            expect(object.c).toBe(true);
        });

        it("two-way, b, a, c", function () {
            var object = Bindings.defineBindings({}, {
                "a && b": {"<->": "c"}
            });
            expect(object.a).toBe(undefined);
            expect(object.b).toBe(undefined);
            expect(object.c).toBe(undefined);

            object.b = true;
            expect(object.a).toBe(undefined);
            expect(object.b).toBe(true);
            expect(object.c).toBe(undefined);

            object.a = true;
            expect(object.a).toBe(true);
            expect(object.b).toBe(true);
            expect(object.c).toBe(true);

            object.c = false;
            expect(object.a).toBe(false);
            expect(object.b).toBe(true);
            expect(object.c).toBe(false);

            object.a = true;
            expect(object.a).toBe(true);
            expect(object.b).toBe(true);
            expect(object.c).toBe(true);
        });

    });

    describe("or bindings", function () {

        it("one way, true to false", function () {
            var object = Bindings.defineBindings({}, {
                "a || b": {"<-": "c"}
            });
            expect(object.a).toBe(undefined);
            expect(object.b).toBe(undefined);
            expect(object.c).toBe(undefined);

            object.c = true;
            expect(object.a).toBe(true);
            expect(object.b).toBe(undefined);
            expect(object.c).toBe(true);

            object.c = false;
            expect(object.a).toBe(false);
            expect(object.b).toBe(false);
            expect(object.c).toBe(false);
        });

        it("one way, false to true", function () {
            var object = Bindings.defineBindings({}, {
                "a || b": {"<-": "c"}
            });
            expect(object.a).toBe(undefined);
            expect(object.b).toBe(undefined);
            expect(object.c).toBe(undefined);

            object.c = false;
            expect(object.a).toBe(false);
            expect(object.b).toBe(false);
            expect(object.c).toBe(false);

            object.c = true;
            expect(object.a).toBe(true);
            expect(object.b).toBe(false);
            expect(object.c).toBe(true);
        });

        it("two-way, a, b, c", function () {
            var object = Bindings.defineBindings({}, {
                "a || b": {"<->": "c"}
            });
            expect(object.a).toBe(undefined);
            expect(object.b).toBe(undefined);
            expect(object.c).toBe(undefined);

            object.a = true;
            expect(object.a).toBe(true);
            expect(object.b).toBe(undefined);
            expect(object.c).toBe(true);

            object.b = true;
            expect(object.a).toBe(true);
            expect(object.b).toBe(true);
            expect(object.c).toBe(true);

            object.c = false;
            expect(object.a).toBe(false);
            expect(object.b).toBe(false);
            expect(object.c).toBe(false);

            object.a = true;
            expect(object.a).toBe(true);
            expect(object.b).toBe(false);
            expect(object.c).toBe(true);
        });

        it("two-way, b, a, c", function () {
            var object = Bindings.defineBindings({}, {
                "a || b": {"<->": "c"}
            });
            expect(object.a).toBe(undefined);
            expect(object.b).toBe(undefined);
            expect(object.c).toBe(undefined);

            object.b = true;
            expect(object.a).toBe(undefined);
            expect(object.b).toBe(true);
            expect(object.c).toBe(true);

            object.a = true;
            expect(object.a).toBe(true);
            expect(object.b).toBe(true);
            expect(object.c).toBe(true);

            object.c = false;
            expect(object.a).toBe(false);
            expect(object.b).toBe(false);
            expect(object.c).toBe(false);

            object.a = true;
            expect(object.a).toBe(true);
            expect(object.b).toBe(false);
            expect(object.c).toBe(true);
        });

        it("two-way with algebra solver", function () {
            var object = Bindings.defineBindings({}, {
                "a || !b": {"<->": "c"}
            });
            expect(object.a).toBe(undefined);
            expect(object.b).toBe(undefined);
            expect(object.c).toBe(true);

            object.c = false;
            expect(object.a).toBe(false);
            expect(object.b).toBe(true);
            expect(object.c).toBe(false);
        });

    });
});
