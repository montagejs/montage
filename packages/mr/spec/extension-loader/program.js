var test = require('test');

var extensionRe = /([^\/]+)\.extension$/;
var ExtensionLoader = function (config, load) {
    return function (id, module) {
        var match = extensionRe.exec(id);
        if (match) {
            module.redirect = id + "/" + match[1];
            return module;
        } else {
            return load(id, module);
        }
    };
};

var config = {};
config.makeLoader = function (config) {
    return ExtensionLoader(config, require.config.makeLoader(config));
};

return require.loadPackage(module.directory, config)
.then(function (packageRequire) {
    return packageRequire.async("a.extension");
})
.then(function (aExports) {
    test.assert(aExports === 10, 'require with extension loader');

    test.print('DONE', 'info');
});

