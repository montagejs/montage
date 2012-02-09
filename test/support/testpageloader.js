/**
 * @see https://developer.mozilla.org/en/DOM/HTMLIFrameElement
 */
var Montage = require("montage").Montage,
    dom = require("montage/ui/dom"),
    URL = require("montage/core/url");

var TestPageLoader = exports.TestPageLoader = Montage.create(Montage, {
    init: {
        enumerable: false,
        value: function() {
            if (typeof window.testpage === "undefined") {
                if (!this.iframe) {
                    this.iframe = document.createElement("iframe");
                    this.iframe.id = "testpage";
                    document.body.appendChild(this.iframe);
                }
                window.testpage = this;
                this.loaded = false;
                return this;
            } else {
                return window.testpage;
            }
        }
    },

    iframeSrc: {
        value: null
    },

    drawHappened: {
        value: false
    },

    willNeedToDraw: {
        value: false
    },

    testQueue: {
        value: []
    },

    loading: {
        value: false
    },

    queueTest: {
        value: function(testName, options, callback) {
            console.log("TestPageLoader.queueTest() - " + testName);
            var testPage = window.testpage,
                test;
            if (!testPage) {
                testPage = TestPageLoader.create().init();
            }
            if (typeof options === "function") {
                options = { callback: options};
            } else {
                options.callback = callback;
            }
            options.testName = testName;
            // FIXME Hack to get current directory
            options.directory = this.queueTest.caller.caller.arguments[2].directory;
            testPage.testQueue.push(options);
            return testPage;
        }
    },

    endTest: {
        value: function() {
            this.loading = false;
            this.callNext();
        }
    },

    callNext: {
        value: function() {
            if (!this.loading && this.testQueue.length !== 0) {
                this.loadTest(this.testQueue.shift());
                this.loading = true;
            }
        }
    },

    loadTest: {
        value: function(test) {
            var testName = test.testName,
                testCallback = test.callback,
                timeoutLength = test.timeoutLength;
            this.loaded = false;
            if (test.src) {
                this.iframe.src = "../test/" + test.src;
            } else {
                this.iframe.src = URL.resolve(test.directory, (testName.indexOf("/") > -1 ? testName : testName + "/" + testName) + ".html");
            }
            var theTestPage = this;

            //kick off jasmine tests
            var resumeJasmineTests = function() {
                testCallback();
                var env = jasmine.getEnv();
                var currentSuite = env.currentSuite;
                if (currentSuite == null) {
                    currentSuite = env.currentSpec.suite;
                }
                var originalFinish = currentSuite.finish;
                currentSuite.finish = function() {
                    originalFinish.apply(currentSuite, arguments);
                    theTestPage.endTest(test);
                };
                var runner = jasmine.getEnv().currentRunner();
                runner.queue.start(function () {
                    runner.finishCallback();
                });
             };

            //set the timeout so that the jasmine suite runs if the pages fails to load.
            var pageLoadTimedOut = function() {
                console.log("Page load timed out for test named: " + test.testName);
                resumeJasmineTests()
            };

            if (!timeoutLength) {
                timeoutLength = 2000;
            }
            var pageLoadTimeout = setTimeout(pageLoadTimedOut, timeoutLength);

            //
            var iframeLoad = function() {
                // implement global function that montage is looking for at load
                // this is little bit ugly and I'd like to find a better solution
                theTestPage.window.montageWillLoad = function() {
                    var firstDraw = true;
                    this.window.montageRequire.async("ui/component", function (COMPONENT) {
                        var root = COMPONENT.__root__;
                        // override the default drawIfNeeded behaviour
                        var originalDrawIfNeeded = root.drawIfNeeded;
                        root.drawIfNeeded = function() {
                            if (pageLoadTimeout) {
                                clearTimeout(pageLoadTimeout);
                            }
                            originalDrawIfNeeded.call(root);
                            theTestPage.drawHappened++;
                            if(firstDraw) {
                                theTestPage.loaded = true;
                                // assign the application delegate to test so that the convenience methods work
                                if (! theTestPage.window.test && theTestPage.window.document.application) {
                                    theTestPage.window.test = theTestPage.window.document.application.delegate;
                                }
                                if (typeof testCallback === "function") {
                                    if (test.firstDraw) {
                                        resumeJasmineTests();
                                    } else {
                                        // francois HACK
                                        // not sure how to deal with this
                                        // if at first draw the page isn't complete the tests will fail
                                        // so we wait an arbitrary 1s for subsequent draws to happen...
                                        setTimeout(resumeJasmineTests, 1000);
                                    }
                                }
                                firstDraw = false;
                            };
                            theTestPage.willNeedToDraw = false;
                        };
                        var originalAddToDrawList = root._addToDrawList;
                        root._addToDrawList = function(childComponent) {
                            originalAddToDrawList.call(root, childComponent);
                            theTestPage.willNeedToDraw = true;
                        };
                    });
                }
                theTestPage.iframe.removeEventListener("load", iframeLoad, true);
            }
            this.iframe.addEventListener("load", iframeLoad, true);



         }
    },

    load: {
        value: function(event) {

        }
    },

    unloadTest: {
        enumerable: false,
        value: function(testName) {
            this.loaded = false;
            this.iframe.src = "";
            return this;
        }
    },

    waitForDraw: {
        value: function(numDraws, forceDraw) {
            var theTestPage = this;
            this.drawHappened = false;

            if (!numDraws) {
                numDraws = 1;
            }

            waitsFor(function() {
                return theTestPage.drawHappened == numDraws;
            }, "component drawing",1000);
            if(forceDraw) {
                root['drawTree']();
            }
        }
    },

    getElementById: {
        enumerable: false,
        value: function(elementId) {
            return this.iframe.contentDocument.getElementById(elementId);
        }
    },

    querySelector: {
        enumerable: false,
        value: function(selector) {
            return this.iframe.contentDocument.querySelector(selector);
        }
    },

    querySelectorAll: {
        enumerable: false,
        value: function(selector) {
            return this.iframe.contentDocument.querySelectorAll(selector);
        }
    },

    test: {
        enumerable: false,
        get: function() {
            return this.window.test;
        }
    },

    window: {
        get: function() {
            return this.iframe.contentWindow;
        }
    },

    mouseEvent: {
        enumerable: false,
        value: function(eventInfo, eventName, callback) {
            if (!eventName) {
                eventName = "click";
            }
            eventInfo.clientX = eventInfo.clientX || eventInfo.target.offsetLeft;
            eventInfo.clientY = eventInfo.clientY || eventInfo.target.offsetTop;

            var doc = this.iframe.contentDocument,
                event = doc.createEvent('MouseEvents');

            event.initMouseEvent(eventName, true, true, doc.defaultView,
                null, null, null, eventInfo.clientX, eventInfo.clientY,
                false, false, false, false,
                0, null);
            eventInfo.target.dispatchEvent(event);
            if (typeof callback === "function") {
                if(this.willNeedToDraw) {
                    this.waitForDraw();
                    runs(callback);
                } else {
                    callback();
                }
            }
            return eventInfo;
        }
    },

    touchEvent: {
        enumerable: false,
        value: function(eventInfo, eventName, callback) {
            if (!eventName) {
                eventName = "touchstart";
            }
            var doc = this.iframe.contentDocument,
                simulatedEvent = doc.createEvent("CustomEvent"),
                touch = {};

            touch.clientX = eventInfo.clientX;
            touch.clientY = eventInfo.clientY;
            touch.target = eventInfo.target;

            simulatedEvent.initEvent(eventName, true, true, doc.defaultView, 1, null, null, null, null, false, false, false, false, 0, null);
            simulatedEvent.touches = [touch];
            simulatedEvent.changedTouches = [touch];
            eventInfo.target.dispatchEvent(simulatedEvent);
            if (typeof callback === "function") {
                if(this.willNeedToDraw) {
                    this.waitForDraw();
                    runs(callback);
                } else {
                    callback();
                }
            }
            return eventInfo;
        }
    },

    evaluateNode: {
        enumerable: false,
        value: function(xpathExpression, contextNode, namespaceResolver, resultType, result) {
            if (!contextNode) {
                contextNode = this.iframe.contentDocument;
            }
            if (!resultType) {
                resultType = XPathResult.FIRST_ORDERED_NODE_TYPE;
            }
            pathResult = this.iframe.contentDocument.evaluate(xpathExpression, contextNode, namespaceResolver, resultType, result);
            if (pathResult) {
                switch (pathResult.resultType) {
                    case XPathResult.NUMBER_TYPE:
                        return pathResult.numberValue;
                    case XPathResult.BOOLEAN_TYPE:
                        return pathResult.booleanValue;
                    case XPathResult.STRING_TYPE:
                        return pathResult.stringValue;
                    default:
                        return pathResult.singleNodeValue;
                }
            }
        }
    },

    evaluateBoolean: {
        enumerable: false,
        value: function(xpathExpression) {
            return this.evaluateNode(xpathExpression, null, null, XPathResult.BOOLEAN_TYPE, null);
        }
    },

    evaluateNumber: {
        enumerable: false,
        value: function(xpathExpression) {
            return this.evaluateNode(xpathExpression, null, null, XPathResult.NUMBER_TYPE, null);
        }
    },

    evaluateString: {
        enumerable: false,
        value: function(xpathExpression) {
            return this.evaluateNode(xpathExpression, null, null, XPathResult.STRING_TYPE, null);
        }
    },

    handleEvent: {
        enumerable: false,
        value: function(event) {
            if (this[event.type]) {
                this[event.type](event);
            }
        }
    },

    loaded: {
        value: false
    },

    iframe: {
        value: null
    }
});

var EventInfo = exports.EventInfo = Montage.create(Montage, {

    target: {
        value: null
    },

    clientX: {
        value: null
    },

    clientY: {
        value: null
    },

    pageX: {
        value: null
    },

    pageY: {
        value: null
    },

    initWithElement: {
        value: function(element) {
            if (element != null) {
                this.target = element;

                var elementDelta = this.positionOfElement(element);
                this.clientX = elementDelta.x + element.offsetWidth / 2;
                this.clientY = elementDelta.y + element.offsetHeight / 2;
                this.pageX = elementDelta.x + element.offsetWidth / 2;
                this.pageY = elementDelta.y + element.offsetHeight / 2;

            } else {
                 this.target =  window.testpage.window.document;
            }
            return this;
        }
    },

    initWithSelector: {
        value: function(selector) {
            var element = this.querySelector(selector);
            return this.initWithElement(element);
       }
    },

    initWithElementAndPosition: {
        value: function(element, x, y) {
            this.initWithElement(element);
            this.clientX = x;
            this.clientY = y;
            return this;
        }
    },

    positionOfElement: {
        value: function(element) {
            return dom.convertPointFromNodeToPage(element);
        }
    },

    move: {
        value: function(x, y) {
            if (x) {
                this.clientX += x;
                this.pageX += x;
            }
            if (y) {
                this.clientY += y;
                this.pageY += y;
            }
        }
    },

    testPageLoader: {
        value: null
    }

});


window.loaded = function() {
    window.testpage.loaded = true;
};
