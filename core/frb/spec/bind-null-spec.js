
var Bindings = require("../bindings");

describe("binding to null", function () {
    var object;

    it("should declare binding", function () {
        object = Bindings.defineBinding({}, "left", {
            "<->": "condition ? right : null"
        });
    });

    it("when false, no binding", function () {
        object.left = 10;
        object.right = 20;
        expect(object.left).toBe(10);
        expect(object.right).toBe(20);
    });

    it("when becomes true, propagates <-", function () {
        object.condition = true;
        expect(object.left).toBe(20);
        expect(object.right).toBe(20);
    });


    it("when true, propagates ->", function () {
        object.left = 30;
        expect(object.left).toBe(30);
        expect(object.right).toBe(30);
    });

    it("when becomes false, <- propagates null", function () {
        object.condition = false;
        expect(object.left).toBe(null);
        expect(object.right).toBe(30);
    });

    it("when becomes true, propagages <- again", function () {
        object.right = 40;
        object.condition = true;
        expect(object.left).toBe(40);
        expect(object.right).toBe(40);
    });

    it("when true, propagates <-", function () {
        object.right = 50;
        expect(object.left).toBe(50);
        expect(object.right).toBe(50);
    });

    it("when true, propagates -> (again)", function () {
        object.left = 60;
        expect(object.left).toBe(60);
        expect(object.right).toBe(60);
    });

});

