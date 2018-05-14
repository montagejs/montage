var RawDataWorker = require("montage/data/service/raw-data-worker").RawDataWorker,
    OperationType = require("montage/data/service/data-operation").DataOperation.Type,
    Category = require("spec/data/logic/model/category").Category,
    CategoryDescriptor = require("spec/data/logic/model/category.mjson").montageObject,
    Criteria = require("montage/core/criteria").Criteria,
    DataMapping = require("montage/data/service/data-mapping").DataMapping,
    DataService = require("montage/data/service/data-service").DataService,
    DataServiceReference = require("montage/data/service/data-service-reference").DataServiceReference,
    DataStream = require("montage/data/service/data-stream").DataStream,
    DataObjectDescriptor = require("montage/data/model/data-object-descriptor").DataObjectDescriptor,
    ObjectDescriptor = require("montage/core/meta/object-descriptor").ObjectDescriptor,
    ModuleReference = require("montage/core/module-reference").ModuleReference,
    RawDataTypeMapping = require("montage/data/service/raw-data-type-mapping").RawDataTypeMapping;

var Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    deserialize = require("montage/core/serialization/deserializer/montage-deserializer").deserialize;

describe("A RawDataWorker", function() {
    var worker,
        typeReference,
        operation;

    it("can be created", function () {
        expect(new RawDataWorker()).toBeDefined();
    });


    it("can register service references", function (done) {
        var serviceID = "spec/data/logic/service/category-service.mjson",
            types = [CategoryDescriptor],
            serviceReference = new DataServiceReference().initWithIdTypesAndRequire(serviceID, types, require);
        worker = new RawDataWorker();

        worker.registerServiceReference(serviceReference).then(function () {
            expect(worker.serviceReferences.size).toBe(1);
            done();
        });
    });


    describe("can lazily", function () {

        it("register type for RawOperation", function (done) {
            var movieDescriptor, typeReference2, operation2;
            // worker = new RawDataWorker();
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
        // worker = new RawDataWorker();

        it("create operation", function (done) {
            var rawData = {
                name: "Comedy"
            };
            typeReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/category.mjson", require);
            operation = {
               data: rawData,
               objectDescriptorModule: typeReference,
               type: OperationType.CREATE
            };

            worker.handleOperation(operation).then(function (data) {
                expect(Array.isArray(data)).toBe(true);
                expect(data[1]).toBe(rawData.name);
                done();
            });
        });

        it("read operation", function (done) {
            typeReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/category.mjson", require);
            operation = {
               objectDescriptorModule: typeReference,
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
            typeReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/category.mjson", require);
            operation = {
               data: rawData,
               objectDescriptorModule: typeReference,
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
            typeReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/category.mjson", require);
            operation = {
               data: rawData,
               objectDescriptorModule: typeReference,
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
            typeReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/category.mjson", require);
            criteria = new Criteria().initWithExpression("id == $.id", {
                categoryID: 1
            });
            operation = {
               criteria: criteria,
               objectDescriptorModule: typeReference,
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

    describe("can deserialize", function () {
        it("without childServices", function (done) {
            var deserializer = new Deserializer();
                serialization = {
                    "root": {
                        "prototype": "montage/data/service/raw-data-worker",
                        "values": {
                            "name": "RawDataWorker"
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);
    
            deserializer.init(serializationString, require);
            deserializer.deserializeObject().then(function (root) {
                expect(Object.getPrototypeOf(root)).toBe(RawDataWorker.prototype);
            }).catch(function(reason) {
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        it("with childServices", function (done) {
            var deserializer = new Deserializer();
                serialization = {
                    "root": {
                        "prototype": "montage/data/service/raw-data-worker",
                        "values": {
                            "name": "RawDataWorker",
                            "childServices": [
                                {"@": "categoryService"},
                                {"@": "movieService"}
                            ]
                        }
                    },
                    "categoryService": {
                        "object": "spec/data/logic/service/category-service-reference.mjson"
                    },
                
                    "movieService": {
                        "object": "spec/data/logic/service/movie-service-reference.mjson"
                    }
                },
                serializationString = JSON.stringify(serialization),
                typeReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/category.mjson", require);
                type2Reference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/movie.mjson", require);
                operation = {
                   objectDescriptorModule: typeReference,
                   type: OperationType.READ
                },
                operation2 = {
                    objectDescriptorModule: type2Reference,
                    type: OperationType.READ
                 };
    
            deserializer.init(serializationString, require);
            deserializer.deserializeObject().then(function (root) {
                expect(Object.getPrototypeOf(root)).toBe(RawDataWorker.prototype);
                expect(root.serviceReferences.size).toBe(2);
                return root.handleOperation(operation).then(function (data) {
                    expect(Array.isArray(data)).toBe(true);
                    expect(data.length).toBe(1);
                    expect(data[0] instanceof Category).toBe(true);
                    return root.handleOperation(operation2);
                }).then(function (data) {
                    expect(Array.isArray(data)).toBe(true);
                    expect(data.length).toBe(1);
                    return null;
                });
            }).catch(function(reason) {
                fail(reason);
            }).finally(function () {
                done();
            });
        })
    });
})