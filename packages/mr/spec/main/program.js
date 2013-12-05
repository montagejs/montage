var test = require('test');

test.assert(require('dot-slash') === 10, 'main with "./"');
test.assert(require('js-ext') === 20, 'main with ".js" extension');
test.assert(require('no-ext') === 30, 'main with no extension');
test.assert(require('dot-js-ext') === 40, 'main with "." in module name and ".js" extension');

test.assert(require('js-ext') === require("js-ext/a"), 'can require "main" without extension');

test.print('DONE', 'info');
