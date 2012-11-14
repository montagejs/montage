
require("montage");

describe("path-changes-spec", function () {

    it("should return incremental map-change array", function () {

        var object = {};
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

        var object = {};
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

        var object = {};
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

        var object = {};
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

    it("should watch value changes with token change handler", function () {

        var object = {};
        object.array = [{foo: 1}, {foo: 2}, {foo: 3}];

        var spy = jasmine.createSpy();
        var handler = {
            handleFooSumChange: function (sum) {
                spy(sum);
            }
        };

        object.addPathChangeListener("array.map{foo}.sum()", handler, 'fooSum');
        expect(spy).toHaveBeenCalledWith(6);

        object.array.push({foo: 4});
        expect(spy).toHaveBeenCalledWith(10);

        object.removePathChangeListener("array.map{foo}.sum()", handler);
        object.array.shift();
        expect(spy).toHaveBeenCalledWith(10);

    });

    it("should produce an error", function () {

        var object = {};
        object.array = [{foo: 1}, {foo: 2}, {foo: 3}];

        var sum = object.addPathChangeListener("array.sum{foo}");
        expect(sum).toEqual(6);

        expect(function () {
            object.array.push({foo: 4});
        }).toThrow();

    });

    it("should nest listeners", function () {

        var object = {};
        object.array = [{foo: 1}, {foo: 2}, {foo: 3}];

        var spy = jasmine.createSpy();
        var cancel = object.addPathChangeListener("array.map{foo}", function (foos) {
            return foos.addPathChangeListener("sum()", function (sum) {
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

        var object = {};
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

});

