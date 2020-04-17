/*
 * Note that the node_modules structure is not an expected result from
 * running npm install, but the package should still load using the
 * package-lock.json.
 */

var test = require('test');

require("http-server");
require("url");
test.print('DONE', 'info');
