var test = require('test');

var config = {
    moduleTypes: ["plus-one"],
    makeCompiler: function (config) {
        var compile = require.config.makeCompiler(config);
        return function (module) {
            var isPlusOne = (module.location || "").match(/\.plus-one$/);
            if (isPlusOne) {
                module.exports = parseInt(module.text, 10) + 1;
                return module;
            } else {
                compile(module);
            }
        };
    }
};

return require.loadPackage(module.directory + "a", config)
.then(function (packageRequire) {
    return packageRequire.async("five.plus-one")
    .then(function (six) {
        test.assert(six === 6, 'can require .plus-one modules');
        return packageRequire.async("b");
    })
    .then(function (b) {
        test.assert(b === "pass", 'can require javascript module');
        return packageRequire.async("c.json");
    })
    .then(function (json) {
        test.assert(json.pass === true, 'can require json module');
        test.print('DONE', 'info');

    });
});
