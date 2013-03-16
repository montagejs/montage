var Serializer = require("./serialization/serializer/montage-serializer").MontageSerializer,
    serialize = require("./serialization/serializer/montage-serializer").serialize,
    Deserializer = require("./serialization/deserializer/montage-deserializer").MontageDeserializer,
    deserialize = require("./serialization/deserializer/montage-deserializer").deserialize;

exports.Serializer = Serializer;
exports.serialize = serialize;

exports.Deserializer = Deserializer;
exports.deserialize = deserialize;