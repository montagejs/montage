
require("montage");
var deserialize = require("montage/core/deserializer").deserialize;

// load generated serialization
exports.load = function () {
    return require.async("./sample-serialization.json")
    .then(function (serialization) {
        return deserialize(serialization, require);
    })
};

