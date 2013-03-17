var test = require("test");
require.injectDependency("dependency");
module.exports = require.async("dependency/module")
.then(function (value) {
    test.assert(value === 10, "the injected dependency should export 10");
    test.print("DONE", "info");
});
