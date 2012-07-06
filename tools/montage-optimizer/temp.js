var Q = require("q");
var MontageBoot = require("montage");
MontageBoot.loadPackage("../montage/examples/temp-converter")
.then(function (require) {
    return Q.all([
        "index.html",
        //"ui/flow.reel/flow.html"
    ].map(function (id) {
        return require.deepLoad(id)
    }))
    .then(function () {
        Object.keys(require.modules).forEach(function (id) {
            var module = require.modules[id];
            if (module.text) module.text = true;
        })
        console.log(require.modules);
    })
})
.end()
