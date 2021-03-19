Contributing
============

Pull requests are gladly accepted. We also really appreciate tests.

Tests
-----

On the command line the tests can be run by running `npm test`. This will run the tests in Node, and then in PhantomJS.

The tests can also be run directly in the browser by opening `spec/run.html`. Note that the tests must be accessed through a web server, and not through a `file://` url.

### Creating

Here's how to create a new test:

 1. Create a new directory in `spec/`.
 2. Add the name of the directory to the bottom of the array in `spec/require-spec.js`. If the test should not be run on Node.js then instead of a string add an object: `{name: "YOUR-NAME", node: false}`.
 3. Inside the new directory create a `package.json` file. The contents of this file can just be `{}` (an empty JSON object), unless you are testing or using some of the `package.json` features.
 4. Inside the new directory create a `program.js` file. This is where the test is. The contents of this file depends on whether the test is synchronous or asynchronous:

    * Synchronous test

    ```javascript
    var test = require('test');

    // your test here
    test.assert(true === true, "assertion message");

    test.print('DONE', 'info');
    ```

    * Asynchronous test

    ```javascript
    var test = require('test');

    // your test starts here...
    return /* async call */.then(function () {
        // ...and continues here
        test.assert(true === true, "assertion message");

        test.print('DONE', 'info');
    });
    ```

Add any other modules you need inside the directory, including `node_modules` directories if you are testing package dependencies.
