var test = require("test");
var Promise = require("bluebird");

function read(location) {
    if (location === "http://test/package.json") {
        return Promise.resolve(JSON.stringify({name: "pass"}));
    } else if (location === "http://test/module.js") {
        return Promise.resolve("module.exports = 5");
    } else {
        return Promise.reject(new Error(location + " not here"));
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
