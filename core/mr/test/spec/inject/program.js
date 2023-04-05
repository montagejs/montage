var test = require("test");
require.inject("dependency", {
	foo: true
});
var dependency = require("dependency");
test.assert(dependency.foo === true, "the injected dependency should export true");
