var test = require('test');
try {
    require("a");
} catch (exception) {
    console.log(exception.message);
    test.assert(exception.message === 'Can\'t require module "a" via "program"');
}
test.print('DONE', 'info');
