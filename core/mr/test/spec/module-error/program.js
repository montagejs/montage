var test = require('test');

function run() {
    try {
        require("./error");
    } catch (_error) {
        if (_error.message === "whoops") {
            return true;
        }
    }
    return false;
}

test.assert(run() === true, "First require fails");
test.assert(run() === true, "Second require still fails");

test.print('DONE', 'info');
