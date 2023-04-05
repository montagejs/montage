var test = require('test');
var Exported = require('sub-module').Exported;

test.assert(typeof Exported, 1);
