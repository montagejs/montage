console.log('montage-testing', 'Start');

module.exports = require("montage-testing").run(require, [

    {name: "spec/data/data-operation"}
    // {name: "spec/data/raw-data-worker"},
    // {name: "spec/data/data-service-mapping"},
    // {name: "spec/data/raw-data-service"},
    // {name: "spec/data/data-service"}
    
]).then(function () {
    console.log('montage-testing', 'End');
}, function (err) {
    console.log('montage-testing', 'Fail', err, err.stack);
    throw err;
});
