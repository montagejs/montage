var test = require("test");
module.exports = require.async("dev-dependency")
.then(function (a) {
    throw "should not be able to require dev-dependency in production mode";
}, function (error) {
    console.log(error.message);
    test.assert(
        /Can\'t require module "dev-dependency" via "program"/.test(error.message),
        "cannot require dev-dependency in production mode"
    );
})
.then(function () {
    test.print("DONE", "info");
});
