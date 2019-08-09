var data = require("spec/core/module-mjson/test.mjson");

describe("core/module-mjson", function () {

    expect(data.Hello === "World", 'parse string').toBe(true);

});
