var test = require("test");
require("a");
try {
    require("A");
    test.assert(false, "should fail to require alternate spelling");
} catch (error) {
}
test.print("DONE", "info");
