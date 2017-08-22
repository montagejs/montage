var RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    DataService = require("montage/data/service/data-service").DataService,
    DataStream = require("montage/data/service/data-stream").DataStream,
    DataObjectDescriptor = require("montage/data/model/data-object-descriptor").DataObjectDescriptor;

describe("A RawDataService", function() {

    it("can be created", function () {
        expect(new RawDataService()).toBeDefined();
    });

    it("initially has no parent, is a root service, and is the main service", function () {
        var service;

        // Create the service after resetting the main service.
        DataService.mainService = undefined;
        service = new DataService();

        // Verify that the service has no parent and is the root and main.
        expect(service.parentService).toBeUndefined();
        expect(service.rootService).toEqual(service);
        expect(DataService.mainService).toEqual(service);

        // Try to set a parent and verify again.
        service.parentService = new DataService();
        expect(service.parentService).toBeUndefined();
        expect(service.rootService).toEqual(service);
        expect(DataService.mainService).toEqual(service);
    });

    it("can be a parent, child, or grandchild service", function () {
        var parent, child, grandchild;

        // Create the parent, child, and grandchild after resetting the main
        // service, and tie them all together.
        DataService.mainService = undefined;
        parent = new RawDataService(),
        parent.jasmineToString = function () { return "PARENT"; };
        child = new RawDataService();
        child.jasmineToString = function () { return "CHILD"; };
        grandchild = new RawDataService();
        grandchild.jasmineToString = function () { return "GRANDCHILD"; };
        parent.addChildService(child);
        child.addChildService(grandchild);

        // Verify that the parents, roots, and main are correct.
        expect(parent.parentService).toBeUndefined();
        expect(parent.rootService).toEqual(parent);
        expect(child.parentService).toEqual(parent);
        expect(child.rootService).toEqual(parent);
        expect(grandchild.parentService).toEqual(child);
        expect(grandchild.rootService).toEqual(parent);
        expect(DataService.mainService).toEqual(parent);

        // Try to set new parents and verify again.
        parent.parentService = new RawDataService();
        child.parentService = new RawDataService();
        grandchild.parentService = new RawDataService();
        expect(parent.parentService).toBeUndefined();
        expect(parent.rootService).toEqual(parent);
        expect(child.parentService).toEqual(parent);
        expect(child.rootService).toEqual(parent);
        expect(grandchild.parentService).toEqual(child);
        expect(grandchild.rootService).toEqual(parent);
        expect(DataService.mainService).toEqual(parent);
    });

    it("manages children correctly", function () {
        var toString, Types, objects, Child, children, parent;

        // Define test types with ObjectDescriptors.
        toString = function () { return "Type" + this.id; };
        Types = [0, 1, 2, 3].map(function () { return function () {}; });
        Types.forEach(function (type) { type.TYPE = new DataObjectDescriptor(); });
        Types.forEach(function (type) { type.TYPE.toString = toString; });
        Types.forEach(function (type) { type.TYPE.jasmineToString = toString; });
        Types.forEach(function (type, index) { type.TYPE.id = index; });

        // Define test objects for each of the test types.
        toString = function () { return "Object" + this.id; };
        objects = Types.map(function (type) { return new type(); });
        objects.forEach(function (object) { object.toString = toString; });
        objects.forEach(function (object) { object.jasmineToString = toString; });
        objects.forEach(function (object, index) { object.id = index; });

        // Create test children with unique identifiers to help with debugging.
        toString = function () { return "Child" + this.id; };
        children = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function () { return new RawDataService(); });
        children.forEach(function (child) { child.toString = toString; });
        children.forEach(function (child) { child.jasmineToString = toString; });
        children.forEach(function (child, index) { child.id = index; });

        // Define a variety of types for the test children. Children with an
        // undefined, null, or empty types array will be "all types" children.
        children.forEach(function (child) { Object.defineProperty(child, "types", {writable: true}); });
        children[0].types = [Types[0].TYPE];
        children[1].types = [Types[0].TYPE];
        children[2].types = [Types[1].TYPE];
        children[3].types = [Types[0].TYPE, Types[1].TYPE];
        children[4].types = [Types[0].TYPE, Types[2].TYPE];
        children[5].types = [Types[1].TYPE, Types[2].TYPE];
        children[6].types = [Types[0].TYPE, Types[1].TYPE, Types[2].TYPE];
        children[7].types = undefined;
        children[8].types = null;
        children[9].types = [];

        // Create a service with the desired children.
        parent = new RawDataService();
        parent.toString = function () { return "PARENT"; };
        parent.jasmineToString = parent.toString;
        children.forEach(function (child) { parent.addChildService(child); });

        // Verify the initial parents, types, and type-to-child mapping.
        expect(parent.parentService).toBeUndefined();
        expect(children[0].parentService).toEqual(parent);
        expect(children[1].parentService).toEqual(parent);
        expect(children[2].parentService).toEqual(parent);
        expect(children[3].parentService).toEqual(parent);
        expect(children[4].parentService).toEqual(parent);
        expect(children[5].parentService).toEqual(parent);
        expect(children[6].parentService).toEqual(parent);
        expect(children[7].parentService).toEqual(parent);
        expect(children[8].parentService).toEqual(parent);
        expect(children[9].parentService).toEqual(parent);
        expect(parent.types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE, Types[2].TYPE]);
        expect(children[0].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[1].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[2].types.sort()).toEqual([Types[1].TYPE]);
        expect(children[3].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE]);
        expect(children[4].types.sort()).toEqual([Types[0].TYPE, Types[2].TYPE]);
        expect(children[5].types.sort()).toEqual([Types[1].TYPE, Types[2].TYPE]);
        expect(children[6].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE, Types[2].TYPE]);
        expect(children[7].types).toBeUndefined();
        expect(children[8].types).toBeNull();
        expect(children[9].types).toEqual([]);
        expect(parent.childServiceForType(Types[0].TYPE)).toEqual(children[0]);
        expect(parent.childServiceForType(Types[1].TYPE)).toEqual(children[2]);
        expect(parent.childServiceForType(Types[2].TYPE)).toEqual(children[4]);
        expect(parent.childServiceForType(Types[3].TYPE)).toEqual(children[7]);
        expect(parent._getChildServiceForObject(objects[0])).toEqual(children[0]);
        expect(parent._getChildServiceForObject(objects[1])).toEqual(children[2]);
        expect(parent._getChildServiceForObject(objects[2])).toEqual(children[4]);
        expect(parent._getChildServiceForObject(objects[3])).toEqual(children[7]);

        // Modify the children and verify the resulting service parent, types,
        // and type-to-child mapping.
        parent.removeChildService(children[0]);
        parent.removeChildService(children[1]);
        expect(parent.parentService).toBeUndefined();
        expect(children[2].parentService).toEqual(parent);
        expect(children[3].parentService).toEqual(parent);
        expect(children[4].parentService).toEqual(parent);
        expect(children[5].parentService).toEqual(parent);
        expect(children[6].parentService).toEqual(parent);
        expect(children[7].parentService).toEqual(parent);
        expect(children[8].parentService).toEqual(parent);
        expect(children[9].parentService).toEqual(parent);
        expect(parent.types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE, Types[2].TYPE]);
        expect(children[0].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[1].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[2].types.sort()).toEqual([Types[1].TYPE]);
        expect(children[3].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE]);
        expect(children[4].types.sort()).toEqual([Types[0].TYPE, Types[2].TYPE]);
        expect(children[5].types.sort()).toEqual([Types[1].TYPE, Types[2].TYPE]);
        expect(children[6].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE, Types[2].TYPE]);
        expect(children[7].types).toBeUndefined();
        expect(children[8].types).toBeNull();
        expect(children[9].types).toEqual([]);
        expect(parent.childServiceForType(Types[0].TYPE)).toEqual(children[3]);
        expect(parent.childServiceForType(Types[1].TYPE)).toEqual(children[2]);
        expect(parent.childServiceForType(Types[2].TYPE)).toEqual(children[4]);
        expect(parent.childServiceForType(Types[3].TYPE)).toEqual(children[7]);
        expect(parent._getChildServiceForObject(objects[0])).toEqual(children[3]);
        expect(parent._getChildServiceForObject(objects[1])).toEqual(children[2]);
        expect(parent._getChildServiceForObject(objects[2])).toEqual(children[4]);
        expect(parent._getChildServiceForObject(objects[3])).toEqual(children[7]);

        // Modify and verify some more.
        parent.removeChildService(children[3]);
        expect(parent.parentService).toBeUndefined();
        expect(children[2].parentService).toEqual(parent);
        expect(children[4].parentService).toEqual(parent);
        expect(children[5].parentService).toEqual(parent);
        expect(children[6].parentService).toEqual(parent);
        expect(children[7].parentService).toEqual(parent);
        expect(children[8].parentService).toEqual(parent);
        expect(children[9].parentService).toEqual(parent);
        expect(parent.types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE, Types[2].TYPE]);
        expect(children[0].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[1].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[2].types.sort()).toEqual([Types[1].TYPE]);
        expect(children[3].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE]);
        expect(children[4].types.sort()).toEqual([Types[0].TYPE, Types[2].TYPE]);
        expect(children[5].types.sort()).toEqual([Types[1].TYPE, Types[2].TYPE]);
        expect(children[6].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE, Types[2].TYPE]);
        expect(children[7].types).toBeUndefined();
        expect(children[8].types).toBeNull();
        expect(children[9].types).toEqual([]);
        expect(parent.childServiceForType(Types[0].TYPE)).toEqual(children[4]);
        expect(parent.childServiceForType(Types[1].TYPE)).toEqual(children[2]);
        expect(parent.childServiceForType(Types[2].TYPE)).toEqual(children[4]);
        expect(parent.childServiceForType(Types[3].TYPE)).toEqual(children[7]);
        expect(parent._getChildServiceForObject(objects[0])).toEqual(children[4]);
        expect(parent._getChildServiceForObject(objects[1])).toEqual(children[2]);
        expect(parent._getChildServiceForObject(objects[2])).toEqual(children[4]);
        expect(parent._getChildServiceForObject(objects[3])).toEqual(children[7]);

        // Modify and verify some more. After the modification there will be no
        // more children for Types[0] so the first "all types" child should be
        // returned for that type.
        parent.removeChildService(children[4]);
        parent.removeChildService(children[6]);
        expect(parent.parentService).toBeUndefined();
        expect(children[2].parentService).toEqual(parent);
        expect(children[5].parentService).toEqual(parent);
        expect(children[7].parentService).toEqual(parent);
        expect(children[8].parentService).toEqual(parent);
        expect(children[9].parentService).toEqual(parent);
        expect(parent.types.sort()).toEqual([Types[1].TYPE, Types[2].TYPE]);
        expect(children[0].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[1].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[2].types.sort()).toEqual([Types[1].TYPE]);
        expect(children[3].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE]);
        expect(children[4].types.sort()).toEqual([Types[0].TYPE, Types[2].TYPE]);
        expect(children[5].types.sort()).toEqual([Types[1].TYPE, Types[2].TYPE]);
        expect(children[6].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE, Types[2].TYPE]);
        expect(children[7].types).toBeUndefined();
        expect(children[8].types).toBeNull();
        expect(children[9].types).toEqual([]);
        expect(parent.childServiceForType(Types[0].TYPE)).toEqual(children[7]);
        expect(parent.childServiceForType(Types[1].TYPE)).toEqual(children[2]);
        expect(parent.childServiceForType(Types[2].TYPE)).toEqual(children[5]);
        expect(parent.childServiceForType(Types[3].TYPE)).toEqual(children[7]);
        expect(parent._getChildServiceForObject(objects[0])).toEqual(children[7]);
        expect(parent._getChildServiceForObject(objects[1])).toEqual(children[2]);
        expect(parent._getChildServiceForObject(objects[2])).toEqual(children[5]);
        expect(parent._getChildServiceForObject(objects[3])).toEqual(children[7]);

        // Modify and verify some more.
        parent.removeChildService(children[5]);
        parent.removeChildService(children[7]);
        expect(parent.parentService).toBeUndefined();
        expect(children[2].parentService).toEqual(parent);
        expect(children[8].parentService).toEqual(parent);
        expect(children[9].parentService).toEqual(parent);
        expect(parent.types.sort()).toEqual([Types[1].TYPE]);
        expect(children[0].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[1].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[2].types.sort()).toEqual([Types[1].TYPE]);
        expect(children[3].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE]);
        expect(children[4].types.sort()).toEqual([Types[0].TYPE, Types[2].TYPE]);
        expect(children[5].types.sort()).toEqual([Types[1].TYPE, Types[2].TYPE]);
        expect(children[6].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE, Types[2].TYPE]);
        expect(children[7].types).toBeUndefined();
        expect(children[8].types).toBeNull();
        expect(children[9].types).toEqual([]);
        expect(parent.childServiceForType(Types[0].TYPE)).toEqual(children[8]);
        expect(parent.childServiceForType(Types[1].TYPE)).toEqual(children[2]);
        expect(parent.childServiceForType(Types[2].TYPE)).toEqual(children[8]);
        expect(parent.childServiceForType(Types[3].TYPE)).toEqual(children[8]);
        expect(parent._getChildServiceForObject(objects[0])).toEqual(children[8]);
        expect(parent._getChildServiceForObject(objects[1])).toEqual(children[2]);
        expect(parent._getChildServiceForObject(objects[2])).toEqual(children[8]);
        expect(parent._getChildServiceForObject(objects[3])).toEqual(children[8]);

        // Modify and verify some more.
        parent.removeChildService(children[2]);
        parent.removeChildService(children[8]);
        expect(parent.parentService).toBeUndefined();
        expect(children[9].parentService).toEqual(parent);
        expect(parent.types.sort()).toEqual([]);
        expect(children[0].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[1].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[2].types.sort()).toEqual([Types[1].TYPE]);
        expect(children[3].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE]);
        expect(children[4].types.sort()).toEqual([Types[0].TYPE, Types[2].TYPE]);
        expect(children[5].types.sort()).toEqual([Types[1].TYPE, Types[2].TYPE]);
        expect(children[6].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE, Types[2].TYPE]);
        expect(children[7].types).toBeUndefined();
        expect(children[8].types).toBeNull();
        expect(children[9].types).toEqual([]);
        expect(parent.childServiceForType(Types[0].TYPE)).toEqual(children[9]);
        expect(parent.childServiceForType(Types[1].TYPE)).toEqual(children[9]);
        expect(parent.childServiceForType(Types[2].TYPE)).toEqual(children[9]);
        expect(parent.childServiceForType(Types[3].TYPE)).toEqual(children[9]);
        expect(parent._getChildServiceForObject(objects[0])).toEqual(children[9]);
        expect(parent._getChildServiceForObject(objects[1])).toEqual(children[9]);
        expect(parent._getChildServiceForObject(objects[2])).toEqual(children[9]);
        expect(parent._getChildServiceForObject(objects[3])).toEqual(children[9]);

        // Modify and verify some more.
        parent.removeChildService(children[9]);
        expect(parent.parentService).toBeUndefined();
        expect(parent.types.sort()).toEqual([]);
        expect(children[0].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[1].types.sort()).toEqual([Types[0].TYPE]);
        expect(children[2].types.sort()).toEqual([Types[1].TYPE]);
        expect(children[3].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE]);
        expect(children[4].types.sort()).toEqual([Types[0].TYPE, Types[2].TYPE]);
        expect(children[5].types.sort()).toEqual([Types[1].TYPE, Types[2].TYPE]);
        expect(children[6].types.sort()).toEqual([Types[0].TYPE, Types[1].TYPE, Types[2].TYPE]);
        expect(children[7].types).toBeUndefined();
        expect(children[8].types).toBeNull();
        expect(children[9].types).toEqual([]);
        expect(parent.childServiceForType(Types[0].TYPE)).toBeNull();
        expect(parent.childServiceForType(Types[1].TYPE)).toBeNull();
        expect(parent.childServiceForType(Types[2].TYPE)).toBeNull();
        expect(parent.childServiceForType(Types[3].TYPE)).toBeNull();
        expect(parent._getChildServiceForObject(objects[0])).toBeNull();
        expect(parent._getChildServiceForObject(objects[1])).toBeNull();
        expect(parent._getChildServiceForObject(objects[2])).toBeNull();
        expect(parent._getChildServiceForObject(objects[3])).toBeNull();
    });

    it("has a fetchData() method", function () {
        expect(new RawDataService().fetchData).toEqual(jasmine.any(Function));
    });

    xit("has a fetchData() method that uses the passed in stream when one is specified", function () {
    });

    xit("has a fetchData() method that creates and return a new stream when none is passed in", function () {
    });

    xit("has a fetchData() method that sets its stream's selector", function () {
    });

    xit("has a fetchData() method that calls the service's fetchRawData() when appropriate", function () {
    });

    xit("has a fetchData() xmethod that calls a child service's fetchRawData() when appropraite", function () {
    });

    it("has a fetchRawData() method", function () {
        expect(new RawDataService().fetchRawData).toEqual(jasmine.any(Function));
    });

    it("has a fetchRawData() method that fetches empty data by default", function (done) {
        // Call fetchRawData() and verify the resulting stream's initial data.
        var stream = new DataStream();
        new RawDataService().fetchRawData(stream);
        expect(stream.data).toEqual([]);
        // Make sure the stream's promise is fulfilled with the same data.
        stream.then(function (data) {
            expect(data).toBe(stream.data);
            expect(data).toEqual([]);
            done();
        });
    });

    it("has a addRawData() method", function () {
        expect(new RawDataService().addRawData).toEqual(jasmine.any(Function));
    });

    xit("has a addRawData() method that maps the data it receives", function () {
    });

    xit("has a addRawData() method that calls the specified stream's addData() with the mapped data", function () {
    });

    xit("has a addRawData() method that needs to be further tested", function () {});

    it("has a mapFromRawData() method", function () {
        expect(new RawDataService().mapFromRawData).toEqual(jasmine.any(Function));
    });

    xit("has a mapFromRawData() method that needs to be further tested", function () {});

    it("has a rawDataDone() method", function () {
        expect(new RawDataService().rawDataDone).toEqual(jasmine.any(Function));
    });

    xit("has a rawDataDone() method that calls the specified stream's dataDone()", function () {
    });

    xit("has a registerService() method that needs to be further tested", function () {});

    xit("has a mainService class variable that needs to be further tested", function () {});

});
