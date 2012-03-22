var test = require("test");
module.exports = require.loadPackage("a@0.0.0")
.then(function (a) {
    return a.async("");
})
.then(function () {
    test.print("DONE", "info");
})
