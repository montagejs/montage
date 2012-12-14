#!/usr/bin/env node

/*
Goes from a fresh clone of this repo to running the Montage tests on
Saucelabs. Depends on the following environment variables:

These are provided by Jenkins and the Saucelabs plugin:
$SELENIUM_HOST
$SELENIUM_POST
$SAUCE_USER_NAME
$SAUCE_USER_KEY
$BUILD_TAG

These should be set in Jenkins, usually in a Configuration Matrix
$browser
$platform

$browser can contain a version seperated by a equals sign,
e.g. "internet explorer=10"

Writes the reports to report/
*/

var spawn = require('child_process').spawn;
var path = require('path');
var Q = require("../../../packages/mr/packages/q");

// Wrap shelling out to `npm install` in a promise
function npmInstall(directory) {
    var deferred = Q.defer();
    var proc = spawn("npm", ["install"], {
        cwd: directory,
        stdio: "inherit"
    });
    proc.on('exit', function(code) {
        if (code !== 0) {
            deferred.reject(new Error("npm install in " + directory + " exited with code " + code));
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
}

Q.all([
    // Install Montage npm dependencies
    npmInstall(path.join(__dirname, "..", "..", "..")),
    // Install test npm dependencies
    npmInstall(__dirname)
]).then(run).done();

function run() {
    // Dependencies are only available after we've run npm install
    var connect = require("connect");
    var tests = require("./run-tests-remote");

    // Big enough range that collisions with existing test servers are
    // unlikely
    var httpServerPort = Math.floor(Math.random() * 65000 - 2000) + 2000;
    // Caching is ok because Saucelabs start a new VM with an empty cache for
    // each test run, and no Montage files change during the test run.
    var oneDay = 24*60*60*1000;
    // FIXME: this is a bit fragile
    var montageRoot = path.resolve(__dirname, "..", "..", "..");
    var server = connect()
      .use(connect.static(montageRoot, { maxAge: oneDay }))
      .listen(httpServerPort);

    var log = function() {
        console.log.apply(console, arguments);
    };

    var testUrl = "http://localhost:" + httpServerPort + "/test/run-xml.html";


    var browserDetails = [];
    if (process.env["browser"]) {
        browserDetails = process.env["browser"].split("=");
    }

    return tests.run(testUrl, {
        browser: browserDetails[0],
        browserVersion: browserDetails[1],
        platform: process.env["platform"],
        host: process.env["SELENIUM_HOST"],
        port: process.env["SELENIUM_PORT"],
        sauceUser: process.env["SAUCE_USER_NAME"],
        sauceKey: process.env["SAUCE_API_KEY"],
        name: process.env["BUILD_TAG"]
    }, log).then(function(reports) {
        tests.writeReports(reports, "report", log);
    }).fin(function() {
        server.close();
    });
}
