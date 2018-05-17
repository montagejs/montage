var RawDataWorker = require("montage/data/service/raw-data-worker").RawDataWorker,
    DataOperation = require("montage/data/service/data-operation").DataOperation,
    OperationType = require("montage/data/service/data-operation").DataOperation.Type,
    Category = require("spec/data/logic/model/category").Category,
    CategoryDescriptor = require("spec/data/logic/model/category.mjson").montageObject,
    Criteria = require("montage/core/criteria").Criteria,
    DataMapping = require("montage/data/service/data-mapping").DataMapping,
    DataService = require("montage/data/service/data-service").DataService,
    DataStream = require("montage/data/service/data-stream").DataStream,
    DataObjectDescriptor = require("montage/data/model/data-object-descriptor").DataObjectDescriptor,
    ObjectDescriptor = require("montage/core/meta/object-descriptor").ObjectDescriptor,
    ModuleReference = require("montage/core/module-reference").ModuleReference,
    MovieDescriptor = require("spec/data/logic/model/movie.mjson").montageObject,
    RawDataTypeMapping = require("montage/data/service/raw-data-type-mapping").RawDataTypeMapping;

var Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    deserialize = require("montage/core/serialization/deserializer/montage-deserializer").deserialize;

describe("A RawDataWorker", function() {
    var worker,
        typeReference,
        operation;

    function makeOperation(operationType, dataType, data, criteria) {
        var newOperation = new DataOperation();
        newOperation.type = operationType;
        newOperation.dataType = dataType;
        newOperation.data = data;
        newOperation.criteria = criteria;
        return newOperation;
    }

    it("can be created", function () {
        expect(new RawDataWorker()).toBeDefined();
    });

    it("can register service references", function (done) {
        var serviceID = "spec/data/logic/service/category-service.mjson",
            types = [CategoryDescriptor],
            serviceReference = new ModuleReference().initWithIdAndRequire(serviceID, require);

        worker = new RawDataWorker();
        worker.registerServiceForTypes(serviceReference, types);
        expect(worker.serviceReferences.size).toBe(1);
        done();
    });


    describe("can lazily", function () {

        it("register type for DataOperation with descriptor", function (done) {
            var movieDescriptor, operation2;

            operation = makeOperation(null, CategoryDescriptor);
            operation2 = makeOperation(null, CategoryDescriptor);
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

        it("register type for DataOperation with reference", function (done) {
            var movieDescriptor, operation2;
            typeReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/category.mjson", require);
            operation = makeOperation(null, typeReference);
            operation2 = makeOperation(null, typeReference);
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

        it("register type for DataOperation with descriptor & reference", function (done) {
            var movieDescriptor, operation2;
            typeReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/category.mjson", require);
            operation = makeOperation(null, CategoryDescriptor);
            operation2 = makeOperation(null, typeReference);
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

        it("register type for DataOperation with reference & descriptor", function (done) {
            var movieDescriptor, operation2;
            typeReference = new ModuleReference().initWithIdAndRequire("spec/data/logic/model/category.mjson", require);
            operation = makeOperation(null, typeReference);
            operation2 = makeOperation(null, CategoryDescriptor);
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
            operation = makeOperation(OperationType.Create, CategoryDescriptor, rawData);

            worker.handleOperation(operation).then(function (data) {
                expect(Array.isArray(data)).toBe(true);
                expect(data[1]).toBe(rawData.name);
                done();
            });
        });

        it("read operation", function (done) {

            operation = makeOperation(OperationType.Read, CategoryDescriptor);

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
            //Should use criteria to identify which object to update
            operation = makeOperation(OperationType.Update, CategoryDescriptor, rawData);

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
            operation = makeOperation(OperationType.Delete, CategoryDescriptor, rawData);            

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
            criteria = new Criteria().initWithExpression("id == $.id", {
                categoryID: 1
            });
            operation = makeOperation(OperationType.Read, CategoryDescriptor, null, criteria);

            worker.handleOperation(operation).then(function (data) {
                expect(Array.isArray(data)).toBe(true);
                expect(data.length).toBe(1);
                expect(data[0].name).toBe("Action");
                done();
            });

        });

    });

    describe("can deserialize", function () {
        it("without types", function (done) {
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

        it("with types", function (done) {
            var deserializer = new Deserializer();
                serialization = {
                    "root": {
                        "prototype": "montage/data/service/raw-data-worker",
                        "values": {
                            "name": "RawDataWorker",
                            "types": {"@": "TypeToChildServiceMap"}
                        }
                    },
                    "TypeToChildServiceMap": {
                        "prototype": "Map",
                        "values": {
                            "keys": [
                                {"@": "Category"},
                                {"@": "Movie"}
                            ],
                            "values": [
                                {"%": "spec/data/logic/service/category-service.mjson"},
                                {"%": "spec/data/logic/service/movie-service.mjson"}
                            ]
                        }
                    },
                    "Category": {
                        "object": "spec/data/logic/model/category.mjson"
                    },
                
                    "Movie": {
                        "object": "spec/data/logic/model/movie.mjson"
                    },
                },
                serializationString = JSON.stringify(serialization),
                operation = makeOperation(OperationType.Read, CategoryDescriptor);
                operation2 = makeOperation(OperationType.Read, MovieDescriptor);
    
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