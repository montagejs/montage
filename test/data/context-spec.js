
Error.stackTraceLimit = Infinity;

var Montage = require("montage/core/core").Montage;
var Deserializer = require("montage/core/serialization").Deserializer;
var Context = require("montage/core/data/context").Context;

var mockStorage = {};
var context = new Context(mockStorage);

describe("data/context-spec", function () {

    var Person;
    var kris;

    it("loads the person blueprint from json", function () {
        return new Deserializer().init(JSON.stringify(require("./person.json")), require)
        .deserialize().then(function (deserialized) {
            Person = deserialized.person;
        });
    });

    it("creates a new person and commits", function () {
        kris = context.from(Person).create();
        kris.name = "Kris";
        mockStorage.applyChanges = function () {
            var objects = context.captureChanges();
            expect(objects.length).toBe(1);
            var object = objects[0];
            expect(object).toBe(kris);
            var changes = kris.changeContext.captureChanges();
            expect(changes.length).toBe(1);
            var change = changes[0];
            expect(change.key).toBe("name");
            expect(change.to).toBe("Kris");
        };
        return context.commit();
    });

    it("updates an existing person property and commits", function () {
        kris.name = "Kristopher";
        mockStorage.applyChanges = function () {
            var objects = context.captureChanges();
            expect(objects.length).toBe(1);
            var object = objects[0];
            expect(object).toBe(kris);
            var changes = kris.changeContext.captureChanges();
            expect(changes.length).toBe(1);
            var change = changes[0];
            expect(change.key).toBe("name");
            expect(change.to).toBe("Kristopher"); // <-- difference
        };
        return context.commit();
    })

    it("deletes an existing person and commits", function () {
        context.delete(kris);
        mockStorage.applyChanges = function () {
            var objects = context.captureChanges();
            expect(objects.length).toBe(1);
            var object = objects[0];
            expect(object).toBe(kris);
            var changes = kris.changeContext.captureChanges();
            expect(changes.length).toBe(0); // <-- difference
            expect(kris.changeContext.deleted).toBe(true);
        };
        return context.commit();
    });

    it("throws an error if a property is changed on a deleted managed object", function () {
        expect(function () {
            kris.name = "Cowbert von Moo";
        }).toThrow();
    });

});

