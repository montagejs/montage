/*
 * Up to npm 3, npm always installed packages in the package's node_modules
 * directory. Starting in npm 3, npm now tries to avoid duplication by floating
 * dependencies-of-dependencies as far up the directory structure as possible
 * without causing version conflicts.
 *
 * This means when a module requires a node_module, that dependency may have
 * been installed to ./node_modules, ../node_modules, ../../node_modules, etc.
 * There is no way to determine where a dependency has been installed (until
 * npm 5's package-lock.json), as npm 3+ is non-deterministic and the location
 * a dependency is installed to can change depending on install order.
 *
 * Imagine a simple web application project that runs an http server. The
 * packages are: http-server, url, and path. The dependencies between packages
 * are:
 *
 * flat-module-tree -> [http-server@1, url@2]      flat-module-tree
 * http-server@1 -> [path@1, url@1]                   /         \
 * url@1 -> [path@1]                             http-server@1  url@2
 * url@2 -> [path@2]                              /      \        |
 * path@1 -> []                                path@1 <- url@1  path@2
 * path@2 -> []
 *
 * This test's directory structure is a possible result of running npm install:
 *
 *           flat-module-tree
 *                   |
 *             node_modules
 *             /     |    \
 *  http-server@1  path@2  url@2
 *        |
 *   node_modules
 *     /      \
 *  url@1   path@1
 *
 * To understand how npm 3+ works and why it is non-deterministic, see
 * https://npm.github.io/how-npm-works-docs/npm3/how-npm3-works.html
 */

var test = require('test');

require("http-server");
require("url");
test.print('DONE', 'info');
