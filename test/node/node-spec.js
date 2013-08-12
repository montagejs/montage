var assert = require("assert");
var Require = require("../../node");

var URL = require("url");
var location = Require.directoryPathToLocation(__dirname);
location = URL.resolve(location, "fixture/");

Require.loadPackage(location)
.then(function (packageRequire) {

    // Test that HTML files can be loaded and parsed correctly
    return packageRequire.async("test.html")
    .then(function (exports) {
        assert(exports.content);

        var module = packageRequire.getModuleDescriptor("test.html");
        assert.deepEqual(
            module.dependencies,
            ["test"],
            "html dependencies sucessfully extracted"
        );
    });

})
.done();

