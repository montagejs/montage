var test = require("test");
var Q = require("q");

function read(location) {
    if (location === "http://test/package.json") {
        return Q(JSON.stringify({name: "pass"}));
    } else if (location === "http://test/module.js") {
        return Q("module.exports = 5");
    } else {
        return Q.reject(new Error(location + " not here"));
    }
}

module.exports = require.loadPackage({location: "http://test/"}, { read: read })
.then(function (pkg) {
    test.assert(pkg.config.name === "pass");

    return pkg.async("module");
})
.then(function (exports) {
    test.assert(exports === 5);

    test.print("DONE", "info");
});
