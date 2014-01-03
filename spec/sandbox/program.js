var test = require("test");
var Q = require("q");

var sandbox = require("mr/sandbox");

var a = require("./a");
var dep = require("dependency/main");

return Q.all([
    sandbox(require, "./a", {
        "./b": "mocked"
    }),
    sandbox(require, "dependency/main", {
        "other": "mocked"
    }),
    sandbox(require, "d", {
        "./b": "redirected"
    })
])
.spread(function (sandboxedA, sandboxedDep, sandboxedD) {
    var a2 = require("./a");
    var dep2 = require("dependency/main");

    test.assert(a.value === "original", "a.b is the original");
    test.assert(sandboxedA.value === "mocked", "sandboxedA.b is the mock");
    test.assert(a.c === sandboxedA.c, "a.c and sandboxedA.c are the same");
    test.assert(a.d === sandboxedA.d, "a.d and sandboxedA.d are the same");
    test.assert(a2.value === "original", "a2.b is the original");

    test.assert(dep === "other", "dep is the original");
    test.assert(sandboxedDep === "mocked", "sandboxedDep is the mock");
    test.assert(dep2 === "other", "dep2 is the original");

    test.assert(sandboxedD.value === "redirected", "sandboxedD.b is redirected");
}).then(function () {
    test.print('DONE', 'info');
});
