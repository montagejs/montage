var DataService = require("montage/data/service/data-service").DataService,
    DataObjectDescriptor = require("montage/data/model/data-object-descriptor").DataObjectDescriptor,
    ModuleObjectDescriptor = require("montage/core/meta/module-object-descriptor").ModuleObjectDescriptor,
    ModuleReference = require("montage/core/module-reference").ModuleReference,
    RawDataService = require("montage/data/service/raw-data-service").RawDataService;

describe("A DataService", function() {

    it("can be created", function () {
        expect(new DataService()).toBeDefined();
    });

    it("initially has no parent, is a root service, and is the main service", function () {
        var service;

        // Create the service after resetting the main service.
        DataService.mainService = undefined;
        service = new DataService();
        service.NAME = "SERVICE";
        service.jasmineToString = function () { return "SERVICE"; };

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
        parent = new RawDataService();
        parent.NAME = "PARENT";
        parent.jasmineToString = function () { return "PARENT"; };
        child = new RawDataService();
        child.NAME = "CHILD";
        child.jasmineToString = function () { return "CHILD"; };
        grandchild = new RawDataService();
        grandchild.NAME = "GRANDCHILD";
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
        toString = function () { return "TYPE-" + this.id; };
        Types = [0, 1, 2, 3].map(function () { return function () {}; });
        Types.forEach(function (type) { type.TYPE = new DataObjectDescriptor(); });
        Types.forEach(function (type) { type.TYPE.jasmineToString = toString; });
        Types.forEach(function (type, index) { type.TYPE.id = index; });

        // Define test objects for each of the test types.
        toString = function () { return "OBJECT-" + this.id; };
        objects = Types.map(function (type) { return new type(); });
        objects.forEach(function (object) { object.jasmineToString = toString; });
        objects.forEach(function (object, index) { object.id = index; });

        // Create test children with unique identifiers to help with debugging.
        toString = function () { return "CHILD-" + this.id; };
        children = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function () { return new RawDataService(); });
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
        parent = new DataService();
        parent.jasmineToString = function () { return "PARENT"; };
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
        expect(parent._childServiceForObject(objects[0])).toEqual(children[0]);
        expect(parent._childServiceForObject(objects[1])).toEqual(children[2]);
        expect(parent._childServiceForObject(objects[2])).toEqual(children[4]);
        expect(parent._childServiceForObject(objects[3])).toEqual(children[7]);

        // Modify the children and verify the resulting service parent, types,
        // and type-to-child mapping.
        parent.removeChildService(children[0]);
        parent.removeChildService(children[1]);
        expect(parent.parentService).toBeUndefined();
        expect(children[0].parentService).toBeUndefined();
        expect(children[1].parentService).toBeUndefined();
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
        expect(parent._childServiceForObject(objects[0])).toEqual(children[3]);
        expect(parent._childServiceForObject(objects[1])).toEqual(children[2]);
        expect(parent._childServiceForObject(objects[2])).toEqual(children[4]);
        expect(parent._childServiceForObject(objects[3])).toEqual(children[7]);

        // Modify and verify some more.
        parent.removeChildService(children[3]);
        expect(parent.parentService).toBeUndefined();
        expect(children[0].parentService).toBeUndefined();
        expect(children[1].parentService).toBeUndefined();
        expect(children[2].parentService).toEqual(parent);
        expect(children[3].parentService).toBeUndefined();
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
        expect(parent._childServiceForObject(objects[0])).toEqual(children[4]);
        expect(parent._childServiceForObject(objects[1])).toEqual(children[2]);
        expect(parent._childServiceForObject(objects[2])).toEqual(children[4]);
        expect(parent._childServiceForObject(objects[3])).toEqual(children[7]);

        // Modify and verify some more. After the modification there will be no
        // more children for Types[0] so the first "all types" child should be
        // returned for that type.
        parent.removeChildService(children[4]);
        parent.removeChildService(children[6]);
        expect(parent.parentService).toBeUndefined();
        expect(children[0].parentService).toBeUndefined();
        expect(children[1].parentService).toBeUndefined();
        expect(children[2].parentService).toEqual(parent);
        expect(children[3].parentService).toBeUndefined();
        expect(children[4].parentService).toBeUndefined();
        expect(children[5].parentService).toEqual(parent);
        expect(children[6].parentService).toBeUndefined();
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
        expect(parent._childServiceForObject(objects[0])).toEqual(children[7]);
        expect(parent._childServiceForObject(objects[1])).toEqual(children[2]);
        expect(parent._childServiceForObject(objects[2])).toEqual(children[5]);
        expect(parent._childServiceForObject(objects[3])).toEqual(children[7]);

        // Modify and verify some more.
        parent.removeChildService(children[5]);
        parent.removeChildService(children[7]);
        expect(parent.parentService).toBeUndefined();
        expect(children[0].parentService).toBeUndefined();
        expect(children[1].parentService).toBeUndefined();
        expect(children[2].parentService).toEqual(parent);
        expect(children[3].parentService).toBeUndefined();
        expect(children[4].parentService).toBeUndefined();
        expect(children[5].parentService).toBeUndefined();
        expect(children[6].parentService).toBeUndefined();
        expect(children[7].parentService).toBeUndefined();
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
        expect(parent._childServiceForObject(objects[0])).toEqual(children[8]);
        expect(parent._childServiceForObject(objects[1])).toEqual(children[2]);
        expect(parent._childServiceForObject(objects[2])).toEqual(children[8]);
        expect(parent._childServiceForObject(objects[3])).toEqual(children[8]);

        // Modify and verify some more.
        parent.removeChildService(children[2]);
        parent.removeChildService(children[8]);
        expect(parent.parentService).toBeUndefined();
        expect(children[0].parentService).toBeUndefined();
        expect(children[1].parentService).toBeUndefined();
        expect(children[2].parentService).toBeUndefined();
        expect(children[3].parentService).toBeUndefined();
        expect(children[4].parentService).toBeUndefined();
        expect(children[5].parentService).toBeUndefined();
        expect(children[6].parentService).toBeUndefined();
        expect(children[7].parentService).toBeUndefined();
        expect(children[8].parentService).toBeUndefined();
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
        expect(parent._childServiceForObject(objects[0])).toEqual(children[9]);
        expect(parent._childServiceForObject(objects[1])).toEqual(children[9]);
        expect(parent._childServiceForObject(objects[2])).toEqual(children[9]);
        expect(parent._childServiceForObject(objects[3])).toEqual(children[9]);

        // Modify and verify some more.
        parent.removeChildService(children[9]);
        expect(parent.parentService).toBeUndefined();
        expect(children[0].parentService).toBeUndefined();
        expect(children[1].parentService).toBeUndefined();
        expect(children[2].parentService).toBeUndefined();
        expect(children[3].parentService).toBeUndefined();
        expect(children[4].parentService).toBeUndefined();
        expect(children[5].parentService).toBeUndefined();
        expect(children[6].parentService).toBeUndefined();
        expect(children[7].parentService).toBeUndefined();
        expect(children[8].parentService).toBeUndefined();
        expect(children[9].parentService).toBeUndefined();
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
        expect(parent._childServiceForObject(objects[0])).toBeNull();
        expect(parent._childServiceForObject(objects[1])).toBeNull();
        expect(parent._childServiceForObject(objects[2])).toBeNull();
        expect(parent._childServiceForObject(objects[3])).toBeNull();
    });

    it("can handle child services with an async types property using the register/unregister API", function (done) {
        var parent, syncChild, asyncChild, moduleReference, type, registerPromises, unregisterPromises;

        // Create a sample type
        // type = Function.noop;
        // type.TYPE = new DataObjectDescriptor();
        // type.TYPE.jasmineToString = function () { return "TYPE-" + this.id; };
        // type.TYPE.id = 1;

        moduleReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/movie", require);
        type = new ModuleObjectDescriptor().initWithModuleAndExportName(moduleReference, "Movie");
        // Create the main service
        parent = new RawDataService();
        parent.NAME = "PARENT";
        parent.jasmineToString = function () { return "PARENT"; };

        // Create a child with regular sync types
        syncChild = new RawDataService;
        Object.defineProperty(syncChild, "types", {
            get: function () {
                return [type];
            }
        });

        // Create a child with an async types property
        asyncChild = new RawDataService;
        Object.defineProperty(asyncChild, "types", {
            get: function () {
                return Promise.resolve([type]);
            }
        });

        // Test that parent references are added and removed correctly
        registerPromises = [syncChild, asyncChild].map(function (c) {
            return parent.registerChildService(c);
        });
        return Promise.all(registerPromises).then(function () {
                expect(syncChild.parentService).toBe(parent);
                expect(asyncChild.parentService).toBe(parent);
                unregisterPromises = [syncChild, asyncChild].map(function (c) {
                    return parent.unregisterChildService(c);
                });

                return Promise.all(unregisterPromises);
            })
            .then(function () {
                expect(syncChild.parentService).toBeUndefined();
                expect(asyncChild.parentService).toBeUndefined();
                done();
            });
    });

    it("has a fetchData() method", function () {
        expect(new DataService().fetchData).toEqual(jasmine.any(Function));
    });

    xit("has a fetchData() method that uses the passed in stream when one is specified", function () {
    });

    xit("has a fetchData() method that creates and return a new stream when none is passed in", function () {
    });

    xit("has a fetchData() method that sets its stream's selector", function () {
    });

    xit("has a registerService() method that needs to be further tested", function () {});

    xit("has a mainService class variable that needs to be further tested", function () {});

});
