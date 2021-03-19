var test = require("test");
var ten = require("dev-dependency");
test.assert(10 === ten, "can require module from devDependency");
test.print("DONE", "info");
