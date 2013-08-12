
var Require = require("mr/require");

/**
 Adds "_montage_metadata" property to all objects and function attached to
 the exports object.
 @see Compiler middleware in require/require.js
 @param config
 @param compiler
 */
var reverseReelExpression = /((.*)\.reel)\/\2$/;
var reverseReelFunction = function ($0, $1) { return $1 };
exports.SerializationCompiler = function(config, compile) {
    return function(module) {
        compile(module);
        if (!module.factory)
            return;
        var defaultFactory = module.factory;
        module.factory = function(require, exports, module) {
            exports = defaultFactory.call(this, require, exports, module);
            for (var name in exports) {
                var object = exports[name];
                // avoid attempting to initialize a non-object
                if (!(object instanceof Object)) {
                // avoid attempting to reinitialize an aliased property
                } else if (object.hasOwnProperty("_montage_metadata") && !object._montage_metadata.isInstance) {
                    object._montage_metadata.aliases.push(name);
                    object._montage_metadata.objectName = name;
                } else if (!Object.isSealed(object)) {
                    var id = module.id.replace(
                        reverseReelExpression,
                        reverseReelFunction
                    );
                    Object.defineProperty(
                        object,
                        "_montage_metadata",
                        {
                            value: {
                                require: require,
                                module: id,
                                moduleId: id, // deprecated
                                property: name,
                                objectName: name, // deprecated
                                aliases: [name],
                                isInstance: false
                            }
                        }
                    );
                }
            }
            return exports;
        };
        return module;
    };
};

/**
 Allows the reel's html file to be loaded via require.
 @see Compiler middleware in require/require.js
 @param config
 @param compiler
 */
exports.TemplateCompiler = function(config, compile) {
    return function(module) {
        if (!module.location)
            return;
        var match = module.location.match(/(.*\/)?(?=[^\/]+\.html(?:\.load\.js)?$)/);
        if (match) {
            module.dependencies = module.dependencies || [];
            module.exports = {
                directory: match[1],
                content: module.text
            };
            // XXX deprecated
            Object.defineProperty(module.exports, "root", {
                get: function () {
                    if (typeof console === "object") {
                        console.warn("'root' property is deprecated on template modules.  Use 'directory' instead of root[1]");
                    }
                    return match;
                }
            });
            return module;
        } else {
            compile(module);
        }
    };
};

/**
 * Allows reel directories to load the contained eponymous JavaScript
 * module.
 * @see Loader middleware in require/require.js
 * @param config
 * @param loader the next loader in the chain
 */
var reelExpression = /([^\/]+)\.reel$/;
exports.ReelLoader = function (config, load) {
    return function (id, module) {
        var match = reelExpression.exec(id);
        if (match) {
            module.redirect = id + "/" + match[1];
            return module;
        } else {
            return load(id, module);
        }
    };
};

/**
 * Allows the .meta files to be loaded as json
 * @see Compiler middleware in require/require.js
 * @param config
 * @param compile
 */
var metaExpression = /\.meta/;
exports.MetaCompiler = function (config, compile) {
    return function (module) {
        var json = (module.location || "").match(metaExpression);
        if (json) {
            module.exports = JSON.parse(module.text);
            return module;
        } else {
            return compile(module);
        }
    };
};

/**
 Allows the reel's html file to be loaded via require.
 @see Compiler middleware in require/require.js
 @param config
 @param compiler
 */
exports.TemplateCompiler = function(config, compile) {
    return function(module) {
        if (!module.location)
            return;
        var match = module.location.match(/(.*\/)?(?=[^\/]+\.html(?:\.load\.js)?$)/);
        if (match) {
            module.dependencies = module.dependencies || [];
            module.exports = {
                directory: match[1],
                content: module.text
            };
            // XXX deprecated
            Object.defineProperty(module.exports, "root", {
                get: function () {
                    if (typeof console === "object") {
                        console.warn("'root' property is deprecated on template modules.  Use 'directory' instead of root[1]");
                    }
                    return match;
                }
            });
            return module;
        } else {
            compile(module);
        }
    };
};

// setup the reel loader
var makeLoader = Require.makeLoader;
exports.makeLoader = function (config) {
    return exports.ReelLoader(
        config,
        makeLoader(config)
    );
};

// set up serialization compiler
var makeCompiler = Require.makeCompiler;
exports.makeCompiler = function (config) {
    return exports.MetaCompiler(
        config,
        exports.SerializationCompiler(
            config,
            exports.TemplateCompiler(
                config,
                makeCompiler(config)
            )
        )
    );
};

