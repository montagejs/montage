jasmine.TrivialReporter = function(doc) {
    this.document = doc || document;
    this.suiteDivs = {};
    this.logRunningSpecs = false;
};

jasmine.TrivialReporter.prototype.createDom = function(type, attrs, childrenVarArgs) {
    var el = document.createElement(type);

    for (var i = 2; i < arguments.length; i++) {
        var child = arguments[i];

        if (typeof child === 'string') {
            var textElement = document.createElement("span");
            el.appendChild(textElement);
            textElement.innerHTML = child;
        } else {
            if (child) {
                el.appendChild(child);
            }
        }
    }

    for (var attr in attrs) {
        if (attr == "className") {
            el[attr] = attrs[attr];
        } else {
            el.setAttribute(attr, attrs[attr]);
        }
    }

    return el;
};

jasmine.TrivialReporter.prototype.reportRunnerStarting = function(runner) {
    var showPassed, resetCount;

    this.outerDiv = this.createDom('div', { className: 'jasmine_reporter' },
            this.createDom('div', { className: 'banner' },
                    this.createDom('div', { className: 'logo' },
                            this.createDom('a', { href: 'http://pivotal.github.com/jasmine/', target: "_blank" }, "Jasmine"),
                            this.createDom('span', { className: 'version' }, runner.env.versionString())),
                    this.createDom('div', { className: 'options' },
                            "Show ",
                            showPassed = this.createDom('input', { id: "__jasmine_TrivialReporter_showPassed__", type: 'checkbox' }),
                            this.createDom('label', { "for": "__jasmine_TrivialReporter_showPassed__" }, " passed ")
                    )
            ),

            this.runnerDiv = this.createDom('div', { className: 'runner running' },
                    this.createDom('a', { className: 'run_spec', href: '?' }, "[run all]"),
                    resetCount = this.createDom('a', { className: 'run_spec', href: '?' }, "[reset spec count]"),
                    this.runnerMessageSpan = this.createDom('span', {}, "Running..."),
                    this.finishedAtSpan = this.createDom('span', { className: 'finished-at' }, "")),

            this.createDom('div', {},
                     this.progress = this.createDom('progress', { className: 'progress', max: 0, value: 0})
            )
    );

    this.document.body.appendChild(this.outerDiv);

    var suites = runner.suites();
    for (var i = 0; i < suites.length; i++) {
        this.createSuiteDiv(suites[i]);
    }

    this.startedAt = new Date();

    var self = this;
    showPassed.onclick = function(evt) {
        if (showPassed.checked) {
            self.outerDiv.className += ' show-passed';
        } else {
            self.outerDiv.className = self.outerDiv.className.replace(/ show-passed/, '');
        }
    };
    resetCount.onclick = function(evt) {
        localStorage.setItem("jasmine-totalSpecs", 0);
    };


};

jasmine.TrivialReporter.prototype.createSuiteDiv = function(suite) {
    var suiteDiv;
    if (suite.parentSuite) {
        suiteDiv = this.getSuiteDiv(suite.parentSuite);
    } else {
        suiteDiv = this.createDom('div', { className: 'suite' },
                this.createDom('a', { className: 'description', href: '?spec=' + encodeURIComponent(suite.getFullName()) }, suite.description));
        this.suiteDivs[suite.id] = suiteDiv;
        this.outerDiv.appendChild(suiteDiv);
    }
    return suiteDiv;
};

jasmine.TrivialReporter.prototype.getSuiteDiv = function(suite) {
    var div = this.suiteDivs[suite.id];
    if (!div) {
        div = this.createSuiteDiv(suite);
    }
    return div;
};

jasmine.TrivialReporter.prototype.reportRunnerResults = function(runner) {
    var results = this.adjustResults(runner.results());

    var className = (results.failedCount > 0) ? "runner failed" : "runner passed";
    this.runnerDiv.setAttribute("class", className);
    //do it twice for IE
    this.runnerDiv.setAttribute("className", className);
    var specs = runner.specs();
    var specCount = 0;
    for (var i = 0; i < specs.length; i++) {
        if (this.specFilter(specs[i])) {
            specCount++;
        }
    }

    var totalSpecs = localStorage.getItem("jasmine-totalSpecs");

    if (totalSpecs < specCount) {
        totalSpecs = specCount;
        localStorage.setItem("jasmine-totalSpecs", totalSpecs);
    }
    if (specCount == totalSpecs) {
        this.progress.style.display = "none";
    }
    this.progress.max = totalSpecs;
    this.progress.value = specCount;
    var message = "" + specCount + "/" + totalSpecs + " spec" + (specCount == 1 ? "" : "s" ) + ", " + results.failedCount + " failure" + ((results.failedCount == 1) ? "" : "s");
    message += " in " + ((new Date().getTime() - this.startedAt.getTime()) / 1000) + "s";
    this.runnerMessageSpan.replaceChild(this.createDom('a', { className: 'description', href: '?'}, message), this.runnerMessageSpan.firstChild);
    this.finishedAtSpan.textContent = "Finished at " + new Date().toString();
};

jasmine.TrivialReporter.prototype.reportSuiteResults = function(suite) {
    var results = suite.results();
    var status = results.passed() ? 'passed' : 'failed';
    if (results.totalCount == 0) { // todo: change this to check results.skipped
        status = 'skipped';
    }
    var suiteDiv = this.getSuiteDiv(suite);
    if (!suiteDiv.classList.contains(status)) {
        suiteDiv.classList.add(status);
    }

};

jasmine.TrivialReporter.prototype.todoSpecCount = 0;
jasmine.TrivialReporter.prototype.adjustResults = function(results) {
    var newResults = {};
    newResults.failedCount = (results.failedCount ? results.failedCount : 0) - this.todoSpecCount;
    return newResults;
};

jasmine.TrivialReporter.prototype.reportSpecStarting = function(spec) {
    if (this.logRunningSpecs) {
        this.log('>> Jasmine Running ' + spec.suite.description + ' ' + spec.description + '...');
    }
};

jasmine.TrivialReporter.prototype.reportSpecResults = function(spec) {
    var results = spec.results();
    var status = results.passed() ? 'passed' : 'failed';
    if (results.skipped) {
        status = 'skipped';
    }
    var specTitle = spec.getFullName(),
        isTODO = spec.description.indexOf("TODO") === 0;
    if (isTODO) {
        specTitle = specTitle.replace(spec.description, "<strong>" + spec.description.substring(5, spec.description.length) + "</strong>");
    } else {
        specTitle = specTitle.replace(spec.description, "<strong>" + spec.description + "</strong>");
    }
    var specDiv = this.createDom('div', { className: 'spec ' + (isTODO ? "todo" : status) },
            specTitle);

    var resultItems = results.getItems();
    var messagesDiv = this.createDom('div', { className: 'messages' });
    for (var i = 0; i < resultItems.length; i++) {
        var result = resultItems[i];

        if (result.type == 'log') {
            messagesDiv.appendChild(this.createDom('div', {className: 'resultMessage log'}, result.toString()));
        } else if (result.type == 'expect' && result.passed && !result.passed()) {
            //FAIL
            if (isTODO) {
                //Unimplemented spec
                this.todoSpecCount++;
                messagesDiv.appendChild(this.createDom('div', {className: 'resultMessage todo'}, result.message));
            } else {
                var message = result.message;

                var originalStack = result.trace.stacktrace || result.trace.stack || "";
                originalStack = originalStack.split("\n");
                // Remove the first error message
                originalStack.shift();
                var stack = [];
                // Get rid of all stack trace lines that are inside Jasmine.
                for (var j = 0, len = originalStack.length; j < len; j++) {
                    if (originalStack[j].indexOf("jasmine") === -1) {
                        stack.push(originalStack[j].replace(/</g, '&lt;'));
                    }
                }
                if (stack.length > 0) {
                    message += "<br/>" + stack.join("<br/>");
                }
                messagesDiv.appendChild(this.createDom('div', {className: 'resultMessage fail'}, message.replace("Expected", "Expected<br/>").replace("to be", "<br/>to be<br/>")));
            }

            if (result.trace.stack) {
                var blocks = spec.queue.blocks;
                var blockIndex = blocks.length,
                block;
                while (blockIndex--) {
                    block = blocks[blockIndex];
                    if (block.func) {
                        break;
                    }
                }
                var specFunction = block.func;
                messagesDiv.appendChild(this.createDom('div', {className: 'code'}, js_beautify(typeof specFunction === "function" ? specFunction.toString() : "").replace(/</, "&lt;").replace(/>/, "&gt;")));
            }
        }
    }

    if (messagesDiv.childNodes.length > 0) {
        specDiv.appendChild(messagesDiv);
    }
    var suiteDiv = this.suiteDivs[spec.suite.id];
    if (suiteDiv == null) {
        suiteDiv = this.createSuiteDiv(spec.suite);
    }
    suiteDiv.appendChild(specDiv);
    document.body.scrollLeft = 0;
};
jasmine.TrivialReporter.prototype.loggerLoaded = false;
jasmine.TrivialReporter.prototype.log = function() {
    if (!this.loggerLoaded && require) {
        require.async("montage/core/logger")
        .then(function(exports) {
            jasmine.TrivialReporter.prototype.log = exports.logger("jasmine").debug;
            this.loggerLoaded = true;
        })
        .done();
    }
    var console = jasmine.getGlobal().console;
    if (console && console.log) {
        if (console.log.apply) {
            console.log.apply(console, arguments);
        } else {
            console.log(arguments); // ie fix: console.log.apply doesn't exist on ie
        }
    }
};

jasmine.TrivialReporter.prototype.getLocation = function() {
    return this.document.location;
};

jasmine.TrivialReporter.prototype.specFilter = function(spec) {
    var paramMap = {};
    var params = this.getLocation().search.substring(1).split('&');
    for (var i = 0; i < params.length; i++) {
        var p = params[i].split('=');
        paramMap[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
    }

    if (!paramMap["spec"]) {
        return true;
    }
    return spec.getFullName().indexOf(paramMap["spec"]) == 0;
};


// Domain Public by Eric Wendelin http://eriwen.com/ (2008)
//                  Luke Smith http://lucassmith.name/ (2008)
//                  Loic Dachary <loic@dachary.org> (2008)
//                  Johan Euphrosine <proppy@aminche.com> (2008)
//                  Oyvind Sean Kinsey http://kinsey.no/blog (2010)
//                  Victor Homyakov <victor-homyakov@users.sourceforge.net> (2010)

/**
 * Main function giving a function stack trace with a forced or passed in Error
 *
 * @cfg {Error} e The error to create a stacktrace from (optional)
 * @cfg {Boolean} guess If we should try to resolve the names of anonymous functions
 * @return {Array} of Strings with functions, lines, files, and arguments where possible
 */
function printStackTrace(options) {
    options = options || {guess: false};
    var ex = options.e || null, guess = !!options.guess;
    var p = new printStackTrace.implementation(), result = p.run(ex);
    return (guess) ? p.guessAnonymousFunctions(result) : result;
}

printStackTrace.implementation = function() {
};

printStackTrace.implementation.prototype = {
    /**
     * @param {Error} ex The error to create a stacktrace from (optional)
     * @param {String} mode Forced mode (optional, mostly for unit tests)
     */
    run: function(ex, mode) {
        ex = ex || this.createException();
        // examine exception properties w/o debugger
        //for (var prop in ex) {alert("Ex['" + prop + "']=" + ex[prop]);}
        mode = mode || this.mode(ex);
        if (mode === 'other') {
            return this.other(arguments.callee);
        } else {
            return this[mode](ex);
        }
    },

    createException: function() {
        try {
            this.undef();
        } catch (e) {
            return e;
        }
    },

    /**
     * Mode could differ for different exception, e.g.
     * exceptions in Chrome may or may not have arguments or stack.
     *
     * @return {String} mode of operation for the exception
     */
    mode: function(e) {
        if (e['arguments'] && e.stack) {
            return 'chrome';
        } else if (typeof e.message === 'string' && typeof window !== 'undefined' && window.opera) {
            // e.message.indexOf("Backtrace:") > -1 -> opera
            // !e.stacktrace -> opera
            if (!e.stacktrace) {
                return 'opera9'; // use e.message
            }
            // 'opera#sourceloc' in e -> opera9, opera10a
            if (e.message.indexOf('\n') > -1 && e.message.split('\n').length > e.stacktrace.split('\n').length) {
                return 'opera9'; // use e.message
            }
            // e.stacktrace && !e.stack -> opera10a
            if (!e.stack) {
                return 'opera10a'; // use e.stacktrace
            }
            // e.stacktrace && e.stack -> opera10b
            if (e.stacktrace.indexOf("called from line") < 0) {
                return 'opera10b'; // use e.stacktrace, format differs from 'opera10a'
            }
            // e.stacktrace && e.stack -> opera11
            return 'opera11'; // use e.stacktrace, format differs from 'opera10a', 'opera10b'
        } else if (e.stack) {
            return 'firefox';
        }
        return 'other';
    },

    /**
     * Given a context, function name, and callback function, overwrite it so that it calls
     * printStackTrace() first with a callback and then runs the rest of the body.
     *
     * @param {Object} context of execution (e.g. window)
     * @param {String} functionName to instrument
     * @param {Function} function to call with a stack trace on invocation
     */
    instrumentFunction: function(context, functionName, callback) {
        context = context || window;
        var original = context[functionName];
        context[functionName] = function instrumented() {
            callback.call(this, printStackTrace().slice(4));
            return context[functionName]._instrumented.apply(this, arguments);
        };
        context[functionName]._instrumented = original;
    },

    /**
     * Given a context and function name of a function that has been
     * instrumented, revert the function to it's original (non-instrumented)
     * state.
     *
     * @param {Object} context of execution (e.g. window)
     * @param {String} functionName to de-instrument
     */
    deinstrumentFunction: function(context, functionName) {
        if (context[functionName].constructor === Function &&
                context[functionName]._instrumented &&
                context[functionName]._instrumented.constructor === Function) {
            context[functionName] = context[functionName]._instrumented;
        }
    },

    /**
     * Given an Error object, return a formatted Array based on Chrome's stack string.
     *
     * @param e - Error object to inspect
     * @return Array<String> of function calls, files and line numbers
     */
    chrome: function(e) {
        var stack = (e.stack + '\n').replace(/^\S[^\(]+?[\n$]/gm, '').
          replace(/^\s+(at eval )?at\s+/gm, '').
          replace(/^([^\(]+?)([\n$])/gm, '{anonymous}()@$1$2').
          replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm, '{anonymous}()@$1').split('\n');
        stack.pop();
        return stack;
    },

    /**
     * Given an Error object, return a formatted Array based on Firefox's stack string.
     *
     * @param e - Error object to inspect
     * @return Array<String> of function calls, files and line numbers
     */
    firefox: function(e) {
        return e.stack.replace(/(?:\n@:0)?\s+$/m, '').replace(/^\(/gm, '{anonymous}(').split('\n');
    },

    opera11: function(e) {
        // "Error thrown at line 42, column 12 in <anonymous function>() in file://localhost/G:/js/stacktrace.js:\n"
        // "Error thrown at line 42, column 12 in <anonymous function: createException>() in file://localhost/G:/js/stacktrace.js:\n"
        // "called from line 7, column 4 in bar(n) in file://localhost/G:/js/test/functional/testcase1.html:\n"
        // "called from line 15, column 3 in file://localhost/G:/js/test/functional/testcase1.html:\n"
        var ANON = '{anonymous}', lineRE = /^.*line (\d+), column (\d+)(?: in (.+))? in (\S+):$/;
        var lines = e.stacktrace.split('\n'), result = [];

        for (var i = 0, len = lines.length; i < len; i += 2) {
            var match = lineRE.exec(lines[i]);
            if (match) {
                var location = match[4] + ':' + match[1] + ':' + match[2];
                var fnName = match[3] || "global code";
                fnName = fnName.replace(/<anonymous function: (\S+)>/, "$1").replace(/<anonymous function>/, ANON);
                result.push(fnName + '@' + location + ' -- ' + lines[i + 1].replace(/^\s+/, ''));
            }
        }

        return result;
    },

    opera10b: function(e) {
        // "<anonymous function: run>([arguments not available])@file://localhost/G:/js/stacktrace.js:27\n" +
        // "printStackTrace([arguments not available])@file://localhost/G:/js/stacktrace.js:18\n" +
        // "@file://localhost/G:/js/test/functional/testcase1.html:15"
        var ANON = '{anonymous}', lineRE = /^(.*)@(.+):(\d+)$/;
        var lines = e.stacktrace.split('\n'), result = [];

        for (var i = 0, len = lines.length; i < len; i++) {
            var match = lineRE.exec(lines[i]);
            if (match) {
                var fnName = match[1]? (match[1] + '()') : "global code";
                result.push(fnName + '@' + match[2] + ':' + match[3]);
            }
        }

        return result;
    },

    /**
     * Given an Error object, return a formatted Array based on Opera 10's stacktrace string.
     *
     * @param e - Error object to inspect
     * @return Array<String> of function calls, files and line numbers
     */
    opera10a: function(e) {
        // "  Line 27 of linked script file://localhost/G:/js/stacktrace.js\n"
        // "  Line 11 of inline#1 script in file://localhost/G:/js/test/functional/testcase1.html: In function foo\n"
        var ANON = '{anonymous}', lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
        var lines = e.stacktrace.split('\n'), result = [];

        for (var i = 0, len = lines.length; i < len; i += 2) {
            var match = lineRE.exec(lines[i]);
            if (match) {
                var fnName = match[3] || ANON;
                result.push(fnName + '()@' + match[2] + ':' + match[1] + ' -- ' + lines[i + 1].replace(/^\s+/, ''));
            }
        }

        return result;
    },

    // Opera 7.x-9.2x only!
    opera9: function(e) {
        // "  Line 43 of linked script file://localhost/G:/js/stacktrace.js\n"
        // "  Line 7 of inline#1 script in file://localhost/G:/js/test/functional/testcase1.html\n"
        var ANON = '{anonymous}', lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
        var lines = e.message.split('\n'), result = [];

        for (var i = 2, len = lines.length; i < len; i += 2) {
            var match = lineRE.exec(lines[i]);
            if (match) {
                result.push(ANON + '()@' + match[2] + ':' + match[1] + ' -- ' + lines[i + 1].replace(/^\s+/, ''));
            }
        }

        return result;
    },

    // Safari, IE, and others
    other: function(curr) {
        var ANON = '{anonymous}', fnRE = /function\s*([\w\-$]+)?\s*\(/i, stack = [], fn, args, maxStackSize = 10;
        while (curr && curr['arguments'] && stack.length < maxStackSize) {
            fn = fnRE.test(curr.toString()) ? RegExp.$1 || ANON : ANON;
            args = Array.prototype.slice.call(curr['arguments'] || []);
            stack[stack.length] = fn + '(' + this.stringifyArguments(args) + ')';
            curr = curr.caller;
        }
        return stack;
    },

    /**
     * Given arguments array as a String, subsituting type names for non-string types.
     *
     * @param {Arguments} object
     * @return {Array} of Strings with stringified arguments
     */
    stringifyArguments: function(args) {
        var result = [];
        var slice = Array.prototype.slice;
        for (var i = 0; i < args.length; ++i) {
            var arg = args[i];
            if (arg === undefined) {
                result[i] = 'undefined';
            } else if (arg === null) {
                result[i] = 'null';
            } else if (arg.constructor) {
                if (arg.constructor === Array) {
                    if (arg.length < 3) {
                        result[i] = '[' + this.stringifyArguments(arg) + ']';
                    } else {
                        result[i] = '[' + this.stringifyArguments(slice.call(arg, 0, 1)) + '...' + this.stringifyArguments(slice.call(arg, -1)) + ']';
                    }
                } else if (arg.constructor === Object) {
                    result[i] = '#object';
                } else if (arg.constructor === Function) {
                    result[i] = '#function';
                } else if (arg.constructor === String) {
                    result[i] = '"' + arg + '"';
                } else if (arg.constructor === Number) {
                    result[i] = arg;
                }
            }
        }
        return result.join(',');
    }
};
