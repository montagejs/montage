var Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    Serializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer;

require("montage");

describe("core/extras/set", function () {

    describe("Set#deserializeSelf", function () {

            it("can deserialize with entries", function (done) {
                
                var deserializer = new Deserializer(),
                    values = [],
                    serialization = {
                        "root": {
                            "prototype": "Set",
                            "values": {
                                "values": values
                            }
                        }
                    },
                    string, i;

                for (i = 0; i < 5000; ++i) {
                    values.push({key: i, value:{name: i}});
                }

                string = JSON.stringify(serialization);
                deserializer.init(string, require);
                return deserializer.deserializeObject().then(function (root) {
                    expect(root instanceof Set).toBeTruthy();
                    done();
                }).catch(function(reason) {
                    console.warn(reason);
                    fail(reason);
                });
                
            });

    });

    describe("Set#serializeSelf", function () {
            var serializer;

        beforeEach(function () {
            originalUnits = Serializer._units;
            Serializer._units = {};
            serializer = new Serializer().initWithRequire(require);
            serializer.setSerializationIndentation(4);
        });

        it("can serialize", function () {
            var set = new Set(),
                serialization;

            set.add({name: "A"});
            set.add({name: "B"});
            set.add({name: "C"});


            serialization = serializer.serializeObject(set);
            serialization = JSON.parse(serialization);
            expect(serialization.root.prototype).toBe("Set");
            expect(serialization.root.values.values[0].name).toBe("A");
            expect(serialization.root.values.values[1].name).toBe("B");
            expect(serialization.root.values.values[2].name).toBe("C");
        });

    });

});

