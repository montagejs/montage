#!/usr/bin/env node
/*jshint node:true */
var util = require("util"),
    fs = require("fs"),
    path = require("path"),
    http = require("http"),
    Q = require("q"),
    wd = require("wd");

// how often to poll to see if the suite has finished
var POLL_TIME = 10000;

var program = require('commander');

program
  .version('0.0.0')
  .usage('[options] <test page url>')
  .option('-b, --browser <name>', 'Which browser to use. Default: chrome', 'chrome')
  .option('-v, --browserVersion <version>', 'Which version of the browser to use. Default: none (latest)')
  .option('-o, --os <name>', 'Which OS to use. Default: ANY', 'ANY')
  .option('-h, --host <host>', 'Webdriver host. Default: 127.0.0.1', '127.0.0.1')
  .option('-p, --port <port>', 'Webdriver port. Default: 4444', 4444)
  .option('-u, --sauceUser <username>', 'Saucelabs username.')
  .option('-k, --sauceKey <access key>', 'Saucelabs access key.')
  .option('-n, --name <name>', 'Name of the test run. Mainly for Saucelabs.', "")
  .option('-D, --debug', 'Enable debug mode.', false)
  .option('-O, --out <directory>', 'JUnit XML output directory. Default: ./report', './report')
  .parse(process.argv);

if (!program.args || program.args.length !== 1) {
    console.error("Exactly 1 test page url must be given");
    process.exit(1);
}

var DEBUG = !!program.debug;
var testUrl = program.args[0];

var browser = wd.remote(program.host, program.port, program.sauceUser, program.sauceKey);

// get the browser
browser.init({
    browserName: program.browser,
    platform: program.os,
    version: program.browserVersion,
    name: program.name
}, getTestPage);
function getTestPage(err, sessionId) {
    if (err) return fail(err);
    return browser.get(testUrl, pollPage);
}
function pollPage(err) {
    if (err) return fail(err);
    // run the script
    console.log("Running " + testUrl + " on " + program.host + ":" + program.port + " on " + program.browser);

    // poll until it's done
    // var done = Q.defer();
    var previousUpdate = -1;

    var poll = function() {
        process.stdout.write(".");
        browser.execute("return jasmine.getEnv().lastUpdate", function(err, lastUpdate) {
            if (DEBUG) {
                console.log(lastUpdate);
            }

            if (typeof lastUpdate !== "number") {
                fail("lastUpdate: " + lastUpdate);
                return;
            }

            if (lastUpdate !== 0 && lastUpdate === previousUpdate) {
                // newline
                console.log();
                getReports();
            } else {
                previousUpdate = lastUpdate;
                setTimeout(poll, POLL_TIME);
            }
        });
    };
    poll();

    // return done.promise;
}
function getReports(err) {
    if (err) return fail(err);
    return browser.execute("return __jasmine_reports;", writeReports);
}
function writeReports(err, reports) {
    if (err) return fail(err);

    browser.quit();

    if (!fs.existsSync(program.out)) {
        fs.mkdirSync(program.out);
    }

    // save XML reports to file
    for (var filename in reports) {
        if (reports.hasOwnProperty(filename)) {
            var outputFile = path.join(program.out, filename);
            console.log("Writing " + outputFile + " ...");
            try {
                fs.writeFileSync(outputFile, reports[filename], "utf8");
            } catch (e) {
                if (DEBUG) {
                    console.error(reports[filename]);
                }
            }
        }
    }

    console.log("Testing completed");
}
function fail(e) {
    var msg = e.message || e;
    console.error("Error: " + msg);
    browser.quit();
    process.exit(1);
}


