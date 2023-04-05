var test = require("test");
module.exports = require.loadPackage("0")
.then(function (zero) {
    return zero.async("");
})
.then(function () {
    test.print("DONE", "info");
})
