require("../../deprecate").deprecationWarning("montage/core/serialization/serializer/properties-serializer", "montage/core/serialization/serializer/values-serializer");

exports.PropertiesSerializer = require("./values-serializer").ValuesSerializer;
