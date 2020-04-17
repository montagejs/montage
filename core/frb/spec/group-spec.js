
var Bindings = require("../bindings");
var SortedSet = require("collections/sorted-set");

describe("group block", function () {

    var sam = {name: "Sam", gender: "female"};
    var jamie = {name: "Jamie", gender: "male"};
    var leslie = {name: "Leslie", gender: "male"};
    var pat = {name: "Pat", gender: "female"};
    var bobby = {name: "Bobby", gender: "female"};
    var max = {name: "Max", gender: "male"};

    var object = {
        folks: [sam, jamie, leslie, pat, bobby, max]
    };

    it("should define and initialize a group binding", function () {

        Bindings.defineBinding(object, "folksByGender", {
            "<-": "folks.group{gender}.map{[.0, .1.map{name}]}"
        });

        expect(object.folksByGender).toEqual([
            ["female", [
                "Sam",
                "Pat",
                "Bobby"
            ]],
            ["male", [
                "Jamie",
                "Leslie",
                "Max"
            ]]
        ]);

    });

    it("should respond to a property change affecting the relation", function () {

        leslie.gender = "female";

        expect(object.folksByGender).toEqual([
            ["female", [
                "Sam",
                "Pat",
                "Bobby",
                "Leslie"
            ]],
            ["male", [
                "Jamie",
                "Max"
            ]]
        ]);

    });

    it("should respond to the removal of an iteration", function () {

        object.folks.pop();

        expect(object.folksByGender).toEqual([
            ["female", [
                "Sam",
                "Pat",
                "Bobby",
                "Leslie"
            ]],
            ["male", [
                "Jamie"
            ]]
        ]);

    });

    it("should remove empty groups", function () {

        object.folks.delete(jamie);

        expect(object.folksByGender).toEqual([
            ["female", [
                "Sam",
                "Pat",
                "Bobby",
                "Leslie"
            ]]
        ]);

    });

    it("should create a new group", function () {

        object.folks.unshift(max);

        expect(object.folksByGender).toEqual([
            ["female", [
                "Sam",
                "Pat",
                "Bobby",
                "Leslie"
            ]],
            ["male", [
                "Max"
            ]]
        ]);

    });

    it("should work with group map block as well", function () {

        Bindings.cancelBinding(object, "folksByGender");
        Bindings.defineBinding(object, "folksByGender", {
            "<-": "folks.groupMap{gender}.items().map{[.0, .1.map{name}]}"
        });

        expect(object.folksByGender).toEqual([
            ["male", [
                "Max"
            ]],
            ["female", [
                "Sam",
                "Leslie",
                "Pat",
                "Bobby"
            ]]
        ]);

    });

    it("should use the same collection type for the equivalence classes", function () {

        Bindings.cancelBinding(object, "folksByGender");
        Bindings.defineBinding(object, "folksByGender", {
            "<-": "folks.groupMap{gender}"
        });

        object.folks = new SortedSet([max, sam], function (a, b) {
            return a.name === b.name;
        }, function (a, b) {
            return Object.compare(a.name, b.name);
        });

        expect(object.folksByGender.get('male') instanceof SortedSet).toBe(true);

    });


});

