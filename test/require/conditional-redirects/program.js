var test = require("test");
require("foo");
require("baz");
require("package/foo");
test.print("DONE", "info");
