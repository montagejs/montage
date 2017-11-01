var Deserializer = require("core/serialization/deserializer/montage-deserializer").MontageDeserializer;

module.exports = function (mr, file) {
    var deserializer;
    return mr.async(file).then(function (descriptor) {
        deserializer = new Deserializer().init(JSON.stringify(descriptor), mr);
        return deserializer.deserializeObject();
    });
};



// appKey = Object.keys(module.require.packages)[0],
// appPackage = module.require.packages[appKey];

// appPackage.async("./data/model.mjson").then(function (json) {
//     console.log("Hello... (", json, ")");
// });

