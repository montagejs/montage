var RawDataWorker = require("montage/data/service/raw-data-worker").RawDataWorker,
    OperationType = require("montage/data/service/data-operation").DataOperation.Type,
    Criteria = require("montage/core/criteria").Criteria,
    DataMapping = require("montage/data/service/data-mapping").DataMapping,
    DataService = require("montage/data/service/data-service").DataService,
    DataStream = require("montage/data/service/data-stream").DataStream,
    DataObjectDescriptor = require("montage/data/model/data-object-descriptor").DataObjectDescriptor,
    ObjectDescriptor = require("montage/core/meta/object-descriptor").ObjectDescriptor,
    ModuleReference = require("montage/core/module-reference").ModuleReference,
    RawDataTypeMapping = require("montage/data/service/raw-data-type-mapping").RawDataTypeMapping;

describe("A RawDataWorker", function() {
    var worker,
        serviceReference, 
        typeReference,
        operation;

    it("can be created", function () {
        expect(new RawDataWorker()).toBeDefined();
    });

    describe("can lazily", function () {

        it("create service for RawOperation from mjson", function (done) {
            var movieService, serviceReference2, operation2;
            worker = new RawDataWorker();
            serviceReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/service/category-service.mjson", require);
            serviceReference2 = new ModuleReference().initWithIdAndRequire("spec/data/logic/service/category-service.mjson", require);
            operation = {
                serviceModule: serviceReference
            };
            operation2 = {
                serviceModule: serviceReference2
            };
            worker._serviceForOperation(operation).then(function (service) {
                expect(service).toBeDefined();
                movieService = service;
                return worker._serviceForOperation(operation2)
            }).then(function (service) {
                expect(service).toBeDefined();
                expect(service).toBe(movieService);
                done();
            });
        });

        xit("create service for RawOperation from js", function (done) {
            var movieService, serviceReference2, operation2;
            worker = new RawDataWorker();
            serviceReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/service/category-service", require);
            serviceReference2 = new ModuleReference().initWithIdAndRequire("spec/data/logic/service/category-service", require);
            operation = {
                serviceModule: serviceReference
            };
            operation2 = {
                serviceModule: serviceReference2
            };
            worker._serviceForOperation(operation).then(function (service) {
                expect(service).toBeDefined();
                movieService = service;
                return worker._serviceForOperation(operation2)
            }).then(function (service) {
                expect(service).toBeDefined();
                expect(service).toBe(movieService);
                done();
            });
        });

        it("register type for RawOperation", function (done) {
            var movieDescriptor, typeReference2, operation2;
            worker = new RawDataWorker();
            typeReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/category.mjson", require);
            typeReference2 = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/category.mjson", require);
            operation = {
                objectDescriptorModule: typeReference
            };
            operation2 = {
                objectDescriptorModule: typeReference
            };
            worker._objectDescriptorForOperation(operation).then(function (descriptor) {
                expect(descriptor).toBeDefined();
                movieDescriptor = descriptor;
                return worker._objectDescriptorForOperation(operation2);
            }).then(function (descriptor) {
                expect(descriptor).toBeDefined();
                expect(descriptor).toBe(movieDescriptor);
                done();
            });
        });

    });

    describe("can handle basic ", function () {
        worker = new RawDataWorker();

        it("create operation", function (done) {
            var rawData = {
                name: "Comedy"
            };
            serviceReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/service/category-service.mjson", require);
            typeReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/category.mjson", require);
            operation = {
               data: rawData,
               objectDescriptorModule: typeReference,
               serviceModule: serviceReference,
               type: OperationType.CREATE
            };

            worker.handleOperation(operation).then(function (data) {
                expect(Array.isArray(data)).toBe(true);
                expect(data[1]).toBe(rawData.name);
                done();
            });
        });

        it("read operation", function (done) {
            serviceReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/service/category-service.mjson", require);
            typeReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/category.mjson", require);
            operation = {
               objectDescriptorModule: typeReference,
               serviceModule: serviceReference,
               type: OperationType.READ
            };

            worker.handleOperation(operation).then(function (data) {
                expect(Array.isArray(data)).toBe(true);
                expect(data.length).toBe(1);
                done();
            });
        });

        it("update operation", function (done) {
            var rawData = {
                name: "Science Fiction",
                categoryID: 1
            };
            serviceReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/service/category-service.mjson", require);
            typeReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/category.mjson", require);
            operation = {
               data: rawData,
               objectDescriptorModule: typeReference,
               serviceModule: serviceReference,
               type: OperationType.UPDATE
            };

            worker.handleOperation(operation).then(function (data) {
                expect(Array.isArray(data)).toBe(true);
                expect(data[1]).toBe(rawData.name);
                done();
            });
        });

        
        it("delete operation", function (done) {
            var rawData = {
                name: "Science Fiction",
                categoryID: 1
            };
            serviceReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/service/category-service.mjson", require);
            typeReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/category.mjson", require);
            operation = {
               data: rawData,
               objectDescriptorModule: typeReference,
               serviceModule: serviceReference,
               type: OperationType.DELETE
            };

            worker.handleOperation(operation).then(function (data) {
                expect(Array.isArray(data)).toBe(true);
                expect(data.length).toBe(1);
                done();
            });
        });
    });

    describe("can handle read operation", function () {
        worker = new RawDataWorker();

        it("with criteria", function (done) {
            serviceReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/service/category-service.mjson", require);
            typeReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/category.mjson", require);
            criteria = new Criteria().initWithExpression("id == $.id", {
                categoryID: 1
            });
            operation = {
               criteria: criteria,
               objectDescriptorModule: typeReference,
               serviceModule: serviceReference,
               type: OperationType.READ
            };

            worker.handleOperation(operation).then(function (data) {
                expect(Array.isArray(data)).toBe(true);
                expect(data.length).toBe(1);
                expect(data[0].name).toBe("Action");
                done();
            });

        });

    });
})