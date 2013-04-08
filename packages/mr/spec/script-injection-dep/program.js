var test = require("test");

var dep = require("dependency/main");

test.assert(dep.main, "dependency loaded");
test.assert(dep.second, "dependency's dependency loaded");

test.print("DONE", "info");
