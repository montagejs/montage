var test = require('test');

test.assert(require("test.js/main") === 10, "can require dependency with .js in, in script-injection mode");

test.print('DONE', 'info');
