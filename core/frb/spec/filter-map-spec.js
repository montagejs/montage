
var Bindings = require("../bindings");
describe("filter", function () {
    it("should propagate range changes to map, even if the filters are respecitvely the same", function () {

        var object = Bindings.defineBindings({
            input: "abcdefghijklmnopqrstuvwxyz",
            pluck: [0, 1, 2, 3]
        }, {
            output: {
                "<-": "pluck.filter{this < $input.length}.map{$input[this]}"
            }
        });

        expect(object.output).toEqual(['a', 'b', 'c', 'd']);

        object.pluck.splice(0, 1, 4);
        expect(object.output).toEqual(['e', 'b', 'c', 'd']);

    });
});
