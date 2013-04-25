var test = require("test");

var main = require("dependency/main");

test.assert(main.main === true, "can load module in script injection package");

test.print("DONE", "info");
