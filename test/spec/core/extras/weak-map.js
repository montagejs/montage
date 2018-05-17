var Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    Serializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer;

require("montage");

describe("core/extras/weak-map", function () {

    describe("WeakMap#deserializeSelf", function () {

        it("can deserialize with entries", function (done) {
            
            var deserializer = new Deserializer(),
                entries = [],
                serialization = {
                    "root": {
                        "prototype": "WeakMap",
                        "values": {
                            "entries": entries
                        }
                    }
                },
                string, i;

            for (i = 0; i < 5000; ++i) {
                entries.push({key: {id: i}, value:{name: i}});
            }

            string = JSON.stringify(serialization);
            deserializer.init(string, require);
            return deserializer.deserializeObject().then(function (root) {
                expect(root instanceof WeakMap).toBeTruthy();
                done();
            }).catch(function(reason) {
                console.warn(reason);
                fail(reason);
            });
            
        });

        it("can deserialize with keys and values", function (done) {
            var deserializer = new Deserializer(),
                keys = [],
                values = [],
                serialization = {
                    "root": {
                        "prototype": "WeakMap",
                        "values": {
                            "keys": keys,
                            "values": values
                        }
                    }
                },
                string, i;

            for (i = 0; i < 5000; ++i) {
                keys.push({id: i});
                values.push({name: i});
            }
            string = JSON.stringify(serialization);
            deserializer.init(string, require);
            return deserializer.deserializeObject().then(function (root) {
                expect(root instanceof WeakMap).toBeTruthy();
                done();
            }).catch(function(reason) {
                console.warn(reason);
                fail(reason);
            });

            
        });

    });

    describe("WeakMap#serializeSelf", function () {

        var serializer;

        beforeEach(function () {
            originalUnits = Serializer._units;
            Serializer._units = {};
            serializer = new Serializer().initWithRequire(require);
            serializer.setSerializationIndentation(4);
        });

        it("can serialize", function () {
            var map = new Map(),
                serialization;
            map.set("A", {name: "A"});
            map.set("B", {name: "B"});
            map.set("C", {name: "C"});


            serialization = serializer.serializeObject(map);
            serialization = JSON.parse(serialization);
            expect(serialization.root.prototype).toBe("Map");
            expect(serialization.root.values.keys[0]).toBe("A");
            expect(serialization.root.values.keys[1]).toBe("B");
            expect(serialization.root.values.keys[2]).toBe("C");
            expect(serialization.root.values.values[0].name).toBe("A");
            expect(serialization.root.values.values[1].name).toBe("B");
            expect(serialization.root.values.values[2].name).toBe("C");
        });


    });

});

