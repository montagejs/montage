var test = require('test');
var nested = require('nested');
test.assert(nested.foo() === 1, 'child module identifier');
test.print('DONE', 'info');
