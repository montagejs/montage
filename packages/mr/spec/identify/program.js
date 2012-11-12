var test = require("test");

require("x/x");

var xRequire = require.getPackage({name: "x"});

test.assert(require.identify('z', xRequire) === 'x/z');

test.print("DONE", "info");
