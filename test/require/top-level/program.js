var test = require('test');
var a = require('submodule/a');
var b = require('b');
test.assert(a.foo().foo === b.foo, 'require works with top-level identifiers');
test.print('DONE', 'info');
