#!/usr/bin/env node
/*jshint node:true */
var util = require("util"),
    fs = require("fs"),
    path = require("path"),
    http = require("http"),
    Q = require("../../../packages/mr/packages/q"),
    wd = require("wd");

// how often to poll to see if the suite has finished
var POLL_TIME = 10000;

/**
 * Runs the test page in the given browser
 * @param  {string} testUrl page to test
 * @param  {Object} options  The options to use
 * @param  {function} log callback function where log messages will be sent
 * @return {Promise}         Resolved if the process completed, rejected if
 *                           there is an error
 */
var run = exports.run = function(testUrl, options, log) {
    var DEBUG = !!options.debug;
    var browser = wd.remote(options.host, options.port, options.sauceUser, options.sauceKey);

    return Q.ninvoke(browser, "init", {
        browserName: options.browser,
        platform: options.platform,
        version: options.browserVersion,
        name: options.name
    }).then(function getTestPage(sessionId) {
        return Q.ninvoke(browser, "get", testUrl);
    }).then(function pollPage() {
        // run the script
        log("Running " + testUrl + " on " + options.host + ":" + options.port + " on " + options.browser + options.browserVersion + " on " + options.platform);

        // poll until it's done
        var done = Q.defer();
        var previousUpdate = -1;

        var poll = function() {
            log(".");
            browser.execute("return jasmine.getEnv().lastUpdate", function(err, lastUpdate) {
                if (err) {
                    done.reject(err.cause.value.message);
                }

                if (DEBUG) {
                    log(lastUpdate);
                }

                if (typeof lastUpdate !== "number") {
                    done.reject("lastUpdate: " + lastUpdate);
                    return;
                }

                if (lastUpdate !== 0 && lastUpdate === previousUpdate) {
                    // newline
                    log();
                    done.resolve();
                } else {
                    previousUpdate = lastUpdate;
                    setTimeout(poll, POLL_TIME);
                }
            });
        };
        poll();

        return done.promise;
    }).then(function getReports() {
        return Q.ninvoke(browser, "execute", "return __jasmine_reports;");
    }).fin(function quitBrowser() {
        return Q.ninvoke(browser, "quit");
    });
};

var writeReports = exports.writeReports = function (reports, directory, log) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    }

    // save XML reports to file
    for (var filename in reports) {
        if (reports.hasOwnProperty(filename)) {
            var outputFile = path.join(directory, filename);
            log("Writing " + outputFile + " ...");
            try {
                fs.writeFileSync(outputFile, reports[filename], "utf8");
            } catch (e) {
                console.error(e);
            }
        }
    }
};

function main() {
    var program = require('commander');

    program
      .version('0.0.0')
      .usage('[options] <test page url>')
      .option('-b, --browser <name>', 'Which browser to use. Default: chrome', 'chrome')
      .option('-v, --browserVersion <version>', 'Which version of the browser to use. Default: none (latest)')
      .option('-P, --platform <name>', 'Which OS to use. Default: ANY', 'ANY')
      .option('-h, --host <host>', 'Webdriver host. Default: 127.0.0.1', '127.0.0.1')
      .option('-p, --port <port>', 'Webdriver port. Default: 4444', 4444)
      .option('-u, --sauceUser <username>', 'Saucelabs username.')
      .option('-k, --sauceKey <access key>', 'Saucelabs access key.')
      .option('-n, --name <name>', 'Name of the test run. Mainly for Saucelabs.', "")
      .option('-D, --debug', 'Enable debug mode.', false)
      .option('-O, --outputDir <directory>', 'JUnit XML output directory. Default: ./report', './report')
      .parse(process.argv);

    if (!program.args || program.args.length !== 1) {
        console.error("Exactly 1 test page url must be given");
        process.exit(1);
    }

    var log = function() {
        console.log.apply(console, arguments);
    };

    run(program.args[0], program, log).then(function(reports) {
        writeReports(reports, program.outputDir, log);
    }).then(function() {
        console.log("Testing completed");
        process.exit(0);
    }, function(err) {
        err = err || "Unknown error";
        var msg = err;
        console.error("Error: " + msg);
        process.exit(1);
    });
}

if (!module.parent) {
    main();
}


