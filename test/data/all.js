console.log('montage-testing', 'Start');
module.exports = require("montage-testing").run(require, [
    "spec/data/data-selector",
    "spec/data/data-mapping",
    "spec/data/data-object-descriptor",
    "spec/data/data-property-descriptor",
    "spec/data/data-provider",
    "spec/data/data-selector",
    "spec/data/data-service",
    "spec/data/data-stream",
    "spec/data/enumeration",
    "spec/data/http-service",
    "spec/data/object-descriptor",
    "spec/data/offline-service",
    "spec/data/property-descriptor",
    "spec/data/raw-data-service"
]).then(function () {
    console.log('montage-testing', 'End');
}, function (err) {
    console.log('montage-testing', 'Fail', err, err.stack);
    throw err;
});
