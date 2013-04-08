var PATH = require("path");
var spawn = require("child_process").spawn;
var util = require("util");

var Q = require("q");
var wd = require("wd");
var joey = require("joey");

var POLL_TIME = 250;

var phantom = spawn("phantomjs", ["--webdriver=127.0.0.1:8910"], {
    stdio: "inherit"
});

var browser = wd.promiseRemote("127.0.0.1", 8910);

var server = joey
.error()
.fileTree(PATH.resolve(__dirname, ".."))
.server();

server.listen(0).done();

var testPagePort = server.node.address().port;
var testPageUrl = "http://127.0.0.1:" + testPagePort + "/spec/run.html";
console.log("Test page at " + testPageUrl);

// wait for Ghost Driver to start running
Q.delay(2000)
.then(function () {
    return browser.init();
})
.then(function () {
    return browser.get(testPageUrl);
})
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
    var failures = log(suites, results);
    console.log();

    if (failures.length) {
        console.log("\nFailures:\n");
        console.log(failures.join("\n\n"));
        console.log("\n");

        throw failures.length + " failures";
    }
})
.finally(function () {
    server.stop();
})
.finally(function () {
    return browser.quit();
})
.finally(function () {
    phantom.kill();
})
.done();

function log(suites, results, name, failures) {
    name = name || "";
    failures = failures || [];

    for (var i = 0, len = suites.length; i < len; i++) {
        var suite = suites[i];
        if (suite.type === "spec") {
            var result = results[suite.id];
            if (result.result === "passed") {
                util.print(".");
            } else {
                util.print("F");
                failures.push(
                    name + suite.name + "\n" +
                    result.messages.map(function (msg) {
                        return "\t" + msg.message;
                    }).join("\n")
                );
            }
        }

        if (suite.children.length) {
            log(suite.children, results, name + suite.name + " ", failures);
        }
    }

    return failures;
}

