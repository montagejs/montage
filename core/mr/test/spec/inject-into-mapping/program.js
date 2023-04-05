var test = require("test");
require.inject("mapping/dependency", {
    foo: true
})
var Dependency = require("mapping/module");
test.assert(Dependency.foo === true, "the injected depency should export foo");

