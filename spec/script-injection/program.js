var test = require("test");
var Q = require("q");

return require.loadPackage(
    {
        location: require.location + "/node_modules/dependency",
        hash: "xxx"
    }, {
        preloaded: Q.delay(20)
    }
)
.then(function (packageRequire) {
    return packageRequire.async("main");
})
.then(function (mainExports) {
    test.assert(mainExports.main === true, "can load module in package");
    test.print("DONE", "info");
});
