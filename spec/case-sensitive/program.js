var test = require("test");
try {
    require("a");
    require("A");
    test.assert(false, "should fail to require alternate spelling");
} catch (error) {
}
test.print("DONE", "info");
