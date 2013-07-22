var test = require("test");

// ensure relevant packages are loaded
require("x/x");
require("cyclic/module");

var xRequire = require.getPackage({name: "x"});

test.assert(require.identify('z', xRequire) === 'x/z');

test.print("DONE", "info");
