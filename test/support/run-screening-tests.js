#!/usr/bin/env node
/*jshint node:true */
"use strict";

var util = require("util"),
    fs = require("fs"),
    http = require("http"),
    Q = require("q");

var SCREENING_HOST = "127.0.0.1",
    SCREENING_PORT = "8081",
    BROWSER = "chrome",
    API_URL = "/screening/api/v1",
    API_KEY = 5150;

var TEST_URL = "127.0.0.1:80/montage";

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
    SCREENING_HOST = opts.shift() || SCREENING_HOST;
    SCREENING_PORT = opts.shift() || SCREENING_PORT;
    TEST_URL = opts.shift() || TEST_URL;
}


//// Utility functions

var walk = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) {
        return done(err);
    }
    var i = 0;
    (function next() {
      var file = list[i++];
      if (!file) return done(null, results);
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            next();
          });
        } else {
          results.push(file);
          next();
        }
      });
    })();
  });
};

// setup
var screening_request = function(path, method, body) {
    var joinChar = (path.indexOf("?") === -1) ? "?" : "&";
    var options = {
        hostname: SCREENING_HOST,
        port: SCREENING_PORT,
        path: [API_URL, path].join("/") + joinChar + "api_key=" + API_KEY,
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

var escapeInvalidXmlChars = function(str) {
    return str.replace(/\&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/\>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/\'/g, "&apos;");
};

var generateJunitXml = function(result) {
    // get or create xml and save to file

    var filename;
    var output = "";
    var passes = 0;

    // building xml by concatenating strings, woo!
    // but seriously, this is a really bad idea, but I don't want to include a
    // full library just for this.
    output += '<testsuite>\n';

    var asserts = result.asserts;
    if (result.exception) {
        asserts = [result.exception];
    }

    for (var i = 0, len = asserts.length; i < len; i++) {
        var assert = asserts[i];

        filename = assert.fileName.replace("../", "").replace(".js", "");
        var short_message = assert.assertType+'('+assert.expectedValue+', '+assert.actualValue+')';
        if (assert.message !== null) {
            short_message = assert.message.split("\n", 1)[0];
        }

        if (assert.success) {
            passes++;
            output += '  <testcase classname="'+ filename +'" name="' + escapeInvalidXmlChars(short_message) + '" />\n';
        } else {
            output += '  <testcase classname="'+ filename +'" name="' + escapeInvalidXmlChars(short_message) + '">\n';
            output += '    <failure type="' + escapeInvalidXmlChars(assert.assertType+'('+assert.expectedValue+', '+assert.actualValue)+')">' +
                escapeInvalidXmlChars("Line " + assert.lineNumber) + "\n" +
                escapeInvalidXmlChars(assert.message || "") +
                      '    </failure>\n';
            output += '  </testcase>\n';
        }
    }

    output += '</testsuite>\n';

    console.log(result.status + ": " + filename + " (" + passes + "/" + asserts.length + ")");

    filename = "TEST-" + filename.replace(/[^a-z\\-]/g, "_") + ".xml";
    console.log("Writing ../" + filename);
    fs.writeFileSync("../" + filename, output, "utf8");
};

var runTest = function(test, agent) {
    if (!agent) {
        throw new Error("No agent available");
    }

    var done = Q.defer();

    // run the script on screening
    console.log("Running " + test.name + " on " + TEST_URL + " on " + SCREENING_HOST + ":" + SCREENING_PORT + " on " + agent.capabilities.browserName + " (" + agent.id + ")");
    screening_request(
        ["agents", encodeURI(agent.id), "execute_serialized_code"].join("/"),
        "POST", JSON.stringify(test)
    ).then(function(data) {
        // poll until it's done
        var poll = setInterval(function() {
            screening_request("test_results/" + data.testId).then(function(data) {
                process.stdout.write(".");
                if (data.status !== "RUNNING") {
                    // Write newline
                    console.log();
                    clearInterval(poll);
                    done.resolve(data);
                }
            });
        }, 1000);
    }).fail(function(data) {
        console.error("Failed to run " + test.name);
        console.error(data);
    });

    done.promise.then(generateJunitXml);
    return done.promise;
};



// Load all *-screening.js files here

var gotScripts = Q.defer();
var tests;
process.chdir(__dirname);
walk("..", gotScripts.node());

gotScripts.promise.then(function(files) {
    tests = files.filter(function(value) {
        return value.indexOf("-screening.js") !== -1;
    }).map(function(name) {
        return {name: name, code: fs.readFileSync(name, "utf8")};
    });
}).then(function() {
    return screening_request("scripts?name=config.js").then(function(data) {
        // Delete existing config.js scripts
        if (data.length >= 1) {
            var ps = [];
            for (var i = 0, len = data.length; i < len; i++) {
                ps.push(screening_request("scripts/" + data[i]._id, "DELETE"));
            }
            return Q.all(ps);
        }
    });
}).then(function() {
    // Add the config script to the server
    return screening_request("scripts", "POST",
        JSON.stringify({
            "name":"config.js", "code":"exports.config=function(){return { montage_url:'"+ TEST_URL +"'}; };"
        })
    );
}).then(function() {
    // find the agent
    return screening_request("agents");
}).then(function(data) {
    for (var i = 0, len = data.length; i < len; i++) {
        if (data[i].capabilities.browserName === BROWSER) {
            return data[i];
        }
    }
}).then(function(agent) {
    var promises = [];

    tests.forEach(function(test) {
        promises.push(runTest(test, agent));
    });

    return Q.all(promises);
}).then(function() {
    console.log("Testing completed");
}).fail(function(e) { // finally capture a rejection.
    var msg = e.message || e;
    console.error("Error: " + msg);
    return 1;
}).end();


