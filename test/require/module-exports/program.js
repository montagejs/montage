var test = require('test');
test.assert(require('module-exports') === 10, 'replacing module exports should replace the module exports');
test.print('DONE', 'info');
