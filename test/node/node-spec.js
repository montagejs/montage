var assert = require("assert");
var montage = require("../../montage");

montage.loadPackage("test/node/fixture")
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
