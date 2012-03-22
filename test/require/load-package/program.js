var test = require("test");
module.exports = require.loadPackage("a")
.then(function (a) {
    return a.async("");
})
.then(function () {
    test.print("DONE", "info");
})
