var Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    deserialize = require("montage/core/serialization/deserializer/montage-deserializer").deserialize;

require("montage");

describe("core/extras/map", function () {

    describe("Map#deserializeSelf", function () {

        it("can deserialize with entries", function (done) {
            
            var deserializer = new Deserializer(),
                entries = [],
                serialization = {
                    "root": {
                        "prototype": "collections/map[Map]",
                        "values": {
                            "entries": entries
                        }
                    }
                },
                string, i;

            for (i = 0; i < 5000; ++i) {
                entries.push({key: i, value:{name: i}});
            }

            string = JSON.stringify(serialization);
            deserializer.init(string, require);
            console.time("entries");
            return deserializer.deserializeObject().then(function (root) {
                console.timeEnd("entries");
                console.log("Map1", root);
                expect(root instanceof Map).toBeTruthy();
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
                        "prototype": "collections/map[Map]",
                        "values": {
                            "keys": keys,
                            "values": values
                        }
                    }
                },
                string, i;

            for (i = 0; i < 5000; ++i) {
                keys.push(i);
                values.push({name: i});
            }
            string = JSON.stringify(serialization);
            deserializer.init(string, require);
            console.time("keyValues");
            return deserializer.deserializeObject().then(function (root) {
                console.timeEnd("keyValues");
                console.log("Map2", root);
                expect(root instanceof Map).toBeTruthy();
                done();
            }).catch(function(reason) {
                console.warn(reason);
                fail(reason);
            });

            
        });

    });

    describe("Map#serializeSelf", function () {

        xit("can serialize", function () {
            expect("abc".contains("bc")).toBe(true);
        });


    });

});

