var test = require("test");
test.assert(require("bar/foo").foo === 10, 'can require through shared dependency');
test.print("DONE", "info");
