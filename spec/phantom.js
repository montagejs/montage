var COVERAGE = !!process.env["npm_config_coverage"];

var PATH = require("path");
var spawn = require("child_process").spawn;
var util = require("util");

var Q = require("q");
var phantom = require("phantom-wd");
var joey = require("joey");
var Apps = require("q-io/http-apps");

if (COVERAGE) {
    var IGNORE_RE = /spec|packages/;

    var FS = require("q-io/fs");
    var istanbul = require("istanbul");
    var instrumenter = new istanbul.Instrumenter();

    var fileTree = function (path) {
        return Apps.FileTree(path, {
            // use a custom file reader to instrument the code
            file: function (request, path, contentType, fs) {
                if (path.match(/.js$/) && !path.match(IGNORE_RE)) {
                    // instrument JS files
                    return FS.read(path, "r", "utf8").then(function (original) {
                        var response = Q.defer();
                        instrumenter.instrument(original, path, function (err, instrumented) {
                            if (err) {
                                response.reject(err);
                                return;
                            }

                            response.resolve({
                                status: 200,
                                headers: {
                                    "content-type": "application/javascript",
                                    "content-length": instrumented.length
                                },
                                body: [instrumented],
                                file: path
                            });
                        });
                        return response.promise;
                    });
                }

                // otherwise just serve the file
                return Apps.file(request, path, contentType, fs);
            }
        });
    };
} else {
    var fileTree = Apps.FileTree;
}

var TESTS_FAILED = {};
var POLL_TIME = 250;

var server = joey
.error(true)
.app(fileTree(PATH.resolve(__dirname, "..")))
.server();

server.listen(0).done();

var testPagePort = server.node.address().port;
var testPageUrl = "http://127.0.0.1:" + testPagePort + "/spec/run.html";
console.log("Test page at " + testPageUrl);

// Start PhantomJS webdriver
phantom()
.then(function (browser) {
    return browser.get(testPageUrl)
    .then(function () {
        var done = Q.defer();

        var poll = function() {
            browser.execute("return typeof jsApiReporter !== 'undefined' ? jsApiReporter.finished : false").then(function (isFinished) {
                if (isFinished) {
                    done.resolve();
                } else {
                    setTimeout(poll, POLL_TIME);
                }
            }, done.reject);
        };
        poll();

        return done.promise;
    })
    .then(function () {
        return browser.execute("return [jsApiReporter.suites(), jsApiReporter.results()]");
    })
    .spread(function (suites, results) {
        var info = log(suites, results);

        if (info.failures.length) {
            console.log("\nFailures:\n");
            console.log(info.failures.join("\n\n"));
        }

        var msg = '';
            msg += info.specsCount + ' test' + ((info.specsCount === 1) ? '' : 's') + ', ';
            msg += info.totalCount + ' assertion' + ((info.totalCount === 1) ? '' : 's') + ', ';
            msg += info.failedCount + ' failure' + ((info.failedCount === 1) ? '' : 's');

        console.log();
        console.log(msg);

        if (info.failures.length) {
            throw TESTS_FAILED;
        }
    })
    .then(function () {
        if (!COVERAGE) {
            return;
        }

        return browser.execute("return window.__coverage__")
        .then(function (coverage) {
            var reporter = istanbul.Report.create("lcov");
            var collector = new istanbul.Collector();

            collector.add(coverage);

            console.log("Writing coverage reports.");
            reporter.writeReport(collector);
        });
    })
    .finally(function () {
        server.stop();
    })
    .finally(function () {
        return browser.quit();
    });
})
.fail(function (err) {
    if (err === TESTS_FAILED) {
        process.exit(1);
    }
    throw err;
})
.done();

function log(suites, results, name, info) {
    name = name || "";
    info = info || {specsCount: 0, totalCount: 0, failedCount: 0, failures: []};

    for (var i = 0, len = suites.length; i < len; i++) {
        var suite = suites[i];
        if (suite.type === "spec") {
            var result = results[suite.id];

            info.specsCount++;
            info.totalCount += result.messages.length;
            if (result.result === "passed") {
                util.print(".");
            } else {
                util.print("F");
                var msg = suite.name + "\n";
                for (var j = 0; j < result.messages.length; j++) {
                    var message = result.messages[j];
                    if (message.passed_) continue;
                    info.failedCount++;
                    msg += "\t" + message.message + "\n";
                }
                info.failures.push(msg);
            }
        }

        if (suite.children.length) {
            log(suite.children, results, name + suite.name + " ", info);
        }
    }

    return info;
}

