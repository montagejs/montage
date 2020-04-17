console.log('montage-testing', 'Start');
module.exports = require("montage-testing").run(require, [
    'spec/require-spec',
    'spec/test-controller-spec',
    {"name": 'spec/testpageloader-spec', "node": false}
]).then(function () {
	console.log('montage-testing', 'End');
}, function (err) {
	console.log('montage-testing', 'Fail', err, err.stack);
	throw err;
});