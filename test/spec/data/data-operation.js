var DataOperation = require("montage/data/service/data-operation").DataOperation,
    DataOperationType = require("montage/data/service/data-operation-type").DataOperationType,
    Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    deserialize = require("montage/core/serialization/deserializer/montage-deserializer").deserialize,
    Serializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer,
    serialize = require("montage/core/serialization/serializer/montage-serializer").serialize;

describe("A DataOperation", function() {

    it("can be created", function () {
        expect(new DataOperation()).toBeDefined();
    });


    it("can be serialized", function () {
        var operation = new DataOperation(),
            serializer = new Serializer().initWithRequire(require),
            serialization, serializationObject;

        operation.type = DataOperationType.Read;
        serialization = serializer.serializeObject(operation);
        serializationObject = JSON.parse(serialization);
        serializedType = serializationObject.root.values.type;
        expect(serializationObject.operationType_Read.object).toBe("montage/data/service/data-operation-type[Read]");
    });

    it("can be deserialized", function (done) {
        var serialization = {
            root: {
                prototype: "montage/data/service/data-operation",
                values: {
                    type: {"@": "createOperationType"}
                }
            },
            createOperationType: {
                object: "montage/data/service/data-operation-type[Create]"
            }
        },
        deserializer = new Deserializer().init(serialization, require),
        otherDeserializer = new Deserializer().init(serialization, require),
        type;

        deserializer.deserializeObject().then(function (result) {
            expect(result).toBeDefined();
            type = result.type;
            return deserializer.deserializeObject();
        }).then(function (otherResult) {
            expect(otherResult.type).toBe(type);
            done();
        });
    });

    it("can be serialized & deserialized without loss", function (done) {
        var operationA = new DataOperation(),
            operationB = new DataOperation(),
            serializer = new Serializer().initWithRequire(require),
            serializationA,
            deserializerA,
            deserializerB;

        operationA.type = DataOperation.Type.Read;
        operationB.type = DataOperation.Type.Read;
        serializationA = serializer.serializeObject(operationA);
        serializationB = serializer.serializeObject(operationB);

        deserializerA = new Deserializer().init(serializationA, require);
        deserializerB = new Deserializer().init(serializationA, require);

        deserializerA.deserializeObject().then(function (result) {
            expect(result).toBeDefined();
            type = result.type;
            return deserializerB.deserializeObject();
        }).then(function (otherResult) {
            expect(otherResult.type).toBe(type);
            done();
        });

    });


    it("can determine correct failure type", function () {
        var createTypes = ["Create", "CreateCompleted"],
            createFailedType = "CreateFailed",
            deleteTypes = ["Delete", "DeleteCompleted"],
            deleteFailedType = "DeleteFailed",
            updateTypes = ["Update", "UpdateCompleted"],
            updateFailedType = "UpdateFailed",
            lockTypes = ["Lock", "LockCompleted"],
            lockFailedType = "LockFailed",
            remoteTypes = ["RemoteProcedureCall", "RemoteProcedureCallCompleted"],
            remoteFailedType = "RemoteProcedureCallFailed",
            updateTypes = ["Update", "UpdateCompleted"],
            updateTypesFailedType = "UpdateFailed",
            readTypes = ["Read", "ReadCompleted", "ReadProgress", "ReadUpdated", "ReadCancel", "ReadCanceled"],
            readFailedType = "ReadFailed";
            failTypes = ["CreateFailed", "DeleteFailed", "UpdateFailed", "LockFailed", "RemoteProcedureCallFailed", "ReadFailed"];


        function testFailType (array, failTypeName) {
            var type, failType;
            failType = failTypeName ? DataOperationType[failTypeName] : failTypeName;
            if (failTypeName) {
                failType = DataOperationType[failTypeName];
                expect(failType).toBeDefined();
            } else {
                failType = null; //Fail Types will return null from DataOperationType.failureTypeForType
            }
            
            array.forEach(function (typeName) {
                type = DataOperationType[typeName];
                expect(type).toBeDefined();
                expect(DataOperationType.failureTypeForType(type)).toBe(failType);
            })
        }

        testFailType(createTypes, createFailedType);
        testFailType(deleteTypes, deleteFailedType);
        testFailType(updateTypes, updateFailedType);
        testFailType(lockTypes, lockFailedType);
        testFailType(remoteTypes, remoteFailedType);
        testFailType(updateTypes, updateFailedType);
        testFailType(readTypes, readFailedType);
        testFailType(failTypes, null);
    });

    it("can determine correct completion type", function () {
        var createTypes = ["Create", "CreateFailed"],
            createCompletedType = "CreateCompleted",
            deleteTypes = ["Delete", "DeleteFailed"],
            deleteCompletedType = "DeleteCompleted",
            updateTypes = ["Update", "UpdateFailed"],
            updateCompletedType = "UpdateCompleted",
            lockTypes = ["Lock", "LockFailed"],
            lockCompletedType = "LockCompleted",
            remoteTypes = ["RemoteProcedureCall", "RemoteProcedureCallFailed"],
            remoteCompletedType = "RemoteProcedureCallCompleted",
            updateTypes = ["Update", "UpdateFailed"],
            updateTypesCompletedType = "UpdateCompleted",
            readTypes = ["Read", "ReadFailed", "ReadProgress", "ReadUpdated", "ReadCancel", "ReadCanceled"],
            readCompletedType = "ReadCompleted";
            completeTypes = ["CreateCompleted", "DeleteCompleted", "UpdateCompleted", "LockCompleted", "RemoteProcedureCallCompleted", "ReadCompleted"];


        function testCompleteType (array, completeTypeName) {
            var type, completeType;
            completeType = completeTypeName ? DataOperationType[completeTypeName] : completeTypeName;
            if (completeTypeName) {
                completeType = DataOperationType[completeTypeName];
                expect(completeType).toBeDefined();
            } else {
                completeType = null; //Fail Types will return null from DataOperationType.completionTypeForType
            }
            
            array.forEach(function (typeName) {
                type = DataOperationType[typeName];
                expect(type).toBeDefined();
                expect(DataOperationType.completionTypeForType(type)).toBe(completeType);
            })
        }

        testCompleteType(createTypes, createCompletedType);
        testCompleteType(deleteTypes, deleteCompletedType);
        testCompleteType(updateTypes, updateCompletedType);
        testCompleteType(lockTypes, lockCompletedType);
        testCompleteType(remoteTypes, remoteCompletedType);
        testCompleteType(updateTypes, updateCompletedType);
        testCompleteType(readTypes, readCompletedType);
        testCompleteType(completeTypes, null);
    });

});
