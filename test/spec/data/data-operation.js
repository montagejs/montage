var DataOperation = require("montage/data/service/data-operation").DataOperation,
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

        operation.type = DataOperation.Type.Read;
        serialization = serializer.serializeObject(operation);
        serializationObject = JSON.parse(serialization);
        serializedType = serializationObject.root.values.type;
        expect(serializationObject.operationType_Read.object).toBe("montage/data/service/data-operation[ReadOperationType]");
    });

    it("can be deserialized", function (done) {
        var serialization = {
            root: {
                prototype: "montage/data/service/data-operation",
                values: {
                    type: {"@": "readOperationType"}
                }
            },
            readOperationType: {
                object: "montage/data/service/data-operation[CreateOperationType]"
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

});
