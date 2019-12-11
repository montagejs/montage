/*
Copyright (c) 2008-2018 Pivotal Labs

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
function getJasmineRequireObj() {
    if (typeof window === "undefined") {
        global = self;
    } else {
        global = window;
    }
    if (typeof module !== 'undefined' && module.exports) {
        return exports;
    } else {
        global.jasmineRequire = global.jasmineRequire || {};
        return global.jasmineRequire;
    }
}

getJasmineRequireObj().console = function (jRequire, j$) {
    j$.ConsoleReporter = jRequire.ConsoleReporter();
};

getJasmineRequireObj().ConsoleReporter = function () {

    var noopTimer = {
        start: function () {},
        elapsed: function () {
            return 0;
        }
    };

    function ConsoleReporter(options) {
        var print = options.print,
            showColors = options.showColors || true,
            onComplete = options.onComplete || function () {},
            timer = options.timer || noopTimer,
            failedSpecs = [],
            pendingCount,
            ansi = {
                gray: '\x1b[90m',
                green: '\x1B[32m',
                red: '\x1B[31m',
                yellow: '\x1B[33m',
                none: '\x1B[0m'
            },
            failedSuites = [],
            specCount,
            failureCount,
            successCount;


        print('ConsoleReporter is deprecated and will be removed in a future version.');

        this.jasmineStarted = function () {
            specCount = 0;
            failureCount = 0;
            pendingCount = 0;
            successCount = 0;
            timer.start();
        };

        this.jasmineDone = function () {
            if (failedSpecs.length) {
                console.log("%cFailed Specs", "color:red;font-size: 24px;");
            }
            for (var i = 0; i < failedSpecs.length; i++) {
                specFailureDetails(failedSpecs[i]);
            }

            if (specCount > 0) {
                printLinebreak();

                var specCounts = specCount + ' ' + plural('spec', specCount) + ' (' +
                    successCount + ' ' + plural('success', successCount) + ', ' +
                    failureCount + ' ' + plural('failure', failureCount) + ')';

                if (pendingCount) {
                    specCounts += ', ' + pendingCount + ' pending ' + plural('spec', pendingCount);
                }

                print(specCounts);
            } else {
                print('No specs found');
            }

            var seconds = timer.elapsed() / 1000;
            print('Finished in ' + seconds + ' ' + plural('second', seconds));

            for (i = 0; i < failedSuites.length; i++) {
                suiteFailureDetails(failedSuites[i]);
            }

            onComplete(failureCount === 0);
        };

        this.specDone = function (result) {
            if (result.status !== "disabled" && result.status !== "pending") {
                specCount++;
            }
            if (result.status == 'passed') {
                successCount++;
            } else if (result.status == 'failed') {
                failureCount++;
                failedSpecs.push(result);
            }
            currentSpecs[result.status].push(result);
        };

        var currentSuite;
        var currentSpecs;
        this.suiteStarted = function (suite) {
            if (!currentSuite) {
                currentSuite = suite;
                currentSpecs = {
                    disabled: [],
                    failed: [],
                    passed: [],
                    pending: []
                };
            }
        };

        this.suiteDone = function (result) {
            var failed = currentSpecs.failed,
            passed = currentSpecs.passed;
            if (result.description === currentSuite.description) {
                if (failed.length) {
                    print(colored('red', result.description + " complete (" + failed.length + " Failures)"));
                } else if (passed.length){
                    print(colored('green', result.description + " complete (OK)"));
                } else {
                    print(colored('gray', result.description + " (SKIPPED)"));
                }
                currentSuite = null;
            }


            if (result.failedExpectations && result.failedExpectations.length > 0) {
                failureCount++;
                failedSuites.push(result);
            }
        };

        return this;

        function printLinebreak() {
            print('----------------------------------------');
        }

        function colored(color, str) {
            return showColors ? (ansi[color] + str + ansi.none) : str;
        }

        function plural(str, count) {
            var isPlural = count !== 1,
                needsE = str.endsWith("s");
            return isPlural ? needsE ? str + "es" : str + "s" : str;
        }

        function repeat(thing, times) {
            var arr = [];
            for (var i = 0; i < times; i++) {
                arr.push(thing);
            }
            return arr;
        }

        function indent(str, spaces) {
            var lines = (str || '').split('\n');
            var newArr = [];
            for (var i = 0; i < lines.length; i++) {
                newArr.push(repeat(' ', spaces).join('') + lines[i]);
            }
            return newArr.join('\n');
        }

        function specFailureDetails(result) {
            var message = [
                result.fullName
            ];


            for (var i = 0; i < result.failedExpectations.length; i++) {
                var failedExpectation = result.failedExpectations[i];
                message.push(colored('red', indent(failedExpectation.stack, 2)));
                message.push(colored('red', indent(failedExpectation.message, 2)));
                console.log(message.join("\n"));
            }
        }

        function suiteFailureDetails(result) {
            for (var i = 0; i < result.failedExpectations.length; i++) {
              print(colored('red', 'An error was thrown in an afterAll'));
              print(colored('red', 'AfterAll ' + result.failedExpectations[i].message));
            }
        }

    }

    return ConsoleReporter;
};
