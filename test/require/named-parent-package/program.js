var test = require("test");
test.assert(require("child-package") === require("parent-module"), 'child package requires module from named parent package');
test.print("DONE", "info");
