var test = require("test");
var dep = require("dependency/dependency");

test.assert(dep === true, "can require module with name of package");
test.print("DONE", "info");

