
var Map = require("collections/map");
var Bindings = require("../bindings");

describe("extensible logic gates", function () {
    var gate;

    beforeEach(function () {
        gate = Bindings.defineBindings({
            inputs: new Map()
        }, {
            output: {"<-": "inputs.items().every{.1}"}
        });
    });

    it("should work with one input", function () {

        expect(gate.output).toBe(true);

        gate.inputs.set('a', false);
        expect(gate.output).toBe(false);

        gate.inputs.set('a', true);
        expect(gate.output).toBe(true);

        gate.inputs.delete('a');
        expect(gate.output).toBe(true);

    });

    it("should work with multiple inputs", function () {

        expect(gate.output).toBe(true);

        gate.inputs.set('a', true);
        expect(gate.output).toBe(true);

        gate.inputs.set('b', false);
        expect(gate.output).toBe(false);

        gate.inputs.delete('b');
        expect(gate.output).toBe(true);

        gate.inputs.delete('a');
        expect(gate.output).toBe(true);

    });

    it("should work with multiple inputs", function () {

        expect(gate.output).toBe(true);

        gate.inputs.set('a', false);
        expect(gate.output).toBe(false);

        gate.inputs.set('b', false);
        expect(gate.output).toBe(false);

        gate.inputs.delete('b');
        expect(gate.output).toBe(false);

        gate.inputs.delete('a');
        expect(gate.output).toBe(true);

    });

});
