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
                messagesDiv.appendChild(this.createDom('div', {className: 'resultMessage fail'}, result.message));

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
                messagesDiv.appendChild(this.createDom('div', {className: 'code'}, js_beautify(typeof specFunction === "function" ? specFunction.toString() : "")));
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
        require.async("montage/core/logger", function(exports) {
            jasmine.TrivialReporter.prototype.log = exports.logger("jasmine").debug;
            this.loggerLoaded = true;
        });
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
