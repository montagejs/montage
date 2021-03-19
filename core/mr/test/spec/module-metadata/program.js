var test = require('test');
var Exported = require('a').Exported;

test.assert(typeof Exported._montage_metadata === 'object', 'import metadata');
test.assert(typeof Exported._montage_metadata.require === 'function', 'import metadata');
test.assert(Exported._montage_metadata.module === 'a', 'import metadata');
test.assert(Exported._montage_metadata.property === 'Exported', 'import metadata');
test.print('DONE', 'info');