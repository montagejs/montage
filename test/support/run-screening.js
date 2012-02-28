#!/usr/bin/env node
/*jshint node:true */
var util = require("util"),
    fs = require("fs"),
    http = require("http"),
    Q = require("./q.js");

var SCREENING_HOST = "127.0.0.1",
    SCREENING_PORT = "8082",
    API_URL = "/screening/api/v1",
    API_KEY = 5150;

var DEBUG = true;

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

// store script here or in a file
var script = fs.readFileSync("jasmine-tests.screening.js", "utf8");

// find the agent
screening_request("agents").then(function(data) {
    return data[0];
}).then(function(agent) {
    // run the script on screening
    return screening_request(
        ["agents", agent.id, "execute_serialized_code"].join("/"),
        "POST",
        JSON.stringify({code: script, name: "jasmine-tests.screening.js"})
    );
}).then(function(data) {
    // poll until it's done
    var done = Q.defer();
    var poll = setInterval(function() {
        screening_request("test_results/" + data.testId).then(function(data) {
            if (data.status !== "RUNNING") {
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
    output += '<testsuite>\n';

    var asserts = data.asserts;
    for (var i = 0, len = asserts.length; i < len; i++) {
        var assert = asserts[i];
        if (assert.success) {
            output += '  <testcase name="'+assert.assertType+'('+assert.expectedValue+', '+assert.actualValue+')" />\n';
        } else {
            var short_message = "fail";
            if (assert.message !== null) {
                short_message = assert.message.split("\n", 1);
            }
            // TODO escape string
            output += '  <testcase name="'+assert.assertType+'('+assert.expectedValue+', '+assert.actualValue+')">\n';
            output += '    <failure type="'+short_message+'">'+assert.message+'</failure>\n';
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


