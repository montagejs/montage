
var Bindings = require("..");

describe("bindings", function () {

    describe("computed properties", function () {

        describe("string", function () {
            it("should propagate related bindings", function () {

                var object = Bindings.defineBindings({
                    foo: 10,
                    bar: 20
                }, {
                    baz: {
                        args: ["foo", "bar"],
                        compute: function (foo, bar) {
                            return foo + bar;
                        }
                    },
                    qux: {
                        "<-": "baz"
                    }
                });

                expect(object.qux).toEqual(30);

                object.bar = 30;
                expect(object.qux).toEqual(40);

            });
        });

        describe("array", function () {

            it("should propagate related bindings", function () {

                var object = Bindings.defineBindings({
                    foo: 10,
                    bar: 20
                }, {
                    baz: {
                        args: ["foo", "bar"],
                        compute: function (foo, bar) {
                            return foo + bar;
                        }
                    },
                    qux: {
                        "<-": "baz"
                    }
                });

                expect(object.qux).toEqual(30);

                object.bar = 30;
                expect(object.qux).toEqual(40);

            });

        });

    });

    describe("exclusive options", function () {

        it("should work", function () {

            var bindings = Bindings.defineBindings({
                options: [],
                off: true,
                on: false
            }, {

                "!options.has('feature')": {
                    "<->": "off"
                },
                "options.has('feature')": {
                    "<->": "on"
                }
            });

            expect(bindings.options.slice()).toEqual([]);

            bindings.on = true;
            expect(bindings.options.slice()).toEqual(['feature']);
            bindings.off = true;
            expect(bindings.options.slice()).toEqual([]);

        });

        it("should work", function () {

            var bindings = Bindings.defineBindings({
                options: [],
                off: true,
                on: false
            }, {
                "options.has('feature')": {
                    "<-": "!off"
                },
                "options.has('feature')": {
                    "<-": "on"
                },
                "on": {"<->": "!off"}
            });

            expect(bindings.options.slice()).toEqual([]);

            bindings.on = true;
            expect(bindings.options.slice()).toEqual(['feature']);
            bindings.off = true;
            expect(bindings.options.slice()).toEqual([]);

        });

    });

    it("should not update an active property", function () {

        var bindings = Bindings.defineBindings({}, {
            "output": {"<->": "input",
                convert: function (value) {
                    return Number(value).toFixed(1);
                },
                revert: function (value) {
                    return Number(value).toFixed(1);
                }
            }
        });

        bindings.input = "0";
        expect(bindings.input).toEqual("0");
        expect(bindings.output).toEqual("0.0");

        bindings.input = "1";
        expect(bindings.input).toEqual("1");
        expect(bindings.output).toEqual("1.0");

    });

    it("should bind elements by id", function () {
        var elements = {
            foo: {checked: true}
        };
        var bindings = Bindings.defineBindings({}, {
            "bar": {"<->": "#foo.checked"}
        }, {
            document: {
                getElementById: function (id) {
                    return elements[id];
                }
            }
        });
        expect(bindings.bar).toBe(true);
    });

    it("should bind components by label", function () {
        var components = {
            foo: {checked: true}
        };
        var bindings = Bindings.defineBindings({}, {
            "bar": {"<->": "@foo.checked"}
        }, {
            serialization: {
                getObjectByLabel: function (label) {
                    return components[label];
                }
            }
        });
        expect(bindings.bar).toBe(true);
    });

    it("should sort by relation", function () {
        var bindings = Bindings.defineBindings({
            objects: [{foo: 10}, {foo: 30}, {foo: 20}]
        }, {
            sorted: {"<-": "objects.sorted{foo}"}
        });
        expect(bindings.sorted).toEqual([
            {foo: 10},
            {foo: 20},
            {foo: 30}
        ]);
        bindings.objects.unshift({foo: 40});
        expect(bindings.sorted).toEqual([
            {foo: 10},
            {foo: 20},
            {foo: 30},
            {foo: 40}
        ]);
    });

});

