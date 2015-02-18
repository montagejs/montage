
var Montage = require("montage").Montage;
var Map = require("montage/collections/map");

describe("paths-spec", function () {

    describe("getPath", function () {

        it("should return snapshot of map-change array", function () {

            var object = new Montage();
            object.array = [{foo: 1}, {foo: 2}, {foo: 3}];

            var foos = object.getPath("array.map{foo}");
            expect(foos).toEqual([1, 2, 3]);

            object.array.push({foo: 3});
            expect(foos).toEqual([1, 2, 3]); // still

        });

        it("should set a property", function () {

            var object = new Montage();
            Object.addEach(object, {a: {b: {c: {}}}});
            object.setPath("a.b.c.d", 10);
            expect(object.a.b.c.d).toBe(10);

        });

        // These two tests verify the interface for getPath and setPath.
        // The behavior of the underlying evaluate and assign are well-speced in FRB:
        // https://github.com/montagejs/frb/blob/master/spec/assign-spec.js
        // https://github.com/montagejs/frb/blob/master/spec/evaluate-spec.js
        // https://github.com/montagejs/frb/blob/master/spec/evaluate.js

    });

    describe("addPathChangeListener", function () {

        it("should return incremental map-change array", function () {

            var object = new Montage();
            object.array = [{foo: 1}, {foo: 2}, {foo: 3}];

            var foos = object.addPathChangeListener("array.map{foo}");
            expect(foos).toEqual([1, 2, 3]);

            object.array.push({foo: 4});
            expect(foos).toEqual([1, 2, 3, 4]);

            object.removePathChangeListener("array.map{foo}");
            object.array.shift();
            expect(foos).toEqual([1, 2, 3, 4]);

        });

        it("should watch value changes", function () {

            var object = new Montage();
            object.array = [{foo: 1}, {foo: 2}, {foo: 3}];

            var spy = jasmine.createSpy();
            var handler = function (sum) {
                spy(sum);
            };

            object.addPathChangeListener("array.map{foo}.sum()", handler);
            expect(spy).toHaveBeenCalledWith(6);

            object.array.push({foo: 4});
            expect(spy).toHaveBeenCalledWith(10);

            object.removePathChangeListener("array.map{foo}.sum()", handler);
            object.array.shift();
            expect(spy).toHaveBeenCalledWith(10);

        });

        it("should watch before value changes", function () {

            var object = new Montage();
            object.array = [{foo: 1}, {foo: 2}, {foo: 3}];

            var spy = jasmine.createSpy();
            var handler = function (sum) {
                spy(sum);
            };

            object.addBeforePathChangeListener("array.map{foo}.sum()", handler);
            // expect(spy).toHaveBeenCalledWith(undefined); // TODO dubious, presently reporting 6

            object.array.push({foo: 4});
            expect(spy).toHaveBeenCalledWith(6);

            object.removeBeforePathChangeListener("array.map{foo}.sum()", handler);
            object.array.shift();
            expect(spy).toHaveBeenCalledWith(6);

        });

        it("should watch value changes with path change handler", function () {

            var object = new Montage();
            object.array = [{foo: 1}, {foo: 2}, {foo: 3}];

            var spy = jasmine.createSpy();
            var handler = {
                handlePathChange: function (sum) {
                    spy(sum);
                }
            };

            object.addPathChangeListener("array.map{foo}.sum()", handler);
            expect(spy).toHaveBeenCalledWith(6);

            object.array.push({foo: 4});
            expect(spy).toHaveBeenCalledWith(10);

            object.removePathChangeListener("array.map{foo}.sum()", handler);
            object.array.shift();
            expect(spy).toHaveBeenCalledWith(10);

        });

        it("should watch value changes with change handler with a specific method", function () {

            var object = new Montage();
            object.array = [{foo: 1}, {foo: 2}, {foo: 3}];

            var spy = jasmine.createSpy();
            var handler = {
                handleFooSumChange: function (sum) {
                    spy(sum);
                }
            };

            object.addPathChangeListener("array.map{foo}.sum()", handler, "handleFooSumChange");
            expect(spy).toHaveBeenCalledWith(6);

            object.array.push({foo: 4});
            expect(spy).toHaveBeenCalledWith(10);

            object.removePathChangeListener("array.map{foo}.sum()", handler);
            object.array.shift();
            expect(spy).toHaveBeenCalledWith(10);

        });

        it("should produce an error", function () {

            var object = new Montage();
            object.array = [{foo: 1}, {foo: 2}, {foo: 3}];

            var sum = object.addPathChangeListener("array.sum{foo}");
            expect(sum).toEqual(6);

            expect(function () {
                object.array.push({foo: 4});
            }).toThrow();

        });

        it("should nest listeners", function () {

            var object = new Montage();
            object.array = [{foo: 1}, {foo: 2}, {foo: 3}];

            var spy = jasmine.createSpy();
            var cancel = object.addPathChangeListener("array.map{foo}", function (foos) {
                return Montage.addPathChangeListener.call(foos, "sum()", function (sum) {
                    spy(sum);
                });
            });
            expect(spy).toHaveBeenCalledWith(6);

            object.array.push({foo: 4});
            expect(spy).toHaveBeenCalledWith(10);

            spy = jasmine.createSpy();
            cancel();
            object.array.shift();
            expect(spy).wasNotCalled();

        });

        it("should nest path change and range change listeners", function () {

            var object = new Montage();
            object.array = [{foo: 1}, {foo: 2}, {foo: 3}];

            var spy = jasmine.createSpy();
            var cancel = object.addPathChangeListener("array.map{foo}", function (foos) {
                return foos.addRangeChangeListener(function (plus, minus, index) {
                    spy(plus, minus, index);
                });
            });
            expect(spy).wasNotCalled();

            spy = jasmine.createSpy();
            object.array.push({foo: 4});
            expect(spy).toHaveBeenCalledWith([4], [], 3);

            spy = jasmine.createSpy();
            object.array = [{foo: 0}];
            expect(spy).toHaveBeenCalledWith([0], [1, 2, 3, 4], 0);

            spy = jasmine.createSpy();
            cancel();
            object.array.clear();
            expect(spy).wasNotCalled();

        });

        it("should observe range change on mapped array", function () {

            var object = new Montage();
            object.array = [{foo: 1}, {foo: 2}, {foo: 3}];

            var spy = jasmine.createSpy();
            function rangeChange(plus, minus, index) {
                spy(plus, minus, index);
            }
            var foos = object.addPathChangeListener("array.map{foo}");
            foos.addRangeChangeListener(rangeChange);
            expect(spy).wasNotCalled();

            spy = jasmine.createSpy();
            object.array.push({foo: 4});
            expect(spy).toHaveBeenCalledWith([4], [], 3);

            spy = jasmine.createSpy();
            object.array = [{foo: 0}];
            expect(spy).toHaveBeenCalledWith([0], [1, 2, 3, 4], 0);

            spy = jasmine.createSpy();
            object.removePathChangeListener("array.map{foo}");
            foos.removeRangeChangeListener(rangeChange);
            object.array.clear();
            foos.clear();
            expect(spy).wasNotCalled();
        });

    });

    describe("addPathChangeListener on properties changed through bindings", function () {

        var foo,
            bar,
            newValue;

        beforeEach(function () {
            foo = new Montage();
            foo.value = "originalFoo";

            bar = new Montage();
            bar.value = "originalBar";

            foo.defineBinding("value", {"<-": "value", source: bar});

            newValue = "newBar";
        });

        it("should call the specified handler before the change", function () {
            var originalValue = foo.value;
            var changeObserver = {
                handleBeforeChange: function () {}
            };

            foo.addBeforePathChangeListener("value", changeObserver, "handleBeforeChange");

            //NOTE currently simply adding the listener calls the changeListener
            // so I'm setting it after the fact, here
            changeObserver.handleBeforeChange = function (value, path, object) {
                expect(value).toBe(originalValue);
                expect(object.getPath(path)).toBe(originalValue);
            };

            spyOn(changeObserver, "handleBeforeChange").andCallThrough();
            bar.value = newValue;
            expect(changeObserver.handleBeforeChange).toHaveBeenCalled();
        });

        it("should call the specified handler after the change", function () {
            var changeObserver = {
                handleChange: function () {}
            };


            foo.addPathChangeListener("value", changeObserver, "handleChange");

            //NOTE currently simply adding the listener calls the changeListener
            // so I'm setting it after the fact, here
            changeObserver.handleChange = function (value, path, object) {
                expect(value).toBe(newValue);
                expect(object.getPath(path)).toBe(newValue);
            };

            spyOn(changeObserver, "handleChange").andCallThrough();

            bar.value = newValue;
            expect(changeObserver.handleChange).toHaveBeenCalled();
        });

    });

    describe("addRangeAtPathChangeListener", function () {
        it("should watch for changes to an array at a path", function () {
            var object = new Montage();

            var spy = jasmine.createSpy();
            object.addRangeAtPathChangeListener("array", function (plus, minus, index) {
                // slice gets rid of the observability prototype
                spy(plus.slice(), minus.slice(), index);
            });
            expect(spy).toHaveBeenCalledWith([], [], 0);

            spy = jasmine.createSpy();
            object.array = [1];
            expect(spy).toHaveBeenCalledWith([1], [], 0);

            spy = jasmine.createSpy();
            object.array.push(2);
            expect(spy).toHaveBeenCalledWith([2], [], 1);

            spy = jasmine.createSpy();
            object.array.shift();
            expect(object.array.slice()).toEqual([2]);
            expect(spy).toHaveBeenCalledWith([], [1], 0);

            spy = jasmine.createSpy();
            object.array = ['a', 'b'];
            expect(spy).toHaveBeenCalledWith(['a', 'b'], [2], 0);

            object.array = [];
            expect(spy).toHaveBeenCalledWith([], ['a', 'b'], 0);
        });

        it("should handle transient nully input", function () {
            var object = new Montage();

            var spy = jasmine.createSpy();
            object.addRangeAtPathChangeListener("array", function (plus, minus, index) {
                // slice gets rid of the observability prototype
                spy(plus.slice(), minus.slice(), index);
            });
            expect(spy).toHaveBeenCalledWith([], [], 0);

            spy = jasmine.createSpy();
            object.array = [1];
            expect(spy).toHaveBeenCalledWith([1], [], 0);

            spy = jasmine.createSpy();
            object.array = {0: 'a', 1: 'b', length: 2};
            expect(spy).toHaveBeenCalledWith([], [1], 0);

            spy = jasmine.createSpy();
            object.array = ['a', 'b'];
            expect(spy).toHaveBeenCalledWith(['a', 'b'], [], 0);
        });

        it("should handle transient map input", function () {
            var object = new Montage();

            var spy = jasmine.createSpy();
            object.addRangeAtPathChangeListener("array", function (plus, minus, index) {
                // slice gets rid of the observability prototype
                spy(plus.slice(), minus.slice(), index);
            });
            expect(spy).toHaveBeenCalledWith([], [], 0);

            spy = jasmine.createSpy();
            object.array = [1];
            expect(spy).toHaveBeenCalledWith([1], [], 0);

            spy = jasmine.createSpy();
            object.array = new Map({bogus: 'fogus'});
            expect(spy).toHaveBeenCalledWith([], [1], 0);

            spy = jasmine.createSpy();
            object.array = ['a', 'b'];
            expect(spy).toHaveBeenCalledWith(['a', 'b'], [], 0);
        });

    });

    describe("addRangeAtPathChangeListener II", function () {
        it("should not pass a direct reference of the object at the path to the listener's plus/minus parameters", function () {
            var object = new Montage();
            var spy = jasmine.createSpy();
            var array1 = [1];
            var array2 = [2];

            object.array = array1;
            object.addRangeAtPathChangeListener("array", function (plus, minus, index) {
                spy(plus, minus, index);
            });

            object.array = array2;

            expect(spy.mostRecentCall.args[0]).not.toBe(array2);
            expect(spy.mostRecentCall.args[1]).not.toBe(array1);
        })
    });

    describe("addRangeAtPathChangeListener with handler", function () {

        var object = new Montage();

        var handler = {
            handleOffsetArrayRangeChange: function (plus, minus, index) {
                // slice gets rid of the observability prototype
                spy(plus.slice(), minus.slice(), index);
            }
        };

        var spy = jasmine.createSpy();
        object.addRangeAtPathChangeListener("array.map{*2}", handler, "handleOffsetArrayRangeChange");
        expect(spy).toHaveBeenCalledWith([], [], 0);

        spy = jasmine.createSpy();
        object.array = [1, 2];
        expect(spy).toHaveBeenCalledWith([2, 4], [], 0);

    });

});

