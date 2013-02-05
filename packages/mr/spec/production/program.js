var test = require("test");
module.exports = require.async("dev-dependency")
.then(function (a) {
    throw "should not be able to require dev-dependency in production mode";
}, function (err) {
    test.assert(err.message === 'Can\'t require module "dev-dependency" via "program"', "cannot require dev-dependency in production mode");
})
.then(function () {
    test.print("DONE", "info");
});
