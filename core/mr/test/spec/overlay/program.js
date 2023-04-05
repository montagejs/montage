var test = require("test");

var config = {
    overlays: ["abc"]
};

return require.loadPackage(module.directory, config)
.then(function (packageRequire) {
    test.assert(packageRequire.packageDescription.pass === 10, "overlay applied")
    test.print("DONE", "info");
});
