#!/usr/bin/env node
/*jshint node:true */
var util = require("util"),
    fs = require("fs"),
    http = require("http"),
    Q = require("./q.js"),
    wd_original = require("./wd.js");

// Make webdriver use promises
var webdriver = wd_original.webdriver;
for (var propName in wd_original.webdriver.prototype) {
    var prop = wd_original.webdriver.prototype[propName];
    if (wd_original.webdriver.prototype.hasOwnProperty(propName) && typeof prop === "function") {
        webdriver.prototype[propName] = Q.node(prop);
    }
}
var wd = {
    remote: function(host, port, username, accessKey) {
        return new webdriver(host, port, username, accessKey);
    }
};

var WEBDRIVER_HUB_HOST = "127.0.0.1",
    WEBDRIVER_HUB_PORT = "4444",
    BROWSER = "chrome";

var TEST_URL = "127.0.0.1:80/montage/test/run-xml.html";

var DEBUG = false;

var opts = process.argv.slice();
// remove "node" and filename
opts.shift();
opts.shift();
if (opts.length > 0) {
    if (opts[0] === "--help") {
        console.log("Usage: " + process.argv.slice(0, 2).join(" ") + " [--debug] [browser [host [port [test_url]]]]");
        return;
    }
    if (opts[0] === "--debug") {
        DEBUG = true;
        opts.shift();
    }
    BROWSER = opts.shift() || BROWSER;
    WEBDRIVER_HUB_HOST = opts.shift() || WEBDRIVER_HUB_HOST;
    WEBDRIVER_HUB_PORT = opts.shift() || WEBDRIVER_HUB_PORT;
    TEST_URL = opts.shift() || TEST_URL;
}

var browser = wd.remote(WEBDRIVER_HUB_HOST, WEBDRIVER_HUB_PORT);

// get the browser
browser.init({browserName: BROWSER}).then(function(sessionId) {
    return browser.get(TEST_URL);
}).then(function() {
    // run the script
    console.log("Running " + TEST_URL + " on " + WEBDRIVER_HUB_HOST + ":" + WEBDRIVER_HUB_PORT + " on " + BROWSER);

    // poll until it's done
    var done = Q.defer();
    var previousUpdate = -1;

    var poll = function() {
        process.stdout.write(".");
        browser.execute("return jasmine.getEnv().lastUpdate").then(function(lastUpdate) {
            if (DEBUG) {
                console.log(lastUpdate);
            }

            if (lastUpdate === previousUpdate) {
                // newline
                console.log();
                clearInterval(poll);
                done.resolve();
            } else {
                previousUpdate = lastUpdate;
                setTimeout(poll, 5000);
            }
        });
    };
    poll();

    return done.promise;
}).then(function() {
    return browser.execute("return __jasmine_reports;");
}).then(function(reports) {
    browser.quit();

    // save XML reports to file
    for (var filename in reports) {
        if (reports.hasOwnProperty(filename)) {
            console.log("Writing ../" + filename + " ...");
            fs.writeFileSync("../" + filename, reports[filename], "utf8");
        }
    }

    console.log("Testing completed");
}).fail(function(e) { // finally capture a rejection.
    var msg = e.message || e;
    console.error("Error: " + msg);
    browser.quit();
    return 1;
}).end();


