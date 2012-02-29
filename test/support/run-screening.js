#!/usr/bin/env node
/*jshint node:true */
var util = require("util"),
    fs = require("fs"),
    http = require("http"),
    Q = require("./q.js");

var SCREENING_HOST = "127.0.0.1",
    SCREENING_PORT = "8081",
    API_URL = "/screening/api/v1",
    API_KEY = 5150;

var TEST_URL = "127.0.0.1:80/montage/test/run.html";

var DEBUG = false;

var opts = process.argv.slice();
// remove "node" and filename
opts.shift();
opts.shift();
if (opts.length > 0) {
    if (opts[0] === "--help") {
        console.log("Usage: " + process.argv.slice(0, 2).join(" ") + " [--debug] [host [port [test_url]]]");
        return;
    }
    if (opts[0] === "--debug") {
        DEBUG = true;
        opts.shift();
    }
    SCREENING_HOST = opts.shift() || SCREENING_HOST;
    SCREENING_PORT = opts.shift() || SCREENING_PORT;
    TEST_URL = opts.shift() || TEST_URL;
}

// setup
var screening_request = function(path, method, body) {
    var options = {
        hostname: SCREENING_HOST,
        port: SCREENING_PORT,
        path: [API_URL, path].join("/") + "?api_key=" + API_KEY,
        method: method || "GET"
    };

    if (DEBUG) {
        console.log("Request URL", options.hostname, options.port, options.path);
    }

    var deferred = Q.defer();
    var req = http.request(options, function(res) {
        res.setEncoding("utf8");
        var buffer = "";
        res.on("data", function(chunk) {
            buffer += chunk;
        });
        res.on("end", function() {
            if (DEBUG) {
                console.log("Response data:", buffer);
            }

            var data;
            try {
                data = JSON.parse(buffer);
            } catch (e) {
                // not JSON
                deferred.resolve(buffer);
                return;
            }

            if (data.error) {
                deferred.reject(data.error);
                return;
            }
            deferred.resolve(data);
        });
    });
    req.on("error", deferred.reject);

    req.setHeader("Content-Type", "application/json");
    req.end(body, "utf8");
    return deferred.promise;
};

var escapeBadXmlChars = function(string) {
    return string.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// store script here or in a file
var script = fs.readFileSync("jasmine-tests.screening.js", "utf8").replace("%TEST_URL%", TEST_URL);

// find the agent
screening_request("agents").then(function(data) {
    return data[0];
}).then(function(agent) {
    // run the script on screening
    console.log("Running " + TEST_URL + " on " + SCREENING_HOST + ":" + SCREENING_PORT + " on " + agent.id);
    return screening_request(
        ["agents", encodeURI(agent.id), "execute_serialized_code"].join("/"),
        "POST",
        JSON.stringify({code: script, name: "jasmine-tests.screening.js"})
    );
}).then(function(data) {
    // poll until it's done
    var done = Q.defer();
    var poll = setInterval(function() {
        screening_request("test_results/" + data.testId).then(function(data) {
            process.stdout.write(".");
            if (data.status !== "RUNNING") {
                console.log();
                clearInterval(poll);
                done.resolve(data);
            }
        });
    }, 1000);

    return done.promise;
}).then(function(data) {
    // get or create xml and save to file

    var output = "";

    // building xml by concatenating strings, woo!
    // but seriously, this is a really bad idea, but I don't want to include a
    // full library just for this.
    output += '<testsuite>\n';

    var asserts = data.asserts;
    for (var i = 0, len = asserts.length; i < len; i++) {
        var assert = asserts[i];
        if (assert.success) {
            output += '  <testcase classname="run.html" name="' + escapeBadXmlChars(assert.assertType+'('+assert.expectedValue+', '+assert.actualValue) + ')" />\n';
        } else {
            var short_message = "fail";
            if (assert.message !== null) {
                short_message = assert.message.split("\n", 1)[0];
            }
            // TODO escape string
            output += '  <testcase classname="run.html" name="'+ escapeBadXmlChars(assert.assertType+'('+assert.expectedValue+', '+assert.actualValue)+')">\n';
            output += '    <failure type="'+ escapeBadXmlChars(short_message) +'">'+ escapeBadXmlChars(assert.message) +'</failure>\n';
            output += '  </testcase>\n';
        }
    }

    output += '</testsuite>\n';

    fs.writeFileSync("../TEST-result.xml", output, "utf8");

    console.log("Testing completed");
}).fail(function(e) { // finally capture a rejection.
    var msg = e.message || e;
    console.error("Error: " + msg);
    return 1;
}).end();


