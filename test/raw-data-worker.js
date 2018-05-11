console.log('montage-testing', 'Start');

module.exports = require("montage-testing").run(require, [

    {name: "spec/data/raw-data-worker"}
]).then(function () {
    console.log('montage-testing', 'End');
}, function (err) {
    console.log('montage-testing', 'Fail', err, err.stack);
    throw err;
});
