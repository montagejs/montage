var test = require('test');
test.assert(require('bar').foo() == 1, 'nested module identifier');
test.print('DONE', 'info');