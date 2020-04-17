var test = require('test');
test.assert(require('foo/bar').foo() == 1, 'nested module identifier');
test.print('DONE', 'info');